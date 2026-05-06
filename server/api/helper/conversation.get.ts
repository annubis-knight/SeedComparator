import { prisma } from '../../db/client'
import { PhaseSchema } from '#shared/contracts'
import { createLogger } from '../../utils/logger'

const log = createLogger('helper/conversation')

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const sessionId = String(query.sessionId ?? '')
  const phaseRaw = query.phase

  if (!sessionId) throw createError({ statusCode: 400, statusMessage: 'sessionId required' })

  const phaseParsed = PhaseSchema.safeParse(phaseRaw)
  if (!phaseParsed.success) throw createError({ statusCode: 400, statusMessage: 'Invalid phase' })

  const phase = phaseParsed.data
  log.debug(`GET /api/helper/conversation sessionId=${sessionId} phase=${phase}`)

  const conv = await prisma.helperConversation.findUnique({
    where: { sessionId_phase: { sessionId, phase } },
  })

  return { messages: (conv?.messages ?? []) as Array<{ role: string; content: string }> }
})
