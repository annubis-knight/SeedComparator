import { z } from 'zod'
import { prisma } from '../../db/client'
import { PhaseSchema } from '#shared/contracts'
import { createLogger } from '../../utils/logger'

const log = createLogger('sessions.patch')

const Schema = z.object({
  name: z.string().min(1).max(120).optional(),
  activePhase: PhaseSchema.optional(),
})

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing session id' })

  const body = await readBody(event)
  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    log.warn('invalid patch payload', parsed.error.flatten())
    throw createError({ statusCode: 400, statusMessage: 'Invalid payload', data: parsed.error.flatten() })
  }

  const updateData: { name?: string; activePhase?: string } = {}
  if (parsed.data.name) updateData.name = parsed.data.name.trim()
  if (parsed.data.activePhase) updateData.activePhase = parsed.data.activePhase

  if (Object.keys(updateData).length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Nothing to update' })
  }

  try {
    const updated = await prisma.session.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, activePhase: true },
    })
    log.info(`patched session=${id}`, updateData)
    return updated
  } catch (err) {
    log.error(`session not found id=${id}`, { msg: (err as Error).message })
    throw createError({ statusCode: 404, statusMessage: 'Session not found' })
  }
})
