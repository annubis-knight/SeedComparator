import type { GenerateInput, GenerateOutput, ImageGenerator } from './types'
import { ProviderError } from './types'
import { createLogger } from '../utils/logger'

const log = createLogger('openrouter')

/**
 * STORY-104 — OpenRouter NE SERT PLUS pour la génération d'images.
 *
 * Raison : OpenRouter n'expose pas l'endpoint `/v1/images/generations` (qui est
 * spécifique à OpenAI Platform). Les modèles d'image accessibles via OpenRouter
 * (gemini-3.1-flash-image-preview, gpt-5-image, etc.) le sont via
 * `/v1/chat/completions` avec `responseModalities` — format propriétaire qui
 * change régulièrement. Tous nos modèles d'image ont une route directe
 * (Google AI Studio, OpenAI Platform), donc on n'a aucune raison de payer la
 * marge OpenRouter pour de la duplication.
 *
 * Cet adapter est conservé pour compat (le registry l'importe) mais
 * `OPENROUTER_MODELS` est vide. Aucun modèle ne pointe vers ce gateway en DB.
 *
 * Note : `server/providers/openrouter-text.ts` (Brief Assistant) est INTACT —
 * il utilise OpenRouter pour le LLM texte (Claude Haiku via OpenRouter).
 */

interface OpenRouterModelDef {
  modelId: string
  apiModel: string
  pricePerImage: number
}

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1'

function mapHttpError(status: number, body: string): ProviderError {
  if (status === 401 || status === 403) return new ProviderError('unauthorized', `OpenRouter unauthorized: ${body.slice(0, 200)}`, status)
  if (status === 429) return new ProviderError('rate_limited', 'OpenRouter rate limited', status)
  if (status >= 500) return new ProviderError('server_error', `OpenRouter server error: ${body.slice(0, 200)}`, status)
  return new ProviderError('invalid_request', `OpenRouter ${status}: ${body.slice(0, 200)}`, status)
}

function expectJson(res: Response): void {
  // Rejet uniquement si HTML (typique d'une page 200 "Not Found").
  const ct = (res.headers.get('content-type') ?? '').toLowerCase()
  if (ct.includes('text/html') || ct.includes('application/xhtml')) {
    throw new ProviderError(
      'server_error',
      `OpenRouter returned HTML content-type="${ct}". Endpoint may not exist or model unavailable.`,
      res.status,
    )
  }
}

function ratioToSize(ratio: string): string {
  switch (ratio) {
    case '1:1': return '1024x1024'
    case '4:5': return '1024x1280'
    case '2:3': return '1024x1536'
    case '3:4': return '1024x1365'
    case '16:9': return '1792x1024'
    case '21:9': return '2048x880'
    default: return '1024x1024'
  }
}

/**
 * Stub conservé pour le cas où on remettrait des modèles via OpenRouter plus tard.
 * Pour l'instant `OPENROUTER_MODELS` est vide, donc cette fonction n'est jamais
 * appelée en runtime.
 */
export function createOpenRouterGenerator(def: OpenRouterModelDef): ImageGenerator {
  return {
    modelId: def.modelId,
    source: 'openrouter',
    capabilities: { seed: false, editing: false, imageToImage: false },
    pricePerImage: def.pricePerImage,
    async generate(input: GenerateInput, signal: AbortSignal, apiKey: string | null): Promise<GenerateOutput> {
      const t0 = Date.now()
      log.debug(`generate() start model="${def.modelId}"`, { promptLen: input.prompt.length, ratio: input.ratio, hasKey: !!apiKey })
      if (!apiKey) throw new ProviderError('unauthorized', 'OpenRouter API key missing')

      // Format chat/completions multimodal (le seul utilisé par OpenRouter pour l'image).
      let res: Response
      try {
        res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
            'HTTP-Referer': 'https://seedcomparator.local',
            'X-Title': 'SeedComparator',
          },
          body: JSON.stringify({
            model: def.apiModel,
            messages: [{ role: 'user', content: input.prompt }],
            modalities: ['image', 'text'],
            // Hint de taille pour les modèles qui le supportent
            size: ratioToSize(input.ratio),
          }),
          signal,
        })
      } catch (err: unknown) {
        if ((err as Error).name === 'AbortError') throw new ProviderError('aborted', 'Aborted')
        throw new ProviderError('timeout', `Network error: ${(err as Error).message}`, undefined, err)
      }

      if (!res.ok) {
        const body = await res.text().catch(() => '')
        log.error(`HTTP ${res.status} model="${def.modelId}"`, { body: body.slice(0, 300) })
        throw mapHttpError(res.status, body)
      }
      expectJson(res)

      const data = (await res.json()) as {
        choices?: Array<{
          message?: {
            content?: string | Array<{ type?: string; text?: string; image_url?: { url?: string } }>
            images?: Array<{ image_url?: { url?: string } }>
          }
        }>
      }

      // OpenRouter renvoie l'image dans `message.images[].image_url.url` sous forme
      // de data URL `data:image/png;base64,...`. On extrait la 1ère image.
      const choice = data.choices?.[0]
      const images = choice?.message?.images ?? []
      let dataUrl: string | undefined = images[0]?.image_url?.url
      if (!dataUrl && Array.isArray(choice?.message?.content)) {
        for (const part of choice.message.content) {
          if (part.type === 'image_url' && part.image_url?.url) { dataUrl = part.image_url.url; break }
        }
      }
      if (!dataUrl) {
        log.error(`no image in response model="${def.modelId}"`, { keys: Object.keys(data) })
        throw new ProviderError('server_error', 'OpenRouter: no image in response')
      }

      // Parse data URL → buffer
      const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
      if (!m) throw new ProviderError('server_error', 'OpenRouter: image URL is not a data:base64 URL')
      const mime = m[1] ?? 'image/png'
      const imageBuffer = Buffer.from(m[2] ?? '', 'base64')

      log.info(`success model="${def.modelId}" in ${Date.now() - t0}ms`, { bytes: imageBuffer.length })

      return {
        imageBuffer,
        mime,
        modelId: def.modelId,
        source: 'openrouter',
        seed: null,
        costUsd: def.pricePerImage,
        rawResponse: data,
      }
    },
  }
}

/**
 * Catalogue VIDE — aucun modèle d'image ne passe plus par OpenRouter.
 * Tous les modèles d'image ont des routes directes (Google AI, OpenAI, Fal).
 */
export const OPENROUTER_MODELS: OpenRouterModelDef[] = []
