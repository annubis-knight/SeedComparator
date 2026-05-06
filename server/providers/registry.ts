import { join } from 'node:path'
import type { ImageGenerator } from './types'
import type { ProviderMode } from '#shared/contracts'
import { OPENROUTER_MODELS, createOpenRouterGenerator } from './openrouter'
import { FAL_MODELS, createFalGenerator } from './fal'
import { GOOGLE_AI_MODELS, createGoogleAIGenerator } from './google-ai'
import { OPENAI_MODELS, createOpenAIGenerator } from './openai'
import { createMockGenerator } from './mock'
import { createMockRealGenerator } from './mockReal'
import { createLogger } from '../utils/logger'

const log = createLogger('registry')

// Racine des fixtures pour le mode mock-real. En runtime Nitro, `process.cwd()` pointe
// vers la racine du projet (pas vers `.output/server`), donc le chemin reste stable
// en dev comme en build.
const FIXTURES_ROOT = join(process.cwd(), 'tests', 'fixtures')

const realGenerators = new Map<string, ImageGenerator>()
const mockGenerators = new Map<string, ImageGenerator>()
const mockRealGenerators = new Map<string, ImageGenerator>()

for (const m of OPENROUTER_MODELS) {
  realGenerators.set(m.modelId, createOpenRouterGenerator(m))
  mockGenerators.set(m.modelId, createMockGenerator({
    modelId: m.modelId, source: 'openrouter', pricePerImage: m.pricePerImage, supportsSeed: false,
  }))
  mockRealGenerators.set(m.modelId, createMockRealGenerator({
    modelId: m.modelId, source: 'openrouter', pricePerImage: m.pricePerImage, supportsSeed: false,
    fixturesRoot: FIXTURES_ROOT,
  }))
}
for (const m of FAL_MODELS) {
  realGenerators.set(m.modelId, createFalGenerator(m))
  mockGenerators.set(m.modelId, createMockGenerator({
    modelId: m.modelId, source: 'fal', pricePerImage: m.pricePerImage, supportsSeed: m.supportsSeed,
  }))
  mockRealGenerators.set(m.modelId, createMockRealGenerator({
    modelId: m.modelId, source: 'fal', pricePerImage: m.pricePerImage, supportsSeed: m.supportsSeed,
    fixturesRoot: FIXTURES_ROOT,
  }))
}
for (const m of GOOGLE_AI_MODELS) {
  realGenerators.set(m.modelId, createGoogleAIGenerator(m))
  mockGenerators.set(m.modelId, createMockGenerator({
    modelId: m.modelId, source: 'google-ai', pricePerImage: m.pricePerImage, supportsSeed: false,
  }))
  mockRealGenerators.set(m.modelId, createMockRealGenerator({
    modelId: m.modelId, source: 'google-ai', pricePerImage: m.pricePerImage, supportsSeed: false,
    fixturesRoot: FIXTURES_ROOT,
  }))
}
for (const m of OPENAI_MODELS) {
  realGenerators.set(m.modelId, createOpenAIGenerator(m))
  mockGenerators.set(m.modelId, createMockGenerator({
    modelId: m.modelId, source: 'openai', pricePerImage: m.pricePerImage, supportsSeed: false,
  }))
  mockRealGenerators.set(m.modelId, createMockRealGenerator({
    modelId: m.modelId, source: 'openai', pricePerImage: m.pricePerImage, supportsSeed: false,
    fixturesRoot: FIXTURES_ROOT,
  }))
}

log.info('registry initialized', {
  realCount: realGenerators.size,
  mockCount: mockGenerators.size,
  mockRealCount: mockRealGenerators.size,
  fixturesRoot: FIXTURES_ROOT,
})

export function getGenerator(modelId: string, mode: ProviderMode): ImageGenerator | null {
  const map =
    mode === 'mock' ? mockGenerators :
    mode === 'mock-real' ? mockRealGenerators :
    realGenerators
  const gen = map.get(modelId) ?? null
  if (!gen) {
    log.warn(`no generator for modelId="${modelId}" (mode=${mode})`, {
      availableIds: Array.from(map.keys()),
    })
  } else {
    log.debug(`getGenerator hit modelId="${modelId}" (mode=${mode})`)
  }
  return gen
}

export function listAllModelIds(): string[] {
  return Array.from(realGenerators.keys())
}

// Permet d'injecter un mock custom dans les tests
export function __setGeneratorForTest(modelId: string, gen: ImageGenerator) {
  mockGenerators.set(modelId, gen)
  realGenerators.set(modelId, gen)
  mockRealGenerators.set(modelId, gen)
}
