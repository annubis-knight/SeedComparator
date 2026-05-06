import type { CostEstimate } from '#shared/contracts'
import { costAdditionForOverrides, costMultiplierForOverrides } from './paramCostImpact'

export interface ModelPriceLookup {
  id: string
  displayName: string
  pricePerImage: number
}

export function estimateCost(
  prompts: string[],
  models: ModelPriceLookup[],
  nbImagesPerPrompt = 1,
  /**
   * STORY-125 / EPIC-18 — overrides utilisateur scope=global, par modèle.
   * Le coût est ajusté via les traits `affectsCost`.
   */
  globalParams: Record<string, Record<string, unknown>> = {},
): CostEstimate {
  const promptCount = prompts.filter((p) => p.trim().length > 0).length
  const nb = Math.max(1, Math.floor(nbImagesPerPrompt))
  if (promptCount === 0 || models.length === 0) {
    return { generations: 0, totalUsd: 0, breakdown: [] }
  }

  const breakdown = models.map((m) => {
    const overrides = globalParams[m.id]
    const mult = costMultiplierForOverrides(m.id, overrides)
    const add = costAdditionForOverrides(m.id, overrides)
    const adjustedPrice = m.pricePerImage * mult + add
    return {
      modelId: m.id,
      modelDisplayName: m.displayName,
      pricePerImage: roundUsd(adjustedPrice),
      count: promptCount * nb,
    }
  })

  const totalUsd = breakdown.reduce((acc, b) => acc + b.pricePerImage * b.count, 0)
  const generations = promptCount * models.length * nb

  return {
    generations,
    totalUsd: roundUsd(totalUsd),
    breakdown,
  }
}

function roundUsd(n: number): number {
  return Math.round(n * 1000) / 1000
}
