import pLimit from 'p-limit'
import type { ImageGenerator, GenerateOutput } from '../providers/types'
import { ProviderError } from '../providers/types'
import type { Ratio } from '#shared/contracts'
import { createLogger } from '../utils/logger'

const log = createLogger('batch')

export interface BatchTask {
  taskId: string // ex: `${promptIdx}-${modelId}`
  promptIdx: number
  prompt: string
  modelId: string
  generator: ImageGenerator
  apiKey: string | null
  /**
   * EPIC-18 / STORY-121 — Paramètres résolus pour ce modèle (defaults ⊕
   * overrides utilisateur, scope global ∪ per-generation). Chaque adapter
   * ignore ce qu'il ne connaît pas.
   */
  params?: Record<string, unknown>
}

export interface BatchOptions {
  concurrency?: number
  ratio: Ratio
  seed?: number | null
  signal: AbortSignal
  /**
   * Callback invoqué pour chaque tâche terminée.
   * Peut être `async` — `runBatch` attend sa résolution avant de considérer
   * la tâche complète, ce qui garantit que le caller (ex: SSE) a fini d'écrire
   * son event avant que `runBatch` ne retourne.
   */
  onResult: (taskId: string, result: BatchResult) => void | Promise<void>
}

export type BatchResult =
  | { status: 'success'; output: GenerateOutput }
  | { status: 'failed'; errorCode: string; errorMsg: string }
  | { status: 'aborted' }

export async function runBatch(tasks: BatchTask[], opts: BatchOptions): Promise<void> {
  const concurrency = opts.concurrency ?? 3
  const limit = pLimit(concurrency)
  const t0 = Date.now()
  log.info(`runBatch start tasks=${tasks.length} concurrency=${concurrency} ratio=${opts.ratio}`)

  await Promise.all(
    tasks.map((task) =>
      limit(async () => {
        const tTask = Date.now()
        if (opts.signal.aborted) {
          log.warn(`task aborted before start taskId=${task.taskId}`)
          await opts.onResult(task.taskId, { status: 'aborted' })
          return
        }
        log.debug(`task start taskId=${task.taskId} model=${task.modelId}`)
        try {
          const output = await task.generator.generate(
            { prompt: task.prompt, ratio: opts.ratio, seed: opts.seed ?? null, params: task.params },
            opts.signal,
            task.apiKey,
          )
          log.info(`task success taskId=${task.taskId} in ${Date.now() - tTask}ms`)
          await opts.onResult(task.taskId, { status: 'success', output })
        } catch (err: unknown) {
          if (err instanceof ProviderError) {
            if (err.code === 'aborted') {
              log.warn(`task aborted taskId=${task.taskId} after ${Date.now() - tTask}ms`)
              await opts.onResult(task.taskId, { status: 'aborted' })
            } else {
              log.error(`task failed taskId=${task.taskId} code=${err.code}`, { msg: err.message })
              await opts.onResult(task.taskId, { status: 'failed', errorCode: err.code, errorMsg: err.message })
            }
          } else {
            const message = err instanceof Error ? err.message : String(err)
            log.error(`task failed (unknown) taskId=${task.taskId}`, { msg: message })
            await opts.onResult(task.taskId, { status: 'failed', errorCode: 'unknown', errorMsg: message })
          }
        }
      }),
    ),
  )

  log.info(`runBatch done in ${Date.now() - t0}ms`)
}
