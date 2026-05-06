import { prisma } from '../db/client'
import { listProviderIdsWithKeys } from '../services/apiKeys'
import { getProviderMode } from '../services/providerMode'
import { fixtureExists } from '../services/fixtureWriter'
import type { ProviderSource } from '../providers/types'
import type { ModelDTO, ParamFieldMetaDTO } from '#shared/contracts'
import { resolveModelParamFields } from '../providers/paramResolver'
import { MODEL_PROFILES } from '../providers/modelParamProfiles'

function paramFieldsFor(modelId: string): ParamFieldMetaDTO[] {
  // EPIC-18 / STORY-120 — un modèle sans profil renvoie une liste vide
  // (rétrocompat : modèles non encore couverts).
  if (!MODEL_PROFILES[modelId]) return []
  return resolveModelParamFields(modelId) as ParamFieldMetaDTO[]
}

export default defineEventHandler(async (): Promise<{ models: ModelDTO[] }> => {
  const mode = await getProviderMode()
  const keysAreImplicit = mode !== 'live'

  const models = await prisma.model.findMany({
    include: { provider: true },
    orderBy: [{ brandSortOrder: 'asc' }, { pricePerImage: 'asc' }],
  })

  const providersWithKeys = new Set(listProviderIdsWithKeys())

  const computeHasFixture = (modelId: string, providerId: string): boolean => {
    if (mode !== 'mock-real') return true
    return fixtureExists({ source: providerId as ProviderSource, modelId })
  }

  return {
    models: models.map((m) => ({
      id: m.id,
      providerId: m.providerId,
      providerDisplayName: m.provider.displayName,
      brandId: m.brandId,
      brandDisplayName: m.brandDisplayName,
      brandSortOrder: m.brandSortOrder,
      displayName: m.displayName,
      supportsSeed: m.supportsSeed,
      supportsEditing: m.supportsEditing,
      pricePerImage: Number(m.pricePerImage),
      enabled: m.enabled,
      hasApiKey: keysAreImplicit || providersWithKeys.has(m.providerId),
      hasFixture: computeHasFixture(m.id, m.providerId),
      paramFields: paramFieldsFor(m.id),
    })),
  }
})
