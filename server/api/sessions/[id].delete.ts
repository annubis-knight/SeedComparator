import { prisma } from '../../db/client'
import { createLogger } from '../../utils/logger'

const log = createLogger('sessions.delete')

/**
 * Supprime une session et toutes ses generations (cascade défini en schema).
 * Les fichiers disque (likes / saved images) ne sont pas nettoyés ici — c'est
 * une responsabilité du caller s'il veut faire le ménage côté FS.
 */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing session id' })

  try {
    await prisma.session.delete({ where: { id } })
    log.info(`deleted session=${id} (cascade generations)`)
    return { ok: true, id }
  } catch (err) {
    log.error(`delete failed for session=${id}`, { msg: (err as Error).message })
    throw createError({ statusCode: 404, statusMessage: 'Session not found' })
  }
})
