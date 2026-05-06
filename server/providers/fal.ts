import type { GenerateInput, GenerateOutput, ImageGenerator } from './types'
import { ProviderError } from './types'
import { createLogger } from '../utils/logger'
import { API_MAPPINGS, applyParams } from './paramApiMapping'

const log = createLogger('fal')

interface FalModelDef {
  modelId: string
  apiModel: string // ex: 'fal-ai/flux/schnell'
  pricePerImage: number
  supportsSeed: boolean
}

/**
 * STORY-104 (fix) — Tous les modèles Fal passent par la queue async (`queue.fal.run`).
 * L'endpoint sync (`fal.run`) ne supporte plus tous les modèles (SD 3.5 Large
 * timeout après 5min) et la queue marche pour tous, fast comme slow. La latence
 * ajoutée par le polling est négligeable face au temps de génération.
 *
 * Pattern :
 *   1. POST queue.fal.run/<model>            → { request_id, status_url, response_url } status=IN_QUEUE
 *   2. GET status_url (poll ~1s)             → IN_QUEUE / IN_PROGRESS / COMPLETED
 *   3. GET response_url                      → { images:[{url, content_type}], seed, ... }
 *   4. GET image url                         → bytes
 */
const FAL_QUEUE_BASE = 'https://queue.fal.run'

const POLL_INTERVAL_MS = 1000
const MAX_POLL_ATTEMPTS = 180  // 180 × 1s = 3 minutes max par génération

function mapHttpError(status: number, body: string): ProviderError {
  if (status === 401 || status === 403) return new ProviderError('unauthorized', `Fal unauthorized: ${body.slice(0, 200)}`, status)
  if (status === 429) return new ProviderError('rate_limited', 'Fal rate limited', status)
  if (status >= 500) return new ProviderError('server_error', `Fal server error: ${body.slice(0, 200)}`, status)
  return new ProviderError('invalid_request', `Fal ${status}: ${body.slice(0, 200)}`, status)
}

function expectNotHtml(res: Response): void {
  const ct = (res.headers.get('content-type') ?? '').toLowerCase()
  if (ct.includes('text/html') || ct.includes('application/xhtml')) {
    throw new ProviderError('server_error', `Fal returned HTML content-type="${ct}"`, res.status)
  }
}

async function falFetch(url: string, init: RequestInit, signal: AbortSignal): Promise<Response> {
  let res: Response
  try {
    res = await fetch(url, { ...init, signal })
  } catch (err: unknown) {
    if ((err as Error).name === 'AbortError') throw new ProviderError('aborted', 'Aborted')
    throw new ProviderError('timeout', `Fal network error: ${(err as Error).message}`, undefined, err)
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw mapHttpError(res.status, body)
  }
  expectNotHtml(res)
  return res
}

async function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) return reject(new ProviderError('aborted', 'Aborted'))
    const t = setTimeout(() => resolve(), ms)
    signal.addEventListener('abort', () => {
      clearTimeout(t)
      reject(new ProviderError('aborted', 'Aborted'))
    }, { once: true })
  })
}

export function createFalGenerator(def: FalModelDef): ImageGenerator {
  return {
    modelId: def.modelId,
    source: 'fal',
    capabilities: { seed: def.supportsSeed, editing: false, imageToImage: false },
    pricePerImage: def.pricePerImage,
    async generate(input: GenerateInput, signal: AbortSignal, apiKey: string | null): Promise<GenerateOutput> {
      const t0 = Date.now()
      log.debug(`generate() start model="${def.modelId}"`, { promptLen: input.prompt.length, ratio: input.ratio })
      if (!apiKey) {
        log.error(`unauthorized — no API key for model="${def.modelId}"`)
        throw new ProviderError('unauthorized', 'Fal API key missing')
      }

      const headers = { 'Content-Type': 'application/json', Authorization: `Key ${apiKey}` }

      const body: Record<string, unknown> = {
        prompt: input.prompt,
        image_size: ratioToFalSize(input.ratio),
      }
      // Backward-compat : `input.seed` legacy.
      if (def.supportsSeed && input.seed != null) body.seed = input.seed
      // EPIC-18 / STORY-121 — overrides utilisateur via le catalogue de traits.
      // Les params inconnus de Fal (ex: openaiQuality) sont ignorés silencieusement.
      applyParams(API_MAPPINGS.fal, body, input.params)

      // 1. Submit to queue
      log.debug(`POST ${FAL_QUEUE_BASE}/${def.apiModel}`)
      const submitRes = await falFetch(`${FAL_QUEUE_BASE}/${def.apiModel}`, {
        method: 'POST', headers, body: JSON.stringify(body),
      }, signal)
      const submitData = (await submitRes.json()) as { status_url?: string; response_url?: string; request_id?: string }
      if (!submitData.status_url || !submitData.response_url) {
        throw new ProviderError('server_error', 'Fal: queue submit response missing status_url/response_url', 200)
      }
      log.debug(`queue submitted request_id=${submitData.request_id} status_url=${submitData.status_url}`)

      // 2. Poll status
      let attempts = 0
      while (attempts < MAX_POLL_ATTEMPTS) {
        await sleep(POLL_INTERVAL_MS, signal)
        attempts++
        const statusRes = await falFetch(submitData.status_url, { method: 'GET', headers }, signal)
        const statusData = (await statusRes.json()) as { status?: string }
        if (attempts === 1 || attempts % 10 === 0) {
          log.debug(`poll #${attempts} status=${statusData.status}`)
        }
        if (statusData.status === 'COMPLETED') break
        if (statusData.status === 'FAILED' || statusData.status === 'ERROR') {
          throw new ProviderError('server_error', `Fal queue status=${statusData.status}`, 200, statusData)
        }
        // IN_QUEUE / IN_PROGRESS → continue polling
      }
      if (attempts >= MAX_POLL_ATTEMPTS) {
        throw new ProviderError('timeout', `Fal queue did not complete after ${(MAX_POLL_ATTEMPTS * POLL_INTERVAL_MS) / 1000}s`)
      }

      // 3. Fetch final response
      log.debug(`fetching response_url after ${attempts} polls`)
      const respRes = await falFetch(submitData.response_url, { method: 'GET', headers }, signal)
      const data = (await respRes.json()) as {
        images?: Array<{ url?: string; content_type?: string; width?: number; height?: number }>
        seed?: number
      }
      const image = data.images?.[0]
      if (!image?.url) {
        log.error(`empty response model="${def.modelId}"`, { keys: Object.keys(data) })
        throw new ProviderError('server_error', 'Fal: no image URL in response')
      }

      // 4. Download image bytes
      log.debug(`downloading ${image.url}`)
      const imgRes = await fetch(image.url, { signal })
      if (!imgRes.ok) {
        throw new ProviderError('server_error', `Fal: failed to download image (HTTP ${imgRes.status})`)
      }
      const imageBuffer = Buffer.from(await imgRes.arrayBuffer())
      const mime = image.content_type ?? imgRes.headers.get('content-type')?.split(';')[0]?.trim() ?? 'image/png'

      log.info(`generate() success model="${def.modelId}" in ${Date.now() - t0}ms`, { bytes: imageBuffer.length, polls: attempts })

      return {
        imageBuffer,
        mime,
        modelId: def.modelId,
        source: 'fal',
        seed: def.supportsSeed ? (data.seed ?? input.seed ?? null) : null,
        costUsd: def.pricePerImage,
        rawResponse: data,
      }
    },
  }
}

function ratioToFalSize(ratio: string): string {
  switch (ratio) {
    case '1:1': return 'square_hd'
    case '4:5': return 'portrait_4_3'
    case '2:3':
    case '3:4': return 'portrait_16_9'
    case '16:9': return 'landscape_16_9'
    case '21:9': return 'landscape_16_9'
    default: return 'square_hd'
  }
}

export const FAL_MODELS: FalModelDef[] = [
  { modelId: 'flux-1.1-schnell', apiModel: 'fal-ai/flux/schnell', pricePerImage: 0.010, supportsSeed: true },
  { modelId: 'flux-1.1-pro', apiModel: 'fal-ai/flux-pro', pricePerImage: 0.040, supportsSeed: true },
  { modelId: 'sd-3.5-large', apiModel: 'fal-ai/stable-diffusion-v35-large', pricePerImage: 0.030, supportsSeed: true },
]
