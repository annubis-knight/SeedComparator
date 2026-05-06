#!/usr/bin/env node
// scripts/probe-providers/probe-openrouter.mjs
//
// STORY-104 — OpenRouter ne sert plus pour la génération d'images dans
// SeedComparator (tous les modèles sont accessibles direct). Ce script reste
// disponible si tu veux retester un modèle d'image OpenRouter ad-hoc.
//
// Catalogue : intentionnellement vide. Pour tester un modèle, lance :
//   node scripts/probe-providers/probe-openrouter.mjs --only=<modelId>
// après avoir ajouté l'entrée correspondante au tableau MODELS ci-dessous.

import { runProbes, ProbeError, isHtmlContentType } from './_shared.mjs'

const OR_BASE = 'https://openrouter.ai/api/v1'

const MODELS = [
  // Vide par défaut. Exemples de modèles image OpenRouter (à dé-commenter pour test) :
  // { modelId: 'or-gemini-3.1-flash-image-preview', apiModel: 'google/gemini-3.1-flash-image-preview', source: 'openrouter', pricePerImage: 0.040 },
  // { modelId: 'or-gpt-5-image-mini',               apiModel: 'openai/gpt-5-image-mini',               source: 'openrouter', pricePerImage: 0.030 },
]

if (MODELS.length === 0) {
  console.log('OpenRouter probe: catalogue vide. Tous les modèles d\'image sont accessibles via leurs providers directs (OpenAI, Google AI, Fal).')
  console.log('Pour tester un modèle OpenRouter ad-hoc, ajoute-le manuellement à MODELS dans probe-openrouter.mjs.')
  process.exit(0)
}

await runProbes({
  providerLabel: 'OpenRouter',
  models: MODELS,
  apiKeyEnv: 'OPENROUTER_API_KEY',
  callProvider: async ({ model, apiKey, prompt, signal }) => {
    const res = await fetch(`${OR_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://seedcomparator.local',
        'X-Title': 'SeedComparator',
      },
      body: JSON.stringify({
        model: model.apiModel,
        messages: [{ role: 'user', content: prompt }],
        modalities: ['image', 'text'],
      }),
      signal,
    })
    if (!res.ok) {
      const errBody = await res.text().catch(() => '')
      throw new ProbeError(
        res.status === 401 ? 'unauthorized' : res.status === 429 ? 'rate_limited' : res.status >= 500 ? 'server_error' : 'invalid_request',
        `OpenRouter HTTP ${res.status}`,
        res.status,
        errBody,
      )
    }
    if (isHtmlContentType(res.headers.get('content-type'))) {
      throw new ProbeError('server_error', `OpenRouter returned HTML (endpoint may not exist)`, res.status)
    }

    const data = await res.json()
    const choice = data?.choices?.[0]
    let dataUrl = choice?.message?.images?.[0]?.image_url?.url
    if (!dataUrl && Array.isArray(choice?.message?.content)) {
      for (const part of choice.message.content) {
        if (part.type === 'image_url' && part.image_url?.url) { dataUrl = part.image_url.url; break }
      }
    }
    if (!dataUrl) throw new ProbeError('server_error', `OpenRouter: no image in response`, 200, JSON.stringify(data).slice(0, 300))

    const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
    if (!m) throw new ProbeError('server_error', `OpenRouter: image is not data:base64 URL`, 200)
    return {
      imageBuffer: Buffer.from(m[2], 'base64'),
      mime: m[1] ?? 'image/png',
      rawResponse: data,
      seed: null,
      costUsd: model.pricePerImage,
    }
  },
})
