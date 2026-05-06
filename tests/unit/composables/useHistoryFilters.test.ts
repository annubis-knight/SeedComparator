import { describe, it, expect, beforeEach } from 'vitest'
import { useHistoryFilters } from '../../../app/composables/useHistoryFilters'
import type { LiveGeneration } from '../../../app/composables/useGenerationSession'

function makeGen(overrides: Partial<LiveGeneration>): LiveGeneration {
  return {
    taskId: 'x', generationId: 'g', promptIdx: 0, modelId: 'model-a',
    status: 'success', imageDataUrl: 'data:image/png;base64,x',
    seed: null, costUsd: 0, errorCode: null, errorMsg: null,
    liked: false, phase: 'wireframe', promptVariant: 'A',
    ...overrides,
  }
}

describe('useHistoryFilters', () => {
  let filters: ReturnType<typeof useHistoryFilters>

  beforeEach(() => {
    filters = useHistoryFilters()
  })

  // @requirement: FR-059
  it('retourne toutes les générations avec les filtres par défaut', () => {
    const gens = [makeGen({ phase: 'wireframe' }), makeGen({ phase: 'mood' }), makeGen({ phase: 'uiux' })]
    expect(filters.applyFilters(gens)).toHaveLength(3)
  })

  // @requirement: FR-059
  it('filtre par phase', () => {
    const gens = [makeGen({ phase: 'wireframe' }), makeGen({ phase: 'mood' }), makeGen({ phase: 'uiux' })]
    filters.filters.value.phase = 'mood'
    const result = filters.applyFilters(gens)
    expect(result).toHaveLength(1)
    expect(result[0].phase).toBe('mood')
  })

  // @requirement: FR-059
  it('filtre par variant', () => {
    const gens = [makeGen({ promptVariant: 'A' }), makeGen({ promptVariant: 'B' }), makeGen({ promptVariant: 'C' })]
    filters.filters.value.variant = 'B'
    const result = filters.applyFilters(gens)
    expect(result).toHaveLength(1)
    expect(result[0].promptVariant).toBe('B')
  })

  // @requirement: FR-072
  it('filtre likedOnly exclut les non-likées', () => {
    const gens = [makeGen({ liked: true }), makeGen({ liked: false }), makeGen({ liked: true })]
    filters.filters.value.likedOnly = true
    const result = filters.applyFilters(gens)
    expect(result).toHaveLength(2)
    expect(result.every(g => g.liked)).toBe(true)
  })

  // @requirement: FR-059
  it('filtre par modelIds quand non vide', () => {
    const gens = [makeGen({ modelId: 'model-a' }), makeGen({ modelId: 'model-b' })]
    filters.filters.value.modelIds = ['model-a']
    const result = filters.applyFilters(gens)
    expect(result).toHaveLength(1)
    expect(result[0].modelId).toBe('model-a')
  })

  // @requirement: FR-059, FR-072
  it('combine plusieurs filtres (phase + likedOnly)', () => {
    const gens = [
      makeGen({ phase: 'wireframe', liked: true }),
      makeGen({ phase: 'wireframe', liked: false }),
      makeGen({ phase: 'mood', liked: true }),
    ]
    filters.filters.value.phase = 'wireframe'
    filters.filters.value.likedOnly = true
    const result = filters.applyFilters(gens)
    expect(result).toHaveLength(1)
    expect(result[0].phase).toBe('wireframe')
    expect(result[0].liked).toBe(true)
  })

  // @requirement: FR-059
  it('resetFilters remet tous les filtres à their valeurs par défaut', () => {
    filters.filters.value.phase = 'uiux'
    filters.filters.value.variant = 'C'
    filters.filters.value.likedOnly = true
    filters.filters.value.modelIds = ['model-x']
    filters.resetFilters()
    expect(filters.filters.value.phase).toBe('all')
    expect(filters.filters.value.variant).toBe('all')
    expect(filters.filters.value.likedOnly).toBe(false)
    expect(filters.filters.value.modelIds).toHaveLength(0)
  })
})
