import { describe, it, expect } from 'vitest'
import { PARAM_TRAITS } from '../../../../server/providers/paramTraits'
import {
  resolveModelParamFields,
  validateModelParams,
  defaultsForModel,
} from '../../../../server/providers/paramResolver'
import { MODEL_PROFILES } from '../../../../server/providers/modelParamProfiles'

/**
 * STORY-120 — Catalogue mutualisé de traits + composition par modèle.
 * Source de vérité = `paramTraits.ts` ; composition = `modelParamProfiles.ts`.
 */
describe('paramTraits — catalogue', () => {
  // @requirement: FR-077 (tooltip non-vide pour chaque trait)
  // @requirement: FR-081 (tooltip d'information accessible)
  it('chaque trait porte un tooltip non-vide et différent du label', () => {
    for (const [key, trait] of Object.entries(PARAM_TRAITS)) {
      expect(trait.key, `key cohérente pour ${key}`).toBe(key)
      expect(trait.label, `label non-vide pour ${key}`).toBeTruthy()
      expect(trait.tooltip, `tooltip non-vide pour ${key}`).toBeTruthy()
      expect(trait.tooltip.trim().length, `tooltip > 10 chars pour ${key}`).toBeGreaterThan(10)
      expect(trait.tooltip).not.toBe(trait.label)
    }
  })

  // @requirement: FR-077
  it('chaque trait a un kind appartenant à la liste fermée', () => {
    const allowedKinds = [
      'slider-continuous',
      'slider-stepped',
      'segmented',
      'select',
      'radio',
      'toggle',
      'number-with-random',
      'textarea',
      'number',
    ]
    for (const trait of Object.values(PARAM_TRAITS)) {
      expect(allowedKinds).toContain(trait.kind)
    }
  })

  // @requirement: FR-078 (scope global vs per-generation)
  it('seed et falImageUrl portent scope=per-generation, les autres scope=global', () => {
    expect(PARAM_TRAITS.seed.scope).toBe('per-generation')
    expect(PARAM_TRAITS.falImageUrl.scope).toBe('per-generation')
    // Échantillon de globaux explicites
    expect(PARAM_TRAITS.guidanceScale.scope).toBe('global')
    expect(PARAM_TRAITS.geminiTemperature.scope).toBe('global')
    expect(PARAM_TRAITS.negativePrompt.scope).toBe('global')
  })

  // @requirement: FR-077
  it('le catalogue couvre les traits attendus pour V1', () => {
    const required = [
      'seed', 'guidanceScale', 'numInferenceSteps', 'negativePrompt',
      'safetyTolerance', 'outputFormat', 'enableSafetyChecker', 'numImages',
      'openaiQuality', 'openaiStyle', 'openaiBackground', 'openaiModeration',
      'imagenPersonGeneration', 'imagenAddWatermark',
      'geminiTemperature', 'geminiImageSize',
      'falImageUrl', 'falImagePromptStrength',
    ]
    for (const k of required) {
      expect(PARAM_TRAITS, `trait ${k} déclaré`).toHaveProperty(k)
    }
  })
})

describe('MODEL_PROFILES — composition', () => {
  // @requirement: FR-077
  it('couvre les 15 modèles V1', () => {
    const expected = [
      'dall-e-2', 'dall-e-3', 'gpt-image-1-mini', 'gpt-image-1', 'gpt-image-1.5', 'gpt-image-2',
      'imagen-4-fast', 'imagen-4', 'imagen-4-ultra',
      'gemini-2.5-flash-image', 'gemini-3.1-flash-image-preview', 'gemini-3-pro-image-preview',
      'flux-1.1-schnell', 'flux-1.1-pro', 'sd-3.5-large',
    ]
    for (const id of expected) {
      expect(MODEL_PROFILES, `profil pour ${id}`).toHaveProperty(id)
    }
  })

  // @requirement: FR-077
  it('chaque trait référencé existe dans PARAM_TRAITS', () => {
    for (const [modelId, profile] of Object.entries(MODEL_PROFILES)) {
      for (const traitKey of profile.traits) {
        expect(PARAM_TRAITS, `trait ${traitKey} (${modelId})`).toHaveProperty(traitKey)
      }
    }
  })
})

describe('resolveModelParamFields', () => {
  // @requirement: FR-077
  it('retourne une liste plate de ParamFieldMeta pour un modèle', () => {
    const fields = resolveModelParamFields('flux-1.1-pro')
    expect(fields.length).toBeGreaterThan(0)
    expect(fields[0]).toHaveProperty('key')
    expect(fields[0]).toHaveProperty('label')
    expect(fields[0]).toHaveProperty('tooltip')
    expect(fields[0]).toHaveProperty('kind')
    expect(fields[0]).toHaveProperty('default')
    expect(fields[0]).toHaveProperty('scope')
  })

  // @requirement: FR-077
  it('applique les overrides du profil (default, range)', () => {
    const fields = resolveModelParamFields('flux-1.1-schnell')
    const steps = fields.find((f) => f.key === 'numInferenceSteps')
    expect(steps).toBeDefined()
    // Schnell : défaut 4, max 8 (vs Pro 28/50)
    expect(steps!.default).toBe(4)
    expect(steps!.max).toBe(8)
  })

  // @requirement: FR-077
  it('ne contient pas de doublon de key', () => {
    const fields = resolveModelParamFields('flux-1.1-pro')
    const keys = fields.map((f) => f.key)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('lance une erreur si modelId inconnu', () => {
    expect(() => resolveModelParamFields('inexistant')).toThrow()
  })
})

describe('defaultsForModel', () => {
  // @requirement: FR-077
  it('retourne les défauts pour scope=global', () => {
    const defaults = defaultsForModel('flux-1.1-pro', 'global')
    expect(defaults.guidanceScale).toBe(3.5)
    expect(defaults.numInferenceSteps).toBe(28)
    // seed est per-generation → absent
    expect(defaults).not.toHaveProperty('seed')
  })

  // @requirement: FR-078
  it('retourne les défauts pour scope=per-generation séparément', () => {
    const defaults = defaultsForModel('flux-1.1-pro', 'per-generation')
    expect(defaults).toHaveProperty('seed')
    expect(defaults.seed).toBeNull()
  })
})

describe('validateModelParams', () => {
  // @requirement: FR-077
  it('accepte des valeurs valides', () => {
    const result = validateModelParams('flux-1.1-pro', { guidanceScale: 5, numInferenceSteps: 30 }, 'global')
    expect(result.success).toBe(true)
  })

  // @requirement: FR-077
  it('rejette une valeur hors-range', () => {
    const result = validateModelParams('flux-1.1-pro', { guidanceScale: 999 }, 'global')
    expect(result.success).toBe(false)
  })

  // @requirement: FR-077
  it('rejette une clé inconnue', () => {
    const result = validateModelParams('flux-1.1-pro', { unknownKey: 'foo' }, 'global')
    expect(result.success).toBe(false)
  })

  // @requirement: FR-077 (acceptation partielle pour l'utilisateur)
  it('accepte un objet vide (= utilisera les défauts)', () => {
    const result = validateModelParams('flux-1.1-pro', {}, 'global')
    expect(result.success).toBe(true)
  })

  // @requirement: FR-078
  it('rejette une clé global passée en scope per-generation et inversement', () => {
    const r1 = validateModelParams('flux-1.1-pro', { seed: 42 }, 'global')
    expect(r1.success).toBe(false)
    const r2 = validateModelParams('flux-1.1-pro', { guidanceScale: 5 }, 'per-generation')
    expect(r2.success).toBe(false)
  })
})
