import { BriefRequestSchema, type BriefUrlContext, type BriefResult } from '#shared/contracts'
import { crawlPage, CrawlError } from '../services/crawler'
import { captureScreenshot, ScreenshotError } from '../services/screenshot'
import { extractPalette } from '../services/palette'
import { describeScreenshot, generatePromptsFromBrief, LLMError } from '../providers/openrouter-text'
import { getApiKey } from '../services/apiKeys'
import { getProviderMode } from '../services/providerMode'
import { createLogger } from '../utils/logger'
import pLimit from 'p-limit'

const log = createLogger('brief')

const URL_CONCURRENCY = 2
const GLOBAL_TIMEOUT_MS = 30_000

export default defineEventHandler(async (event) => {
  const mode = await getProviderMode()
  const mockMode = mode !== 'live' // brief n'a pas de fixture-replay, on traite mock-real comme mock pour l'instant
  const body = await readBody(event)
  log.info('POST /api/brief received', { mode, urls: body?.urls?.length ?? 0 })

  const parsed = BriefRequestSchema.safeParse(body)
  if (!parsed.success) {
    log.error('invalid payload', parsed.error.flatten())
    throw createError({ statusCode: 400, statusMessage: 'Invalid payload', data: parsed.error.flatten() })
  }
  const { artDirection, mood, uiStyle, typography, palette, urls } = parsed.data

  // En mode mock, l'utilisateur n'a pas besoin de clé OpenRouter (réponses simulées)
  const apiKey = mockMode ? 'MOCK_KEY' : getApiKey('openrouter')
  if (!apiKey) {
    log.error('OpenRouter API key missing')
    throw createError({ statusCode: 401, statusMessage: 'OpenRouter API key required (set in Settings)' })
  }

  setHeader(event, 'Content-Type', 'text/event-stream')
  setHeader(event, 'Cache-Control', 'no-cache')
  setHeader(event, 'Connection', 'keep-alive')

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      let closed = false
      const send = (eventName: string, data: unknown) => {
        if (closed) return
        try {
          controller.enqueue(encoder.encode(`event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`))
        } catch {
          closed = true
        }
      }

      const abortController = new AbortController()
      const nodeReq = event.node.req
      const onClose = () => abortController.abort()
      nodeReq.on('close', onClose)

      // Garde-fou global timeout
      const globalTimer = setTimeout(() => {
        log.warn(`global timeout ${GLOBAL_TIMEOUT_MS}ms reached`)
        abortController.abort()
      }, GLOBAL_TIMEOUT_MS)

      send('start', { urlCount: urls.length })

      try {
        // 1. Pour chaque URL fournie : crawl + screenshot + palette + vision (parallèle limité)
        const contexts: BriefUrlContext[] = new Array(urls.length)
        if (urls.length > 0) {
          const limit = pLimit(URL_CONCURRENCY)
          await Promise.all(
            urls.map((url, idx) =>
              limit(async () => {
                if (abortController.signal.aborted) {
                  send('url-skipped', { idx, url })
                  return
                }
                send('url-start', { idx, url })

                let crawl
                try {
                  crawl = await crawlPage(url, 8000)
                } catch (err) {
                  if (err instanceof CrawlError) {
                    send('url-error', { idx, url, code: err.code, msg: err.message })
                    throw err
                  }
                  throw err
                }
                send('url-progress', { idx, url, step: 'crawl-done' })

                let shot
                try {
                  shot = await captureScreenshot(url, 8000)
                } catch (err) {
                  if (err instanceof ScreenshotError) {
                    send('url-error', { idx, url, code: err.code, msg: err.message })
                    throw err
                  }
                  throw err
                }
                send('url-progress', { idx, url, step: 'screenshot-done' })

                const extractedPalette = await extractPalette(shot.fullBuffer)
                send('url-progress', { idx, url, step: 'palette-done', palette: extractedPalette.map((p) => p.hex) })

                let visualDescription = ''
                if (mockMode) {
                  visualDescription = `[mock] Description visuelle simulée pour ${url}.`
                } else {
                  try {
                    visualDescription = await describeScreenshot(shot.fullBuffer, { url }, apiKey, abortController.signal)
                  } catch (err) {
                    if (err instanceof LLMError) {
                      send('url-error', { idx, url, code: err.code, msg: err.message })
                      throw err
                    }
                    throw err
                  }
                }
                send('url-progress', { idx, url, step: 'vision-done' })

                contexts[idx] = {
                  url,
                  title: crawl.title,
                  metaDescription: crawl.metaDescription,
                  textExcerpt: crawl.textExcerpt,
                  miniDataUrl: shot.miniDataUrl,
                  palette: extractedPalette,
                  visualDescription,
                }
                send('url-done', { idx, url })
              }),
            ),
          )
        }

        // 2. Construire markdown contextuel agrégé
        const contextMarkdown = buildContextMarkdown(contexts)
        send('context-built', { length: contextMarkdown.length })

        // 3. Appel LLM Haiku texte → 3 COMPLÉMENTS (pas prompts complets)
        let prompts
        if (mockMode) {
          prompts = mockGeneratedPrompts({ artDirection, mood, uiStyle, typography, palette })
          send('llm-progress', { mock: true })
        } else {
          send('llm-start', { model: 'anthropic/claude-haiku-4.5' })
          prompts = await generatePromptsFromBrief(
            { artDirection, mood, uiStyle, typography, palette, contextMarkdown },
            apiKey,
            abortController.signal,
          )
        }

        const result: BriefResult = {
          artDirection, mood, uiStyle, typography, palette,
          urls, contexts: contexts.filter(Boolean), contextMarkdown, prompts,
        }
        send('done', result)
        log.info('brief complete', { contexts: contexts.filter(Boolean).length, urls: urls.length })
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        const code = (err as { code?: string }).code ?? 'unknown'
        log.error('brief failed', { code, msg: message })
        send('error', { code, msg: message })
      } finally {
        clearTimeout(globalTimer)
        nodeReq.off('close', onClose)
        try { controller.close() } catch {}
        closed = true
      }
    },
  })

  return sendStream(event, stream)
})

function buildContextMarkdown(contexts: BriefUrlContext[]): string {
  if (contexts.length === 0) return ''
  const lines: string[] = ['## Contexte du site existant', '']
  for (const ctx of contexts) {
    if (!ctx) continue
    lines.push(`### ${ctx.url}`)
    if (ctx.title) lines.push(`**Title** : ${ctx.title}`)
    if (ctx.metaDescription) lines.push(`**Description** : ${ctx.metaDescription}`)
    if (ctx.palette.length > 0) {
      const paletteStr = ctx.palette.map((p) => `${p.hex} (${p.role})`).join(' · ')
      lines.push(`**Palette dominante** : ${paletteStr}`)
    }
    if (ctx.visualDescription) {
      lines.push(`**Style perçu** : ${ctx.visualDescription}`)
    }
    if (ctx.textExcerpt) {
      lines.push(`\n**Extrait du contenu** :\n${ctx.textExcerpt.slice(0, 800)}`)
    }
    lines.push('')
  }
  return lines.join('\n')
}

/**
 * Mode mock — retourne 3 COMPLÉMENTS (pas des prompts complets) qui s'ajouteront
 * aux préfixes par défaut côté frontend via joinPromptVariant().
 */
function mockGeneratedPrompts(b: { artDirection?: string; mood?: string; uiStyle?: string; typography?: string; palette?: string }) {
  const hints: string[] = []
  if (b.artDirection) hints.push(b.artDirection)
  if (b.mood) hints.push(b.mood)
  if (b.uiStyle) hints.push(b.uiStyle)
  if (b.typography) hints.push(b.typography)
  if (b.palette) hints.push(b.palette)
  const summary = hints.length > 0 ? hints.join(' / ') : 'free creative direction'
  return {
    promptA: `[MOCK A — complément naturel] The mood is editorial and serene with soft natural light. Inspired by: ${summary}. Shot on 35mm with shallow depth of field, evoking a contemporary creative agency aesthetic.`,
    promptB: `[MOCK B — complément keywords] swiss minimal, oversized display sans, ${summary}, soft natural light, editorial photography, asymmetric layout, negative space, shot on 35mm`,
    promptC: `[MOCK C — complément structuré]\nMood: editorial, serene, contemplative\nLighting: soft natural light\nColor palette: muted earth tones\nMedium: editorial photography, 85mm f/1.4\nStyle: ${summary}`,
  }
}
