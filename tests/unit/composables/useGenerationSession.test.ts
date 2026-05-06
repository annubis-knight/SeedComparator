import { describe, it, expect } from 'vitest'
import { buildIdleCards } from '../../../app/composables/useGenerationSession'

describe('buildIdleCards', () => {
  // @requirement: FR-039
  it('retourne 0 carte si aucun modèle ou aucun prompt', () => {
    expect(buildIdleCards([], 1)).toHaveLength(0)
    expect(buildIdleCards(['m1'], 0)).toHaveLength(0)
  })

  // @requirement: FR-039
  it('retourne nbModels × nbPrompts cards en état idle', () => {
    const cards = buildIdleCards(['flux', 'sd35'], 2)
    expect(cards).toHaveLength(4)
    expect(cards.every((c) => c.status === 'idle')).toBe(true)
    expect(cards.every((c) => c.imageDataUrl === null)).toBe(true)
  })

  // @requirement: FR-039
  it('génère des taskId stables au format `${promptIdx}-${modelId}`', () => {
    const cards = buildIdleCards(['m1'], 2)
    expect(cards[0]!.taskId).toBe('0-m1')
    expect(cards[1]!.taskId).toBe('1-m1')
  })

  // @requirement: FR-069
  it('propage la phase par défaut (wireframe) sur chaque carte', () => {
    const cards = buildIdleCards(['m1'], 2)
    expect(cards.every((c) => c.phase === 'wireframe')).toBe(true)
  })

  // @requirement: FR-069
  it('propage la phase fournie (mood) sur chaque carte', () => {
    const cards = buildIdleCards(['m1', 'm2'], 1, 'mood')
    expect(cards.every((c) => c.phase === 'mood')).toBe(true)
  })

  // @requirement: FR-069
  it('propage le promptVariant fourni (B) sur chaque carte', () => {
    const cards = buildIdleCards(['m1'], 1, 'uiux', 'B')
    expect(cards[0]!.promptVariant).toBe('B')
  })
})
