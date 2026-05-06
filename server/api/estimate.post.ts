import { z } from 'zod'
import { prisma } from '../db/client'
import { estimateCost } from '../services/costEstimator'
import { createLogger } from '../utils/logger'

const log = createLogger('estimate')

const Schema = z.object({
  prompts: z.array(z.string()).min(1).max(3),
  modelIds: z.array(z.string()).min(1),
  /**
   * STORY-125 / EPIC-18 — overrides utilisateur scope=global, par modèle.
   * Optionnel ; si absent, l'estimation reproduit le comportement V1.
   */
  globalParams: z.record(z.string(), z.record(z.string(), z.unknown())).optional(),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  log.debug(`POST /api/estimate received`, body)
  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    log.warn(`invalid payload`, parsed.error.flatten())
    throw createError({ statusCode: 400, statusMessage: 'Invalid payload', data: parsed.error.flatten() })
  }
  const models = await prisma.model.findMany({
    where: { id: { in: parsed.data.modelIds } },
  })
  const result = estimateCost(
    parsed.data.prompts,
    models.map((m) => ({ id: m.id, displayName: m.displayName, pricePerImage: Number(m.pricePerImage) })),
    1,
    parsed.data.globalParams,
  )
  log.info(`estimate ${result.generations} gens, total $${result.totalUsd.toFixed(3)}`)
  return result
})
