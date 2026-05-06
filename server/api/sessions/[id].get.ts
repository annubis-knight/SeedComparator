import { prisma } from '../../db/client'
import { imageToDataUrl } from '../../services/imageCache'
import type { SessionDTO } from '#shared/contracts'


export default defineEventHandler(async (event): Promise<SessionDTO> => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  const session = await prisma.session.findUnique({
    where: { id },
    include: {
      generations: {
        include: { model: true },
        orderBy: [{ promptIdx: 'asc' }, { createdAt: 'asc' }],
      },
    },
  })
  if (!session) throw createError({ statusCode: 404, statusMessage: 'Session not found' })

  return {
    id: session.id,
    name: session.name,
    createdAt: session.createdAt.toISOString(),
    prompts: session.prompts,
    promptsByPhase: session.promptsByPhase as SessionDTO['promptsByPhase'],
    activePhase: (session.activePhase as SessionDTO['activePhase']) ?? 'wireframe',
    ratio: session.ratio,
    saved: session.saved,
    saveFolder: session.saveFolder,
    totalCostUsd: session.generations.reduce((acc, g) => acc + Number(g.costUsd), 0),
    generations: session.generations.map((g) => ({
      id: g.id,
      sessionId: g.sessionId,
      promptIdx: g.promptIdx,
      prompt: g.prompt,
      modelId: g.modelId,
      modelDisplayName: g.model.displayName,
      seed: g.seed != null ? g.seed.toString() : null,
      ratio: g.ratio,
      status: g.status as SessionDTO['generations'][number]['status'],
      errorCode: g.errorCode,
      errorMsg: g.errorMsg,
      imagePath: g.imagePath,
      imageDataUrl: imageToDataUrl(g.id),
      costUsd: Number(g.costUsd),
      liked: g.liked,
      phase: (g.phase as SessionDTO['generations'][number]['phase']) ?? 'wireframe',
      promptVariant: (g.promptVariant as 'A' | 'B' | 'C') ?? 'A',
      params: (g.params as Record<string, unknown> | null) ?? null,
      createdAt: g.createdAt.toISOString(),
    })),
  }
})
