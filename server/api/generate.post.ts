import { prisma } from '../db/client'
import { GenerateRequestSchema } from '#shared/contracts'
import { getGenerator } from '../providers/registry'
import { runBatch, type BatchTask } from '../services/batchOrchestrator'
import { putImage } from '../services/imageCache'
import { getApiKey } from '../services/apiKeys'
import { getProviderMode } from '../services/providerMode'
import { createLogger } from '../utils/logger'
import {
  defaultsForModel,
  validateModelParams,
} from '../providers/paramResolver'
import { MODEL_PROFILES } from '../providers/modelParamProfiles'

const log = createLogger('generate')

export default defineEventHandler(async (event) => {
  const mode = await getProviderMode()
  const body = await readBody(event)
  log.info(`POST /api/generate received`, { mode, payload: body })

  const parsed = GenerateRequestSchema.safeParse(body)
  if (!parsed.success) {
    log.error(`invalid payload`, parsed.error.flatten())
    throw createError({ statusCode: 400, statusMessage: 'Invalid payload', data: parsed.error.flatten() })
  }

  const {
    prompts, modelIds, ratio, seed, brief,
    sessionId: requestedSessionId, phase, promptVariant,
    globalParams, perGenerationParams,
  } = parsed.data

  // EPIC-18 / STORY-121 — validation Zod stricte des overrides utilisateur
  // par modèle × scope. On rejette tout payload incohérent avant de toucher la DB.
  for (const [modelId, params] of Object.entries(globalParams ?? {})) {
    if (!MODEL_PROFILES[modelId]) continue // modèle non couvert → ignoré
    const v = validateModelParams(modelId, params, 'global')
    if (!v.success) {
      throw createError({ statusCode: 400, statusMessage: `Invalid globalParams for ${modelId}: ${v.error}` })
    }
  }
  for (const [key, params] of Object.entries(perGenerationParams ?? {})) {
    const [modelId] = key.split('::')
    if (!modelId || !MODEL_PROFILES[modelId]) continue
    const v = validateModelParams(modelId, params, 'per-generation')
    if (!v.success) {
      throw createError({ statusCode: 400, statusMessage: `Invalid perGenerationParams for ${key}: ${v.error}` })
    }
  }
  const activePrompts = prompts.filter((p) => p.trim().length > 0)
  if (activePrompts.length === 0) {
    log.error(`no active prompts`)
    throw createError({ statusCode: 400, statusMessage: 'At least one non-empty prompt required' })
  }
  log.debug(`active prompts: ${activePrompts.length}, models: ${modelIds.length}, ratio=${ratio}`)

  const models = await prisma.model.findMany({
    where: { id: { in: modelIds }, enabled: true },
    include: { provider: true },
  })
  if (models.length === 0) {
    log.error(`no enabled models match the request`, { requested: modelIds })
    throw createError({ statusCode: 400, statusMessage: 'No enabled models match the request' })
  }
  log.info(`resolved ${models.length} enabled models`, models.map((m) => m.id))

  // STORY-096 : si un sessionId valide est fourni, on rattache les nouvelles
  // generations à la session existante (pattern ChatGPT). Sinon, on en crée une
  // nouvelle avec un nom auto-généré horodaté.
  let session
  if (requestedSessionId) {
    const existing = await prisma.session.findUnique({
      where: { id: requestedSessionId },
      include: { generations: true },
    })
    if (existing) {
      log.info(`reusing existing session=${requestedSessionId} (${existing.generations.length} prior gens)`)
      // On crée seulement les nouvelles generations rattachées à la session existante
      const created = await prisma.generation.createManyAndReturn({
        data: activePrompts.flatMap((prompt, promptIdx) =>
          models.map((m) => ({
            sessionId: existing.id,
            promptIdx,
            prompt,
            modelId: m.id,
            ratio,
            status: 'pending',
            costUsd: 0,
            phase,
            promptVariant,
          })),
        ),
      })
      session = { ...existing, generations: created }
    } else {
      log.warn(`requested sessionId=${requestedSessionId} not found, creating new`)
      session = null
    }
  } else {
    session = null
  }
  if (!session) {
    const autoName = `Session ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`
    session = await prisma.session.create({
      data: {
        name: autoName,
        prompts: activePrompts,
        ratio,
        brief: (brief as object | undefined) ?? undefined,
        activePhase: phase,
        generations: {
          create: activePrompts.flatMap((prompt, promptIdx) =>
            models.map((m) => ({
              promptIdx,
              prompt,
              modelId: m.id,
              ratio,
              status: 'pending',
              costUsd: 0,
              phase,
              promptVariant,
            })),
          ),
        },
      },
      include: { generations: true },
    })
    log.info(`created new session=${session.id} name="${autoName}"`)
  }

  // Préparation des tâches
  const tasks: BatchTask[] = []
  const taskIdToGenId = new Map<string, string>()
  // Tâches non-exécutables (modèle sans adapter runtime). On les remontera
  // explicitement en "failed: no_generator" via SSE, plutôt que de skip silencieusement.
  const unrunnable: Array<{ taskId: string; generationId: string; modelId: string }> = []

  for (const gen of session.generations) {
    const generator = getGenerator(gen.modelId, mode)
    const taskId = `${gen.promptIdx}-${gen.modelId}`
    taskIdToGenId.set(taskId, gen.id)

    if (!generator) {
      log.warn(`no generator for model="${gen.modelId}" (mode=${mode}). Did the server restart after adding the adapter?`)
      unrunnable.push({ taskId, generationId: gen.id, modelId: gen.modelId })
      continue
    }

    // En mode `live`, on lit la clé du provider. En mock / mock-real, aucune clé n'est requise.
    const apiKey = mode === 'live' ? getApiKey(models.find((m) => m.id === gen.modelId)!.providerId) : null

    // EPIC-18 / STORY-121 — résolution des params : defaults ⊕ overrides
    // (global et per-generation). Si le modèle n'a pas de profil, on n'envoie
    // aucun param custom (rétrocompat).
    let params: Record<string, unknown> | undefined = undefined
    if (MODEL_PROFILES[gen.modelId]) {
      const globalOverrides = globalParams?.[gen.modelId] ?? {}
      const perGenKey = `${gen.modelId}::${gen.promptIdx}`
      const perGenOverrides = perGenerationParams?.[perGenKey] ?? {}
      const merged = {
        ...defaultsForModel(gen.modelId, 'global'),
        ...defaultsForModel(gen.modelId, 'per-generation'),
        ...globalOverrides,
        ...perGenOverrides,
      }
      params = merged
    }

    tasks.push({
      taskId,
      promptIdx: gen.promptIdx,
      prompt: gen.prompt,
      modelId: gen.modelId,
      generator,
      apiKey,
      params,
    })
  }

  // EPIC-18 / STORY-126 — Map taskId → params figés, utilisée pour la persistance au succès
  const taskIdToParams = new Map<string, Record<string, unknown> | undefined>()
  for (const t of tasks) taskIdToParams.set(t.taskId, t.params)

  // SSE : on stream les résultats au fur et à mesure
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

      log.info(`SSE stream open sessionId=${session.id} tasks=${tasks.length} unrunnable=${unrunnable.length}`)
      send('session', {
        sessionId: session.id,
        sessionName: session.name ?? null,
        generationIds: Array.from(taskIdToGenId.values()),
      })

      // Émettre immédiatement un "failed: no_generator" pour chaque tâche sans adapter runtime,
      // afin que l'UI ne reste pas en "pending" indéfiniment.
      for (const u of unrunnable) {
        try {
          await prisma.generation.update({
            where: { id: u.generationId },
            data: { status: 'failed', errorCode: 'no_generator', errorMsg: `No generator for model "${u.modelId}". Restart the server if the adapter was just added.` },
          })
        } catch {}
        send('result', {
          taskId: u.taskId,
          generationId: u.generationId,
          status: 'failed',
          errorCode: 'no_generator',
          errorMsg: `Adapter runtime introuvable pour ${u.modelId}. Redémarre le serveur si l'adapter vient d'être ajouté.`,
        })
      }

      const abortController = new AbortController()
      // L'event H3 ne propage pas directement l'abort client → on s'appuie sur node:req close
      const nodeReq = event.node.req
      nodeReq.on('close', () => abortController.abort())

      await runBatch(tasks, {
        ratio,
        seed,
        signal: abortController.signal,
        onResult: async (taskId, result) => {
          const generationId = taskIdToGenId.get(taskId)
          if (!generationId) return

          if (result.status === 'success') {
            putImage(generationId, result.output.imageBuffer, result.output.mime)
            const dataUrl = `data:${result.output.mime};base64,${result.output.imageBuffer.toString('base64')}`
            try {
              const frozenParams = taskIdToParams.get(taskId)
              await prisma.generation.update({
                where: { id: generationId },
                data: {
                  status: 'success',
                  seed: result.output.seed != null ? BigInt(result.output.seed) : null,
                  costUsd: result.output.costUsd,
                  rawMeta: result.output.rawResponse as object,
                  // STORY-126 : on fige les params utilisés (ou null si modèle sans profil EPIC-18)
                  params: frozenParams !== undefined ? (frozenParams as object) : undefined,
                },
              })
            } catch (e) { console.error('[generate] DB update failed', e) }
            send('result', {
              taskId,
              generationId,
              status: 'success',
              imageDataUrl: dataUrl,
              seed: result.output.seed,
              costUsd: result.output.costUsd,
              replayedFromVariant: result.output.replayedFromVariant,
            })
          } else if (result.status === 'failed') {
            try {
              await prisma.generation.update({
                where: { id: generationId },
                data: { status: 'failed', errorCode: result.errorCode, errorMsg: result.errorMsg },
              })
            } catch {}
            send('result', { taskId, generationId, status: 'failed', errorCode: result.errorCode, errorMsg: result.errorMsg })
          } else {
            try {
              await prisma.generation.update({ where: { id: generationId }, data: { status: 'aborted' } })
            } catch {}
            send('result', { taskId, generationId, status: 'aborted' })
          }
        },
      })

      log.info(`SSE stream closing sessionId=${session.id}`)
      send('done', { sessionId: session.id })
      try { controller.close() } catch {}
      closed = true
    },
  })

  return sendStream(event, stream)
})
