#!/usr/bin/env node
// scripts/probe-providers/probe-fal.mjs
//
// Teste les modèles Fal.ai en live via la queue async (`queue.fal.run`).
// Le sync `fal.run` ne supporte pas tous les modèles (SD 3.5 Large timeout) —
// la queue marche pour tous, fast comme slow.
//
// Pattern :
//   1. POST queue.fal.run/<model>     → IN_QUEUE + status_url + response_url
//   2. GET status_url (poll ~1s)      → IN_QUEUE / IN_PROGRESS / COMPLETED
//   3. GET response_url               → { images:[{url, content_type}], seed, ... }
//   4. GET image url                  → bytes
//
// Usage : node scripts/probe-providers/probe-fal.mjs [--only=...] [--yes] [--overwrite]

import { runProbes, ProbeError, isHtmlContentType } from './_shared.mjs'

const FAL_QUEUE_BASE = 'https://queue.fal.run'

const POLL_INTERVAL_MS = 1000
const MAX_POLL_ATTEMPTS = 180  // 3 minutes max

const MODELS = [
  { modelId: 'flux-1.1-schnell', apiModel: 'fal-ai/flux/schnell',                  source: 'fal', pricePerImage: 0.010, supportsSeed: true },
  { modelId: 'sd-3.5-large',     apiModel: 'fal-ai/stable-diffusion-v35-large',    source: 'fal', pricePerImage: 0.030, supportsSeed: true },
  { modelId: 'flux-1.1-pro',     apiModel: 'fal-ai/flux-pro',                      source: 'fal', pricePerImage: 0.040, supportsSeed: true },
]

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)) }

async function falGet(url, apiKey, signal) {
  const res = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Key ${apiKey}` },
    signal,
  })
  if (!res.ok) {
    const errBody = await res.text().catch(() => '')
    throw new ProbeError(
      res.status === 401 || res.status === 403 ? 'unauthorized' : res.status === 429 ? 'rate_limited' : res.status >= 500 ? 'server_error' : 'invalid_request',
      `Fal HTTP ${res.status} on ${url}`,
      res.status,
      errBody,
    )
  }
  if (isHtmlContentType(res.headers.get('content-type'))) {
    throw new ProbeError('server_error', `Fal returned HTML on ${url}`, res.status)
  }
  return res
}

await runProbes({
  providerLabel: 'Fal.ai (queue)',
  models: MODELS,
  apiKeyEnv: 'FAL_API_KEY',
  callProvider: async ({ model, apiKey, prompt, signal }) => {
    // 1. Submit to queue
    const submitRes = await fetch(`${FAL_QUEUE_BASE}/${model.apiModel}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Key ${apiKey}` },
      body: JSON.stringify({ prompt, image_size: 'square_hd' }),
      signal,
    })
    if (!submitRes.ok) {
      const errBody = await submitRes.text().catch(() => '')
      throw new ProbeError(
        submitRes.status === 401 || submitRes.status === 403 ? 'unauthorized' : submitRes.status === 429 ? 'rate_limited' : submitRes.status >= 500 ? 'server_error' : 'invalid_request',
        `Fal HTTP ${submitRes.status} on submit`,
        submitRes.status,
        errBody,
      )
    }
    if (isHtmlContentType(submitRes.headers.get('content-type'))) {
      throw new ProbeError('server_error', `Fal returned HTML on submit`, submitRes.status)
    }
    const submit = await submitRes.json()
    if (!submit.status_url || !submit.response_url) {
      throw new ProbeError('server_error', `Fal: queue submit missing URLs`, 200, JSON.stringify(submit).slice(0, 300))
    }

    // 2. Poll status
    let attempts = 0
    while (attempts < MAX_POLL_ATTEMPTS) {
      await sleep(POLL_INTERVAL_MS)
      attempts++
      const statusRes = await falGet(submit.status_url, apiKey, signal)
      const statusData = await statusRes.json()
      if (statusData.status === 'COMPLETED') break
      if (statusData.status === 'FAILED' || statusData.status === 'ERROR') {
        throw new ProbeError('server_error', `Fal queue ${statusData.status}`, 200, JSON.stringify(statusData).slice(0, 300))
      }
    }
    if (attempts >= MAX_POLL_ATTEMPTS) {
      throw new ProbeError('timeout', `Fal queue did not complete after ${(MAX_POLL_ATTEMPTS * POLL_INTERVAL_MS) / 1000}s`)
    }

    // 3. Fetch final response
    const respRes = await falGet(submit.response_url, apiKey, signal)
    const data = await respRes.json()
    const image = data?.images?.[0]
    if (!image?.url) throw new ProbeError('server_error', `Fal: no image URL in response`, 200, JSON.stringify(data).slice(0, 300))

    // 4. Download image bytes
    const imgRes = await fetch(image.url, { signal })
    if (!imgRes.ok) throw new ProbeError('server_error', `Fal: failed to download image (HTTP ${imgRes.status})`, imgRes.status)
    const imageBuffer = Buffer.from(await imgRes.arrayBuffer())
    const mime = image.content_type ?? imgRes.headers.get('content-type')?.split(';')[0]?.trim() ?? 'image/png'

    return {
      imageBuffer,
      mime,
      rawResponse: data,
      seed: data?.seed ?? null,
      costUsd: model.pricePerImage,
    }
  },
})
