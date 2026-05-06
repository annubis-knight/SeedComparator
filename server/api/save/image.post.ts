import { writeFile, mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { prisma } from '../../db/client'
import { getImage } from '../../services/imageCache'
import { SaveImageRequestSchema } from '#shared/contracts'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = SaveImageRequestSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid payload', data: parsed.error.flatten() })
  }
  const { generationId, folder } = parsed.data

  const gen = await prisma.generation.findUnique({
    where: { id: generationId },
    include: { model: true, session: true },
  })
  if (!gen) throw createError({ statusCode: 404, statusMessage: 'Generation not found' })

  const cached = getImage(generationId)
  if (!cached) throw createError({ statusCode: 410, statusMessage: 'Image no longer in cache' })

  await mkdir(folder, { recursive: true })
  const fileName = `${gen.modelId}_${gen.promptIdx}_${gen.id.slice(0, 8)}.png`
  const fullPath = resolve(folder, fileName)
  await writeFile(fullPath, cached.buffer)

  await prisma.generation.update({
    where: { id: generationId },
    data: { imagePath: fullPath },
  })

  return { ok: true, path: fullPath }
})
