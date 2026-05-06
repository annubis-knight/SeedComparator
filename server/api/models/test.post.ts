import { ModelTestRequestSchema } from '#shared/contracts'
import { prisma } from '../../db/client'
import { getGenerator } from '../../providers/registry'
import { getApiKey } from '../../services/apiKeys'
import { writeFixture, fixtureExists } from '../../services/fixtureWriter'
import { ProviderError } from '../../providers/types'
import { createLogger } from '../../utils/logger'

const log = createLogger('models.test')

/**
 * STORY-101 — endpoint dédié pour tester un seul modèle en LIVE et capturer
 * sa fixture. Forcer `live` est volontaire : on veut une vraie réponse provider
 * pour la rejouer ensuite en mode mock-real.
 *
 * Réponse 200 : { status: 'success', generation: {...} }
 * Réponse 200 : { status: 'failed', errorCode, errorMsg }
 * Réponse 409 : { status: 'fixture_exists' } — appelant doit re-tenter avec overwrite=true
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = ModelTestRequestSchema.safeParse(body)
  if (!parsed.success) {
    log.error('invalid payload', parsed.error.flatten())
    throw createError({ statusCode: 400, statusMessage: 'Invalid payload', data: parsed.error.flatten() })
  }
  const { modelId, prompt, ratio, overwrite } = parsed.data
  log.info(`POST /api/models/test model="${modelId}" promptLen=${prompt.length} ratio=${ratio} overwrite=${overwrite}`)

  // 1. Modèle DB
  const model = await prisma.model.findUnique({
    where: { id: modelId },
    include: { provider: true },
  })
  if (!model) {
    log.error(`model not found id="${modelId}"`)
    throw createError({ statusCode: 404, statusMessage: `Model not found: ${modelId}` })
  }

  // 2. Adapter LIVE (force le mode 'live' quel que soit le setting)
  const generator = getGenerator(modelId, 'live')
  if (!generator) {
    log.error(`no live generator for model="${modelId}"`)
    throw createError({ statusCode: 400, statusMessage: `No live generator for model "${modelId}". Restart server if adapter just added.` })
  }

  // 3. Si fixture existe et overwrite=false → 409 sans appeler l'API
  if (!overwrite && fixtureExists({ source: generator.source, modelId })) {
    log.warn(`fixture already exists for model="${modelId}", asking client to confirm overwrite`)
    setResponseStatus(event, 409)
    return { status: 'fixture_exists', modelId, source: generator.source }
  }

  // 4. Clé API
  const apiKey = getApiKey(model.providerId)
  if (!apiKey) {
    log.error(`API key missing for provider="${model.providerId}"`)
    throw createError({ statusCode: 401, statusMessage: `API key missing for provider "${model.providerId}". Set it in Settings.` })
  }

  // 5. Appel LIVE
  const t0 = Date.now()
  const ctrl = new AbortController()
  // Cancel auto si client ferme la connexion
  event.node.req.on('close', () => ctrl.abort())

  try {
    log.info(`calling provider model="${modelId}" source=${generator.source}…`)
    const out = await generator.generate({ prompt, ratio, seed: null }, ctrl.signal, apiKey)
    const elapsed = Date.now() - t0
    log.info(`provider call success in ${elapsed}ms model="${modelId}" bytes=${out.imageBuffer.length} mime=${out.mime}`)

    // 6. Capture fixture
    const { jsonPath, pngPath } = writeFixture({
      modelId,
      source: out.source,
      input: { prompt, ratio },
      // On store le rawResponse complet (sans le buffer image, qui est dans le PNG voisin).
      http: { status: 200, body: out.rawResponse },
      expected: { mime: out.mime, costUsd: out.costUsd, seed: out.seed },
      imageBuffer: out.imageBuffer,
    })
    log.info(`fixture captured json=${jsonPath} png=${pngPath}`)

    return {
      status: 'success',
      modelId,
      source: out.source,
      imageDataUrl: `data:${out.mime};base64,${out.imageBuffer.toString('base64')}`,
      seed: out.seed,
      costUsd: out.costUsd,
      elapsedMs: elapsed,
      fixture: { jsonPath, pngPath },
    }
  } catch (err) {
    const elapsed = Date.now() - t0
    if (err instanceof ProviderError) {
      log.error(`provider error in ${elapsed}ms model="${modelId}" code=${err.code} msg="${err.message}"`)
      return {
        status: 'failed',
        modelId,
        errorCode: err.code,
        errorMsg: err.message,
        elapsedMs: elapsed,
      }
    }
    log.error(`unexpected error in ${elapsed}ms model="${modelId}"`, err)
    return {
      status: 'failed',
      modelId,
      errorCode: 'unknown',
      errorMsg: err instanceof Error ? err.message : String(err),
      elapsedMs: elapsed,
    }
  }
})
