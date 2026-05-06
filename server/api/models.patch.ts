import { prisma } from '../db/client'
import { ModelToggleSchema } from '#shared/contracts'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = ModelToggleSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid payload', data: parsed.error.flatten() })
  }
  const updated = await prisma.model.update({
    where: { id: parsed.data.modelId },
    data: { enabled: parsed.data.enabled },
  })
  return { id: updated.id, enabled: updated.enabled }
})
