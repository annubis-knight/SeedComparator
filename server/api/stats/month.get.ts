import { prisma } from '../../db/client'

export default defineEventHandler(async () => {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const result = await prisma.generation.aggregate({
    _sum: { costUsd: true },
    where: { createdAt: { gte: start } },
  })
  return { totalUsd: Number(result._sum.costUsd ?? 0) }
})
