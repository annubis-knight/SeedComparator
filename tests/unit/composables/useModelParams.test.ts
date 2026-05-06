import { describe, it, expect, beforeEach } from 'vitest'
import { useModelParams } from '../../../app/composables/useModelParams'

describe('useModelParams', () => {
  beforeEach(() => {
    // Reset l'état partagé entre tests : on clear chaque modèle référencé.
    const { resetModel, allOverrides } = useModelParams()
    for (const k of Object.keys(allOverrides.value)) resetModel(k)
  })

  // @requirement: FR-082
  it('setParam ajoute une valeur pour un modèle', () => {
    const { setParam, getParams } = useModelParams()
    setParam('flux-1.1-pro', 'guidanceScale', 7.5)
    expect(getParams('flux-1.1-pro')).toEqual({ guidanceScale: 7.5 })
  })

  // @requirement: FR-082 — badge "modifié" quand au moins un override
  it('hasOverridesFor reflète l\'état', () => {
    const { setParam, hasOverridesFor } = useModelParams()
    expect(hasOverridesFor('m')).toBe(false)
    setParam('m', 'k', 1)
    expect(hasOverridesFor('m')).toBe(true)
  })

  // @requirement: FR-082 — bouton "Réinitialiser"
  it('resetModel efface tous les overrides du modèle', () => {
    const { setParam, resetModel, hasOverridesFor } = useModelParams()
    setParam('m', 'a', 1)
    setParam('m', 'b', 2)
    expect(hasOverridesFor('m')).toBe(true)
    resetModel('m')
    expect(hasOverridesFor('m')).toBe(false)
  })

  // @requirement: FR-082 — ne pollue pas les autres modèles
  it('les overrides sont isolés par modèle', () => {
    const { setParam, getParams } = useModelParams()
    setParam('a', 'x', 1)
    setParam('b', 'x', 2)
    expect(getParams('a')).toEqual({ x: 1 })
    expect(getParams('b')).toEqual({ x: 2 })
  })

  // @requirement: FR-082 — allOverrides utilisable directement comme payload
  it('allOverrides est une map { modelId: { key: value } } prête pour POST /api/generate', () => {
    const { setParam, allOverrides } = useModelParams()
    setParam('flux-1.1-pro', 'guidanceScale', 5)
    setParam('dall-e-3', 'openaiQuality', 'hd')
    expect(allOverrides.value).toEqual({
      'flux-1.1-pro': { guidanceScale: 5 },
      'dall-e-3': { openaiQuality: 'hd' },
    })
  })

  // @requirement: FR-082 (STORY-124 v3) — le shadow store canonique est filtré avant l'envoi serveur
  it('cleanOverridesForServer retire les clés `__canonical__*` (shadow store UI)', () => {
    const { setParam, cleanOverridesForServer } = useModelParams()
    setParam('flux-1.1-pro', 'guidanceScale', 5)
    setParam('flux-1.1-pro', '__canonical__creativity', 5)
    setParam('flux-1.1-pro', '__canonical__quality', 3)
    expect(cleanOverridesForServer.value).toEqual({
      'flux-1.1-pro': { guidanceScale: 5 },
    })
  })

  // @requirement: FR-082 — un modèle qui n'a QUE des clés shadow disparaît du payload nettoyé
  it('cleanOverridesForServer omet les modèles dont tous les overrides sont du shadow', () => {
    const { setParam, cleanOverridesForServer } = useModelParams()
    setParam('dall-e-3', '__canonical__quality', 4)
    expect(cleanOverridesForServer.value).toEqual({})
  })
})
