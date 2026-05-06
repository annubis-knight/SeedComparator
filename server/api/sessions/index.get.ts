import { prisma } from '../../db/client'

export default defineEventHandler(async () => {
  const sessions = await prisma.session.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      _count: { select: { generations: true } },
      generations: { select: { costUsd: true, status: true, liked: true } },
    },
  })
  return {
    sessions: sessions.map((s) => ({
      id: s.id,
      name: s.name,
      createdAt: s.createdAt.toISOString(),
      prompts: s.prompts,
      ratio: s.ratio,
      saved: s.saved,
      saveFolder: s.saveFolder,
      generationsCount: s._count.generations,
      successCount: s.generations.filter((g) => g.status === 'success').length,
      likedCount: s.generations.filter((g) => g.liked).length,
      totalCostUsd: s.generations.reduce((acc, g) => acc + Number(g.costUsd), 0),
    })),
  }
})
