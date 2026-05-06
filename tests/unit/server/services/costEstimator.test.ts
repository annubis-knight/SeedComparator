import { describe, it, expect } from 'vitest'
import { estimateCost } from '../../../../server/services/costEstimator'

const M = (id: string, price: number) => ({ id, displayName: id, pricePerImage: price })

describe('costEstimator', () => {
  // @requirement: FR-010
  it('retourne 0 si aucun prompt actif', () => {
    const r = estimateCost(['', '', ''], [M('m1', 0.03)])
    expect(r.totalUsd).toBe(0)
    expect(r.generations).toBe(0)
  })

  // @requirement: FR-010
  it('retourne 0 si aucun modèle', () => {
    const r = estimateCost(['un prompt'], [])
    expect(r.totalUsd).toBe(0)
    expect(r.generations).toBe(0)
  })

  // @requirement: FR-010
  it('multiplie correctement prompts × modèles', () => {
    const r = estimateCost(['p1', 'p2'], [M('m1', 0.03), M('m2', 0.10)])
    expect(r.generations).toBe(4)
    expect(r.totalUsd).toBeCloseTo(0.26, 5) // 2 * (0.03 + 0.10) = 0.26
  })

  // @requirement: FR-010
  it('ignore les prompts vides ou whitespace', () => {
    const r = estimateCost(['p1', '  ', ''], [M('m1', 0.05)])
    expect(r.generations).toBe(1)
    expect(r.totalUsd).toBeCloseTo(0.05, 5)
  })

  // @requirement: FR-010
  it('expose un breakdown par modèle', () => {
    const r = estimateCost(['p1', 'p2', 'p3'], [M('a', 0.01), M('b', 0.05)])
    expect(r.breakdown).toHaveLength(2)
    expect(r.breakdown[0]).toMatchObject({ modelId: 'a', count: 3, pricePerImage: 0.01 })
  })

  // @requirement: FR-038
  it('multiplie le coût et le count par nbImagesPerPrompt', () => {
    const r = estimateCost(['p1', 'p2'], [M('m1', 0.03)], 3)
    expect(r.generations).toBe(6) // 2 prompts × 1 modèle × 3 images
    expect(r.totalUsd).toBeCloseTo(0.18, 5)
    expect(r.breakdown[0]!.count).toBe(6)
  })

  // @requirement: FR-038
  it('par défaut nbImagesPerPrompt vaut 1', () => {
    const r = estimateCost(['p1'], [M('m1', 0.10)])
    expect(r.totalUsd).toBeCloseTo(0.10, 5)
    expect(r.generations).toBe(1)
  })

  // @requirement: FR-083 — coût réactif aux paramètres affectsCost
  it('DALL·E 3 : openaiQuality=hd double le prix de base', () => {
    const r = estimateCost(['p1'], [M('dall-e-3', 0.040)], 1, {
      'dall-e-3': { openaiQuality: 'hd' },
    })
    // Multiplicateur ×2 → 0.08
    expect(r.breakdown[0]!.pricePerImage).toBeCloseTo(0.080, 3)
    expect(r.totalUsd).toBeCloseTo(0.080, 3)
  })

  // @requirement: FR-083 — anti-régression
  it('sans globalParams, coût identique au comportement V1', () => {
    const r1 = estimateCost(['p1'], [M('dall-e-3', 0.040)])
    const r2 = estimateCost(['p1'], [M('dall-e-3', 0.040)], 1, {})
    expect(r1.totalUsd).toBe(r2.totalUsd)
  })

  // @requirement: FR-083 — un override sur un trait sans affectsCost ne change rien
  it('overrides sans affectsCost (ex: numInferenceSteps) ne changent pas le coût', () => {
    const r = estimateCost(['p1'], [M('flux-1.1-pro', 0.040)], 1, {
      'flux-1.1-pro': { numInferenceSteps: 50, guidanceScale: 7 },
    })
    expect(r.totalUsd).toBeCloseTo(0.040, 3)
  })
})
