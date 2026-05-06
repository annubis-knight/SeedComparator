import type { GenerateInput, GenerateOutput, ImageGenerator } from './types'
import { ProviderError } from './types'
import { createLogger } from '../utils/logger'
import { API_MAPPINGS, applyParams } from './paramApiMapping'

const log = createLogger('google-ai')

/**
 * STORY-104 — Adapter Google AI Studio refondu pour gérer 2 familles :
 *  - `imagen`        : endpoint `:predict`, response `predictions[].bytesBase64Encoded`
 *  - `gemini-image`  : endpoint `:generateContent`, response `candidates[0].content.parts[].inlineData`
 *                      (modèles Nano Banana = Gemini 2.5/3.1 image preview)
 */
export type GoogleAIFamily = 'imagen' | 'gemini-image'

export interface GoogleAIModelDef {
  /** ID interne (ex: 'imagen-4', 'gemini-2.5-flash-image') */
  modelId: string
  /** ID transmis à Google (ex: 'imagen-4.0-generate-001') */
  apiModel: string
  pricePerImage: number
  family: GoogleAIFamily
}

const GOOGLE_AI_BASE = 'https://generativelanguage.googleapis.com/v1beta'

function mapHttpError(status: number, body: string): ProviderError {
  if (status === 401 || status === 403) return new ProviderError('unauthorized', `Google AI unauthorized: ${body.slice(0, 200)}`, status)
  if (status === 429) return new ProviderError('rate_limited', `Google AI rate limited: ${body.slice(0, 200)}`, status)
  if (status >= 500) return new ProviderError('server_error', `Google AI server error: ${body.slice(0, 200)}`, status)
  return new ProviderError('invalid_request', `Google AI ${status}: ${body.slice(0, 200)}`, status)
}

function expectJson(res: Response): void {
  // Garde minimal : on rejette uniquement les types qu'on sait incorrects (HTML).
  // On laisse passer text/plain (souvent retourné par des mocks ou des CDN intermédiaires
  // qui ne mettent pas le bon Content-Type). Le `JSON.parse` plus loin gère le reste.
  const ct = (res.headers.get('content-type') ?? '').toLowerCase()
  if (ct.includes('text/html') || ct.includes('application/xhtml')) {
    throw new ProviderError(
      'server_error',
      `Google AI returned HTML content-type="${ct}". Endpoint may be wrong or model unavailable.`,
      res.status,
    )
  }
}

// Imagen accepte un sous-ensemble fixe de ratios.
function ratioToImagenAspect(ratio: string): string {
  switch (ratio) {
    case '1:1': return '1:1'
    case '4:5':
    case '2:3':
    case '3:4': return '3:4'
    case '16:9':
    case '21:9': return '16:9'
    default: return '1:1'
  }
}

export function createGoogleAIGenerator(def: GoogleAIModelDef): ImageGenerator {
  return {
    modelId: def.modelId,
    source: 'google-ai',
    capabilities: { seed: false, editing: false, imageToImage: false },
    pricePerImage: def.pricePerImage,
    async generate(input: GenerateInput, signal: AbortSignal, apiKey: string | null): Promise<GenerateOutput> {
      const t0 = Date.now()
      log.debug(`generate() start model="${def.modelId}" family=${def.family}`, { promptLen: input.prompt.length, ratio: input.ratio, hasKey: !!apiKey })
      if (!apiKey) {
        log.error(`unauthorized — no API key for model="${def.modelId}"`)
        throw new ProviderError('unauthorized', 'Google AI API key missing')
      }

      // Branche selon la famille — les 2 endpoints n'ont rien en commun.
      if (def.family === 'imagen') {
        return generateImagen(def, input, signal, apiKey, t0)
      }
      return generateGeminiImage(def, input, signal, apiKey, t0)
    },
  }
}

// ─── Imagen (predict) ─────────────────────────────────────────────────────────
async function generateImagen(
  def: GoogleAIModelDef,
  input: GenerateInput,
  signal: AbortSignal,
  apiKey: string,
  t0: number,
): Promise<GenerateOutput> {
  const url = `${GOOGLE_AI_BASE}/models/${def.apiModel}:predict`
  log.debug(`POST ${url}`)

  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: (() => {
        const b: Record<string, unknown> = {
          instances: [{ prompt: input.prompt }],
          parameters: {
            sampleCount: 1,
            aspectRatio: ratioToImagenAspect(input.ratio),
            personGeneration: 'ALLOW_ADULT',
          },
        }
        // EPIC-18 / STORY-121 — overrides Imagen (parameters.* via mapping nested).
        applyParams(API_MAPPINGS.imagen, b, input.params)
        return JSON.stringify(b)
      })(),
      signal,
    })
  } catch (err: unknown) {
    if ((err as Error).name === 'AbortError') {
      log.warn(`imagen aborted model="${def.modelId}" after ${Date.now() - t0}ms`)
      throw new ProviderError('aborted', 'Aborted')
    }
    log.error(`imagen network error model="${def.modelId}"`, { message: (err as Error).message })
    throw new ProviderError('timeout', `Network error: ${(err as Error).message}`, undefined, err)
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    log.error(`imagen HTTP ${res.status} model="${def.modelId}"`, { body: body.slice(0, 300) })
    throw mapHttpError(res.status, body)
  }
  expectJson(res)

  const data = (await res.json()) as {
    predictions?: Array<{ bytesBase64Encoded?: string; mimeType?: string }>
  }
  const item = data.predictions?.[0]
  if (!item?.bytesBase64Encoded) {
    log.error(`imagen empty response model="${def.modelId}"`, { keys: Object.keys(data) })
    throw new ProviderError('server_error', 'Google AI Imagen empty response')
  }

  const imageBuffer = Buffer.from(item.bytesBase64Encoded, 'base64')
  log.info(`imagen success model="${def.modelId}" in ${Date.now() - t0}ms`, { bytes: imageBuffer.length })

  return {
    imageBuffer,
    mime: item.mimeType ?? 'image/png',
    modelId: def.modelId,
    source: 'google-ai',
    seed: null,
    costUsd: def.pricePerImage,
    rawResponse: data,
  }
}

// ─── Gemini Image (generateContent) ───────────────────────────────────────────
async function generateGeminiImage(
  def: GoogleAIModelDef,
  input: GenerateInput,
  signal: AbortSignal,
  apiKey: string,
  t0: number,
): Promise<GenerateOutput> {
  const url = `${GOOGLE_AI_BASE}/models/${def.apiModel}:generateContent`
  log.debug(`POST ${url}`)

  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: (() => {
        const b: Record<string, unknown> = {
          contents: [{ role: 'user', parts: [{ text: input.prompt }] }],
          generationConfig: {
            responseModalities: ['IMAGE'],
          },
        }
        // EPIC-18 / STORY-121 — overrides Gemini Image (generationConfig.* via mapping nested).
        applyParams(API_MAPPINGS.geminiImage, b, input.params)
        return JSON.stringify(b)
      })(),
      signal,
    })
  } catch (err: unknown) {
    if ((err as Error).name === 'AbortError') {
      log.warn(`gemini-image aborted model="${def.modelId}" after ${Date.now() - t0}ms`)
      throw new ProviderError('aborted', 'Aborted')
    }
    log.error(`gemini-image network error model="${def.modelId}"`, { message: (err as Error).message })
    throw new ProviderError('timeout', `Network error: ${(err as Error).message}`, undefined, err)
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    log.error(`gemini-image HTTP ${res.status} model="${def.modelId}"`, { body: body.slice(0, 300) })
    throw mapHttpError(res.status, body)
  }
  expectJson(res)

  const data = (await res.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ inlineData?: { data?: string; mimeType?: string }; text?: string }> }
      finishReason?: string
    }>
  }

  const parts = data.candidates?.[0]?.content?.parts ?? []
  // On extrait UNIQUEMENT l'image (les parties texte sont ignorées comme demandé).
  const imagePart = parts.find((p) => p.inlineData?.data)
  if (!imagePart?.inlineData?.data) {
    log.error(`gemini-image no image in response model="${def.modelId}"`, {
      partsTypes: parts.map((p) => Object.keys(p)),
      finishReason: data.candidates?.[0]?.finishReason,
    })
    throw new ProviderError('server_error', 'Google AI Gemini Image: no inlineData in response')
  }

  const imageBuffer = Buffer.from(imagePart.inlineData.data, 'base64')
  log.info(`gemini-image success model="${def.modelId}" in ${Date.now() - t0}ms`, {
    bytes: imageBuffer.length,
    mime: imagePart.inlineData.mimeType,
    textPartsIgnored: parts.filter((p) => p.text).length,
  })

  return {
    imageBuffer,
    mime: imagePart.inlineData.mimeType ?? 'image/png',
    modelId: def.modelId,
    source: 'google-ai',
    seed: null,
    costUsd: def.pricePerImage,
    rawResponse: data,
  }
}

// ─── Catalogue ────────────────────────────────────────────────────────────────
export const GOOGLE_AI_MODELS: GoogleAIModelDef[] = [
  // Imagen 4 — :predict
  { modelId: 'imagen-4-fast',                  apiModel: 'imagen-4.0-fast-generate-001',     family: 'imagen',       pricePerImage: 0.020 },
  { modelId: 'imagen-4',                       apiModel: 'imagen-4.0-generate-001',          family: 'imagen',       pricePerImage: 0.040 },
  { modelId: 'imagen-4-ultra',                 apiModel: 'imagen-4.0-ultra-generate-001',    family: 'imagen',       pricePerImage: 0.060 },
  // Gemini Image (Nano Banana) — :generateContent
  { modelId: 'gemini-2.5-flash-image',         apiModel: 'gemini-2.5-flash-image',           family: 'gemini-image', pricePerImage: 0.030 },
  { modelId: 'gemini-3.1-flash-image-preview', apiModel: 'gemini-3.1-flash-image-preview',   family: 'gemini-image', pricePerImage: 0.040 },
  { modelId: 'gemini-3-pro-image-preview',     apiModel: 'gemini-3-pro-image-preview',       family: 'gemini-image', pricePerImage: 0.130 },
]
