import { prisma } from '../../db/client'
import { createLogger } from '../../utils/logger'
import { deleteImage } from '../../services/imageCache'

const log = createLogger('generations.purge-unloked')

/**
 * STORY-106 (FR-071) — Purge toutes les Generation non-likées de la DB.
 * Appelé au `before-quit` de l'app Electron pour respecter la règle :
 * "seules les likées survivent à la fermeture".
 */
export default defineEventHandler(async () => {
  const unloked = await prisma.generation.findMany({
    where: { liked: false },
    select: { id: true },
  })

  if (unloked.length === 0) {
    log.info('purge-unloked: nothing to purge')
    return { purged: 0 }
  }

  const ids = unloked.map((g) => g.id)
  // Vider le cache image en mémoire vive
  for (const id of ids) {
    deleteImage(id)
  }

  const { count } = await prisma.generation.deleteMany({
    where: { liked: false },
  })

  log.info(`purge-unloked: deleted ${count} non-liked generations`)
  return { purged: count }
})
