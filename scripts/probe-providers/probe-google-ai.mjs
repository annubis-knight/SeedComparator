#!/usr/bin/env node
// scripts/probe-providers/probe-google-ai.mjs
//
// Teste les modèles Google AI Studio (Imagen + Gemini Image / "Nano Banana") en live.
// Usage : node scripts/probe-providers/probe-google-ai.mjs [--only=...] [--yes] [--overwrite]

import { runProbes, ProbeError, isHtmlContentType } from './_shared.mjs'

const BASE = 'https://generativelanguage.googleapis.com/v1beta'

const MODELS = [
  // Imagen — endpoint :predict
  { modelId: 'imagen-4-fast',                  apiModel: 'imagen-4.0-fast-generate-001',     source: 'google-ai', pricePerImage: 0.020, family: 'imagen' },
  { modelId: 'imagen-4',                       apiModel: 'imagen-4.0-generate-001',          source: 'google-ai', pricePerImage: 0.040, family: 'imagen' },
  { modelId: 'imagen-4-ultra',                 apiModel: 'imagen-4.0-ultra-generate-001',    source: 'google-ai', pricePerImage: 0.060, family: 'imagen' },
  // Gemini Image — endpoint :generateContent
  { modelId: 'gemini-2.5-flash-image',         apiModel: 'gemini-2.5-flash-image',           source: 'google-ai', pricePerImage: 0.030, family: 'gemini-image' },
  { modelId: 'gemini-3.1-flash-image-preview', apiModel: 'gemini-3.1-flash-image-preview',   source: 'google-ai', pricePerImage: 0.040, family: 'gemini-image' },
  { modelId: 'gemini-3-pro-image-preview',     apiModel: 'gemini-3-pro-image-preview',       source: 'google-ai', pricePerImage: 0.130, family: 'gemini-image' },
]

async function callImagen({ apiModel, apiKey, prompt, signal }) {
  const res = await fetch(`${BASE}/models/${apiModel}:predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      instances: [{ prompt }],
      parameters: { sampleCount: 1, aspectRatio: '1:1', personGeneration: 'ALLOW_ADULT' },
    }),
    signal,
  })
  return res
}

async function callGeminiImage({ apiModel, apiKey, prompt, signal }) {
  const res = await fetch(`${BASE}/models/${apiModel}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ['IMAGE'] },
    }),
    signal,
  })
  return res
}

await runProbes({
  providerLabel: 'Google AI Studio',
  models: MODELS,
  apiKeyEnv: 'GOOGLE_AI_API_KEY',
  callProvider: async ({ model, apiKey, prompt, signal }) => {
    const res = model.family === 'imagen'
      ? await callImagen({ apiModel: model.apiModel, apiKey, prompt, signal })
      : await callGeminiImage({ apiModel: model.apiModel, apiKey, prompt, signal })

    if (!res.ok) {
      const errBody = await res.text().catch(() => '')
      throw new ProbeError(
        res.status === 401 || res.status === 403 ? 'unauthorized' : res.status === 429 ? 'rate_limited' : res.status >= 500 ? 'server_error' : 'invalid_request',
        `Google AI HTTP ${res.status}`,
        res.status,
        errBody,
      )
    }
    if (isHtmlContentType(res.headers.get('content-type'))) {
      throw new ProbeError('server_error', `Google AI returned HTML`, res.status)
    }

    const data = await res.json()

    // Imagen : predictions[0].bytesBase64Encoded
    if (model.family === 'imagen') {
      const item = data?.predictions?.[0]
      if (!item?.bytesBase64Encoded) {
        throw new ProbeError('server_error', `Imagen: no bytesBase64Encoded in response`, 200, JSON.stringify(data).slice(0, 300))
      }
      return {
        imageBuffer: Buffer.from(item.bytesBase64Encoded, 'base64'),
        mime: item.mimeType ?? 'image/png',
        rawResponse: data,
        seed: null,
        costUsd: model.pricePerImage,
      }
    }

    // Gemini Image : candidates[0].content.parts[].inlineData
    const parts = data?.candidates?.[0]?.content?.parts ?? []
    const imagePart = parts.find((p) => p.inlineData?.data)
    if (!imagePart?.inlineData?.data) {
      throw new ProbeError(
        'server_error',
        `Gemini Image: no inlineData in response (finishReason=${data?.candidates?.[0]?.finishReason ?? '?'})`,
        200,
        JSON.stringify(data).slice(0, 300),
      )
    }
    return {
      imageBuffer: Buffer.from(imagePart.inlineData.data, 'base64'),
      mime: imagePart.inlineData.mimeType ?? 'image/png',
      rawResponse: data,
      seed: null,
      costUsd: model.pricePerImage,
    }
  },
})
