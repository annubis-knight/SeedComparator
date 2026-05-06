import { prisma } from '../../db/client'
import { fixtureExists, readFixture } from '../../services/fixtureWriter'
import type { ProviderSource } from '../../providers/types'
import { createLogger } from '../../utils/logger'

const log = createLogger('models.fixture-status')

/**
 * STORY-101 — pour chaque modèle DB, indique si une fixture nominale existe.
 * Réponse : { [modelId]: { hasFixture: bool, capturedAt?: string, source: string } }
 */
export default defineEventHandler(async () => {
  const models = await prisma.model.findMany({
    include: { provider: true },
  })

  // Map providerId → source (la source de l'adapter, pas le providerId DB).
  // En pratique ils sont identiques pour openai/fal/google-ai/openrouter,
  // mais on prend le providerId comme source par défaut. Si la fixture n'a
  // jamais été capturée, on ne sait pas — on tente le providerId.
  const result: Record<string, { hasFixture: boolean; capturedAt?: string; source: string }> = {}
  for (const m of models) {
    const source = m.providerId as ProviderSource
    const has = fixtureExists({ source, modelId: m.id })
    let capturedAt: string | undefined
    if (has) {
      const f = readFixture({ source, modelId: m.id })
      capturedAt = f?.capturedAt
    }
    result[m.id] = { hasFixture: has, capturedAt, source }
  }

  log.debug(`fixture-status computed for ${models.length} models`)
  return { fixtures: result }
})
