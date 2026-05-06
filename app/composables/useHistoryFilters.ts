import type { Phase } from '#shared/contracts'
import type { LiveGeneration } from './useGenerationSession'

export interface HistoryFilters {
  phase: Phase | 'all'
  variant: 'A' | 'B' | 'C' | 'all'
  modelIds: string[]
  likedOnly: boolean
}

export function useHistoryFilters() {
  const filters = ref<HistoryFilters>({
    phase: 'all',
    variant: 'all',
    modelIds: [],
    likedOnly: false,
  })

  // @requirement: FR-059, FR-072
  function applyFilters(generations: LiveGeneration[]): LiveGeneration[] {
    return generations.filter((g) => {
      if (filters.value.likedOnly && !g.liked) return false
      if (filters.value.phase !== 'all' && g.phase !== filters.value.phase) return false
      if (filters.value.variant !== 'all' && g.promptVariant !== filters.value.variant) return false
      if (filters.value.modelIds.length > 0 && !filters.value.modelIds.includes(g.modelId)) return false
      return true
    })
  }

  function resetFilters() {
    filters.value = { phase: 'all', variant: 'all', modelIds: [], likedOnly: false }
  }

  return { filters, applyFilters, resetFilters }
}
