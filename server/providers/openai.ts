import type { GenerateInput, GenerateOutput, ImageGenerator } from './types'
import { ProviderError } from './types'
import { createLogger } from '../utils/logger'
import { API_MAPPINGS, applyParams } from './paramApiMapping'

const log = createLogger('openai')

interface OpenAIModelDef {
  modelId: string         // ID interne (ex: 'gpt-image-2')
  apiModel: string        // ID OpenAI (ex: 'gpt-image-2')
  pricePerImage: number
  /**
   * Famille de l'API :
   *  - 'gpt-image' : nouvelle famille (gpt-image-1, gpt-image-1-mini, gpt-image-2). Renvoie b64 par défaut.
   *  - 'dall-e' : ancienne famille (dall-e-2, dall-e-3). Nécessite `response_format: "b64_json"` explicite.
   */
  family: 'gpt-image' | 'dall-e'
  /** DALL-E 3 et GPT Image supportent un paramètre `quality`. DALL-E 2 ne le supporte pas. */
  supportsQualityParam: boolean
}

const OPENAI_BASE = 'https://api.openai.com/v1'

function mapHttpError(status: number, body: string): ProviderError {
  if (status === 401 || status === 403) return new ProviderError('unauthorized', `OpenAI unauthorized: ${body}`, status)
  if (status === 429) return new ProviderError('rate_limited', 'OpenAI rate limited', status)
  if (status >= 500) return new ProviderError('server_error', `OpenAI server error: ${body}`, status)
  return new ProviderError('invalid_request', `OpenAI ${status}: ${body}`, status)
}

/**
 * Mapping ratio → size OpenAI.
 * gpt-image-2 supporte des ratios jusqu'à 3:1 et 1:3, mais on reste sur les
 * tailles standards bien supportées par toute la famille.
 */
function ratioToSize(ratio: string): string {
  switch (ratio) {
    case '1:1': return '1024x1024'
    case '4:5':
    case '2:3':
    case '3:4': return '1024x1536'
    case '16:9':
    case '21:9': return '1536x1024'
    default: return '1024x1024'
  }
}

export function createOpenAIGenerator(def: OpenAIModelDef): ImageGenerator {
  return {
    modelId: def.modelId,
    source: 'openai',
    capabilities: { seed: false, editing: false, imageToImage: false },
    pricePerImage: def.pricePerImage,
    async generate(input: GenerateInput, signal: AbortSignal, apiKey: string | null): Promise<GenerateOutput> {
      const t0 = Date.now()
      log.debug(`generate() start model="${def.modelId}"`, { promptLen: input.prompt.length, ratio: input.ratio, hasKey: !!apiKey })
      if (!apiKey) {
        log.error(`unauthorized — no API key for model="${def.modelId}"`)
        throw new ProviderError('unauthorized', 'OpenAI API key missing')
      }

      const body: Record<string, unknown> = {
        model: def.apiModel,
        prompt: input.prompt,
        size: ratioToSize(input.ratio),
        n: 1,
      }
      // DALL-E 2 et 3 nécessitent response_format pour récupérer du b64
      // (sinon retournent une URL S3 qui expire). gpt-image-* renvoie b64 par défaut.
      if (def.family === 'dall-e') {
        body.response_format = 'b64_json'
      }
      // quality: 'standard' ou 'hd' pour DALL-E 3 ; 'low'/'medium'/'high'/'auto' pour gpt-image.
      if (def.supportsQualityParam) {
        body.quality = def.family === 'dall-e' ? 'standard' : 'auto'
      }
      // EPIC-18 / STORY-121 — overrides utilisateur (quality, style, background, ...).
      // Écrase les défauts hardcodés ci-dessus si l'utilisateur a fait un choix.
      applyParams(API_MAPPINGS.openai, body, input.params)

      let res: Response
      try {
        res = await fetch(`${OPENAI_BASE}/images/generations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(body),
          signal,
        })
      } catch (err: unknown) {
        if ((err as Error).name === 'AbortError') {
          log.warn(`aborted model="${def.modelId}" after ${Date.now() - t0}ms`)
          throw new ProviderError('aborted', 'Aborted')
        }
        log.error(`network error model="${def.modelId}"`, { message: (err as Error).message })
        throw new ProviderError('timeout', `Network error: ${(err as Error).message}`, undefined, err)
      }

      if (!res.ok) {
        const errBody = await res.text().catch(() => '')
        log.error(`HTTP ${res.status} model="${def.modelId}"`, { body: errBody.slice(0, 200) })
        throw mapHttpError(res.status, errBody)
      }

      // Content-Type guard — rejet uniquement si HTML (page d'erreur 200 typique).
      const ct = (res.headers.get('content-type') ?? '').toLowerCase()
      if (ct.includes('text/html') || ct.includes('application/xhtml')) {
        log.error(`HTML response (likely error page) model="${def.modelId}"`, { contentType: ct })
        throw new ProviderError('server_error', `OpenAI returned HTML content-type="${ct}"`, res.status)
      }

      const data = (await res.json()) as { data?: Array<{ b64_json?: string }> }
      const item = data.data?.[0]
      if (!item?.b64_json) {
        log.error(`empty response model="${def.modelId}"`, { keys: Object.keys(data) })
        throw new ProviderError('server_error', 'OpenAI empty response')
      }

      const imageBuffer = Buffer.from(item.b64_json, 'base64')
      log.info(`generate() success model="${def.modelId}" in ${Date.now() - t0}ms`, { bytes: imageBuffer.length })

      return {
        imageBuffer,
        mime: 'image/png',
        modelId: def.modelId,
        source: 'openai',
        seed: null,
        costUsd: def.pricePerImage,
        rawResponse: data,
      }
    },
  }
}

/**
 * Catalogue des modèles OpenAI directs.
 * Tri : par prix croissant (cohérent avec l'affichage attendu sous brand "OpenAI").
 *
 * Sources prix (consulté 2026-05-01) :
 * - GPT Image 2 : token-based, ~$0.053/image medium quality 1024x1024 (estimé via calculateur OpenAI)
 *   → https://openai.com/api/pricing/
 * - GPT Image 1 : ~$0.040/image standard
 * - GPT Image 1 Mini : ~$0.011/image
 * - DALL-E 3 standard : $0.040/image (1024x1024)
 * - DALL-E 2 : $0.020/image (1024x1024)
 */
export const OPENAI_MODELS: OpenAIModelDef[] = [
  { modelId: 'gpt-image-1-mini', apiModel: 'gpt-image-1-mini', pricePerImage: 0.011, family: 'gpt-image', supportsQualityParam: true },
  { modelId: 'dall-e-2',         apiModel: 'dall-e-2',         pricePerImage: 0.020, family: 'dall-e',    supportsQualityParam: false },
  // STORY-104 — gpt-image-1.5 transféré d'OpenRouter (déprécié) vers OpenAI direct
  { modelId: 'gpt-image-1.5',    apiModel: 'gpt-image-1.5',    pricePerImage: 0.030, family: 'gpt-image', supportsQualityParam: true  },
  { modelId: 'dall-e-3',         apiModel: 'dall-e-3',         pricePerImage: 0.040, family: 'dall-e',    supportsQualityParam: true  },
  { modelId: 'gpt-image-1',      apiModel: 'gpt-image-1',      pricePerImage: 0.040, family: 'gpt-image', supportsQualityParam: true  },
  { modelId: 'gpt-image-2',      apiModel: 'gpt-image-2',      pricePerImage: 0.053, family: 'gpt-image', supportsQualityParam: true  },
]
