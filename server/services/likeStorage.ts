import { writeFile, mkdir, unlink } from 'node:fs/promises'
import { resolve } from 'node:path'
import { prisma } from '../db/client'
import { getImage } from './imageCache'
import { createLogger } from '../utils/logger'

const log = createLogger('likeStorage')

/**
 * Slug safe pour nom de fichier/dossier — autorise lettres, chiffres, tirets, underscores.
 * Tout le reste devient un tiret.
 */
function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || 'session'
}

/**
 * Construit le chemin de stockage pour une image likée :
 *   <baseFolder>/<sessionSlug>/<generationId>.png  (image)
 *   <baseFolder>/<sessionSlug>/<generationId>.json (sidecar méta)
 */
export function buildLikedPaths(baseFolder: string, sessionName: string | null, sessionId: string, generationId: string) {
  const slug = sessionName ? slugify(sessionName) : `session-${sessionId.slice(0, 8)}`
  const dir = resolve(baseFolder, slug)
  return {
    dir,
    image: resolve(dir, `${generationId}.png`),
    sidecar: resolve(dir, `${generationId}.json`),
  }
}

/**
 * Persiste sur disque l'image likée + son sidecar JSON de métadonnées.
 * Pré-condition : l'image est en cache temp ; le baseFolder existe.
 */
export async function writeLikedImage(generationId: string, baseFolder: string): Promise<{ image: string; sidecar: string }> {
  const gen = await prisma.generation.findUnique({
    where: { id: generationId },
    include: { model: true, session: true },
  })
  if (!gen) throw new Error(`Generation not found: ${generationId}`)

  const cached = getImage(generationId)
  if (!cached) throw new Error(`Image not in cache for generation ${generationId}`)

  const paths = buildLikedPaths(baseFolder, gen.session.name, gen.session.id, gen.id)
  await mkdir(paths.dir, { recursive: true })
  await writeFile(paths.image, cached.buffer)

  // Sidecar : info utile pour ré-utiliser/présenter l'image plus tard
  const sidecar = {
    generationId: gen.id,
    sessionId: gen.session.id,
    sessionName: gen.session.name,
    modelId: gen.modelId,
    modelDisplayName: gen.model.displayName,
    promptIdx: gen.promptIdx,
    prompt: gen.prompt,
    seed: gen.seed?.toString() ?? null,
    ratio: gen.ratio,
    costUsd: Number(gen.costUsd),
    // STORY-126 : params figés exportés avec l'image likée
    params: (gen.params as Record<string, unknown> | null) ?? null,
    createdAt: gen.createdAt.toISOString(),
  }
  await writeFile(paths.sidecar, JSON.stringify(sidecar, null, 2))

  await prisma.generation.update({
    where: { id: generationId },
    data: { imagePath: paths.image },
  })

  log.info(`writeLikedImage gen=${generationId} → ${paths.image}`)
  return { image: paths.image, sidecar: paths.sidecar }
}

/**
 * Supprime de disque l'image likée + son sidecar (best-effort, ignore les erreurs).
 */
export async function removeLikedImage(generationId: string, baseFolder: string): Promise<void> {
  const gen = await prisma.generation.findUnique({
    where: { id: generationId },
    include: { session: true },
  })
  if (!gen) return

  const paths = buildLikedPaths(baseFolder, gen.session.name, gen.session.id, gen.id)
  await unlink(paths.image).catch(() => {})
  await unlink(paths.sidecar).catch(() => {})
  await prisma.generation.update({
    where: { id: generationId },
    data: { imagePath: null },
  }).catch(() => {})
  log.info(`removeLikedImage gen=${generationId} ← ${paths.image}`)
}
