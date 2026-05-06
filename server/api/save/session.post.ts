import { writeFile, mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { prisma } from '../../db/client'
import { getImage } from '../../services/imageCache'
import { SaveSessionRequestSchema } from '#shared/contracts'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = SaveSessionRequestSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid payload', data: parsed.error.flatten() })
  }
  const { sessionId, folder } = parsed.data

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { generations: { include: { model: true } } },
  })
  if (!session) throw createError({ statusCode: 404, statusMessage: 'Session not found' })

  const slug = (session.prompts[0] ?? 'session').slice(0, 30).replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'session'
  const stamp = session.createdAt.toISOString().slice(0, 16).replace(/[:T]/g, '-')
  const dirName = `${stamp}_${slug}`
  const dirPath = resolve(folder, dirName)
  await mkdir(dirPath, { recursive: true })

  const savedImages: Array<{ generationId: string; fileName: string }> = []
  for (const gen of session.generations) {
    if (gen.status !== 'success') continue
    const cached = getImage(gen.id)
    if (!cached) continue
    const fileName = `image_${gen.modelId}_${gen.promptIdx}.png`
    await writeFile(resolve(dirPath, fileName), cached.buffer)
    savedImages.push({ generationId: gen.id, fileName })
    await prisma.generation.update({
      where: { id: gen.id },
      data: { imagePath: resolve(dirPath, fileName) },
    })
  }

  const manifest = {
    sessionId: session.id,
    createdAt: session.createdAt.toISOString(),
    prompts: session.prompts,
    ratio: session.ratio,
    generations: session.generations.map((g) => ({
      id: g.id,
      promptIdx: g.promptIdx,
      prompt: g.prompt,
      modelId: g.modelId,
      modelDisplayName: g.model.displayName,
      seed: g.seed?.toString() ?? null,
      status: g.status,
      costUsd: Number(g.costUsd),
      // STORY-126 : params figés exportés dans le manifest pour rejouabilité hors app
      params: (g.params as Record<string, unknown> | null) ?? null,
      file: savedImages.find((s) => s.generationId === g.id)?.fileName ?? null,
    })),
    totalCostUsd: session.generations.reduce((acc, g) => acc + Number(g.costUsd), 0),
  }

  await writeFile(resolve(dirPath, 'manifest.json'), JSON.stringify(manifest, null, 2))

  await prisma.session.update({
    where: { id: sessionId },
    data: { saved: true, saveFolder: dirPath },
  })

  return { ok: true, path: dirPath, savedCount: savedImages.length }
})
