import { z } from 'zod'
import { prisma } from '../../../db/client'
import { writeLikedImage, removeLikedImage } from '../../../services/likeStorage'
import { createLogger } from '../../../utils/logger'

const log = createLogger('like')

const Schema = z.object({
  liked: z.boolean(),
  /** Dossier base de sauvegarde (rendu obligatoire ici, le frontend le récupère
   *  depuis Setting `save_folder` ou via dialog Electron au premier like). */
  folder: z.string().min(1),
})

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing generation id' })

  const body = await readBody(event)
  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    log.warn('invalid payload', parsed.error.flatten())
    throw createError({ statusCode: 400, statusMessage: 'Invalid payload', data: parsed.error.flatten() })
  }
  const { liked, folder } = parsed.data

  const gen = await prisma.generation.findUnique({ where: { id }, select: { id: true, status: true } })
  if (!gen) throw createError({ statusCode: 404, statusMessage: 'Generation not found' })
  if (gen.status !== 'success') {
    throw createError({ statusCode: 409, statusMessage: 'Cannot like a non-success generation' })
  }

  log.info(`PATCH /api/generations/${id}/like liked=${liked} folder="${folder}"`)

  // Toggle DB
  await prisma.generation.update({
    where: { id },
    data: { liked },
  })

  // Persistance disque
  if (liked) {
    try {
      const paths = await writeLikedImage(id, folder)
      // Marquer la session "saved=true" puisqu'au moins 1 image y est persistée
      await prisma.generation.findUnique({ where: { id }, select: { sessionId: true } })
        .then((g) => g && prisma.session.update({ where: { id: g.sessionId }, data: { saved: true, saveFolder: folder } }))
        .catch(() => {})
      return { ok: true, liked: true, image: paths.image, sidecar: paths.sidecar }
    } catch (err) {
      log.error(`writeLikedImage failed gen=${id}`, { msg: (err as Error).message })
      // On rollback le flag DB pour rester cohérent : pas de like si fichier non écrit
      await prisma.generation.update({ where: { id }, data: { liked: false } }).catch(() => {})
      throw createError({ statusCode: 500, statusMessage: `Could not save liked image: ${(err as Error).message}` })
    }
  } else {
    await removeLikedImage(id, folder)
    return { ok: true, liked: false }
  }
})
