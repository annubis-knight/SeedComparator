import { describe, it, expect, beforeEach } from 'vitest'
import { usePerGenerationParams } from '../../../app/composables/usePerGenerationParams'

describe('usePerGenerationParams', () => {
  beforeEach(() => {
    const { reset, allOverrides } = usePerGenerationParams()
    for (const k of Object.keys(allOverrides.value)) {
      const [modelId, idx] = k.split('::')
      if (modelId && idx) reset(modelId, parseInt(idx, 10))
    }
  })

  // @requirement: FR-085 — seed verrouillée par modèle × promptIdx
  it('lockSeed sépare bien les valeurs par modèle et par prompt', () => {
    const { lockSeed, getParams } = usePerGenerationParams()
    lockSeed('flux-1.1-pro', 0, 42)
    lockSeed('flux-1.1-pro', 1, 99)
    lockSeed('sd-3.5-large', 0, 1234)
    expect(getParams('flux-1.1-pro', 0)).toEqual({ seed: 42 })
    expect(getParams('flux-1.1-pro', 1)).toEqual({ seed: 99 })
    expect(getParams('sd-3.5-large', 0)).toEqual({ seed: 1234 })
  })

  // @requirement: FR-085 — déverrouillage avec null
  it('lockSeed avec null retire la seed', () => {
    const { lockSeed, isSeedLocked } = usePerGenerationParams()
    lockSeed('flux-1.1-pro', 0, 42)
    expect(isSeedLocked('flux-1.1-pro', 0)).toBe(true)
    lockSeed('flux-1.1-pro', 0, null)
    expect(isSeedLocked('flux-1.1-pro', 0)).toBe(false)
  })

  // @requirement: FR-085 — propagation au payload
  it('allOverrides utilise la clé `${modelId}::${promptIdx}`', () => {
    const { lockSeed, allOverrides } = usePerGenerationParams()
    lockSeed('flux-1.1-pro', 0, 42)
    expect(allOverrides.value).toEqual({
      'flux-1.1-pro::0': { seed: 42 },
    })
  })
})
