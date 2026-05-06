import { prisma } from '../../db/client'

/**
 * STORY-099 : liste optimisée pour le RailNav (5 dernières sessions par défaut).
 * Plus léger que /api/sessions (pas de cumul de coûts ni de comptage de likes).
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const limit = Math.min(20, Math.max(1, Number(query.limit) || 5))

  const sessions = await prisma.session.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      name: true,
      createdAt: true,
      _count: { select: { generations: true } },
    },
  })

  return {
    sessions: sessions.map((s) => ({
      id: s.id,
      name: s.name,
      createdAt: s.createdAt.toISOString(),
      generationsCount: s._count.generations,
    })),
  }
})
