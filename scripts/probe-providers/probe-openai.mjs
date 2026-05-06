#!/usr/bin/env node
// scripts/probe-providers/probe-openai.mjs
//
// Teste les modèles OpenAI Platform en live et capture les fixtures.
// Usage : node scripts/probe-providers/probe-openai.mjs [--only=...] [--yes] [--overwrite] [--dry-run]
//
// Catalogue maintenu en miroir de server/providers/openai.ts > OPENAI_MODELS.

import { runProbes, ProbeError, isHtmlContentType } from './_shared.mjs'

const OPENAI_BASE = 'https://api.openai.com/v1'

const MODELS = [
  { modelId: 'gpt-image-1-mini', apiModel: 'gpt-image-1-mini', source: 'openai', pricePerImage: 0.011, family: 'gpt-image', supportsQualityParam: true },
  { modelId: 'dall-e-2',         apiModel: 'dall-e-2',         source: 'openai', pricePerImage: 0.020, family: 'dall-e',    supportsQualityParam: false },
  { modelId: 'gpt-image-1.5',    apiModel: 'gpt-image-1.5',    source: 'openai', pricePerImage: 0.030, family: 'gpt-image', supportsQualityParam: true  },
  { modelId: 'dall-e-3',         apiModel: 'dall-e-3',         source: 'openai', pricePerImage: 0.040, family: 'dall-e',    supportsQualityParam: true  },
  { modelId: 'gpt-image-1',      apiModel: 'gpt-image-1',      source: 'openai', pricePerImage: 0.040, family: 'gpt-image', supportsQualityParam: true  },
  { modelId: 'gpt-image-2',      apiModel: 'gpt-image-2',      source: 'openai', pricePerImage: 0.053, family: 'gpt-image', supportsQualityParam: true  },
]

await runProbes({
  providerLabel: 'OpenAI Platform',
  models: MODELS,
  apiKeyEnv: 'OPENAI_API_KEY',
  callProvider: async ({ model, apiKey, prompt, signal }) => {
    const body = {
      model: model.apiModel,
      prompt,
      size: '1024x1024',
      n: 1,
    }
    if (model.family === 'dall-e') body.response_format = 'b64_json'
    if (model.supportsQualityParam) body.quality = model.family === 'dall-e' ? 'standard' : 'auto'

    const res = await fetch(`${OPENAI_BASE}/images/generations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(body),
      signal,
    })

    if (!res.ok) {
      const errBody = await res.text().catch(() => '')
      throw new ProbeError(
        res.status === 401 ? 'unauthorized' : res.status === 429 ? 'rate_limited' : res.status >= 500 ? 'server_error' : 'invalid_request',
        `OpenAI HTTP ${res.status}`,
        res.status,
        errBody,
      )
    }
    if (isHtmlContentType(res.headers.get('content-type'))) {
      throw new ProbeError('server_error', `OpenAI returned HTML (likely error page)`, res.status)
    }

    const data = await res.json()
    const item = data?.data?.[0]
    if (!item?.b64_json) throw new ProbeError('server_error', `OpenAI: no b64_json in response`, 200, JSON.stringify(data).slice(0, 300))
    return {
      imageBuffer: Buffer.from(item.b64_json, 'base64'),
      mime: 'image/png',
      rawResponse: data,
      seed: null,
      costUsd: model.pricePerImage,
    }
  },
})
