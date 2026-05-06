import { describe, it, expect } from 'vitest'
import {
  CANONICAL_PARAMS,
  appliesTo,
  applyCanonicalToModel,
  listApplicableCanonicalParams,
} from '../../../shared/canonicalParams'

/**
 * STORY-124 v3 — Catalogue UI mutualisé.
 * Vérifie : tooltips non-vides, structures cohérentes, mappings sensés
 * (notamment l'inversion creativity → guidanceScale).
 */
describe('CANONICAL_PARAMS', () => {
  // @requirement: FR-082
  it('chaque paramètre a un tooltip non-vide différent du label', () => {
    for (const [k, p] of Object.entries(CANONICAL_PARAMS)) {
      expect(p.key, k).toBe(k)
      expect(p.tooltip, `${k} tooltip`).toBeTruthy()
      expect(p.tooltip.length, `${k} tooltip > 10`).toBeGreaterThan(10)
      expect(p.tooltip).not.toBe(p.label)
    }
  })

  // @requirement: FR-082
  it('chaque paramètre canonique a au moins un modèle dans appliesTo', () => {
    for (const p of Object.values(CANONICAL_PARAMS)) {
      expect(appliesTo(p).length).toBeGreaterThan(0)
    }
  })
})

describe('quality (slider 1..5)', () => {
  // @requirement: FR-082 — DALL·E 3 : 1..3 → standard, 4..5 → hd
  it('DALL·E 3 : niveau 3 = standard, niveau 4 = hd', () => {
    expect(applyCanonicalToModel('quality', 3, 'dall-e-3')).toEqual({ openaiQuality: 'standard' })
    expect(applyCanonicalToModel('quality', 4, 'dall-e-3')).toEqual({ openaiQuality: 'hd' })
    expect(applyCanonicalToModel('quality', 5, 'dall-e-3')).toEqual({ openaiQuality: 'hd' })
  })

  // @requirement: FR-082
  it('GPT Image : 1 = low, 3 = medium, 5 = high (jamais auto)', () => {
    expect(applyCanonicalToModel('quality', 1, 'gpt-image-2')).toEqual({ openaiQuality: 'low' })
    expect(applyCanonicalToModel('quality', 3, 'gpt-image-2')).toEqual({ openaiQuality: 'medium' })
    expect(applyCanonicalToModel('quality', 5, 'gpt-image-2')).toEqual({ openaiQuality: 'high' })
  })

  // @requirement: FR-082 — modèle non concerné = aucun override
  it('Flux n\'est pas concerné par quality', () => {
    expect(applyCanonicalToModel('quality', 5, 'flux-1.1-pro')).toEqual({})
  })
})

describe('outputFormat', () => {
  // @requirement: FR-082
  it('lossless → png partout', () => {
    expect(applyCanonicalToModel('outputFormat', 'lossless', 'gpt-image-2')).toEqual({ outputFormat: 'png' })
    expect(applyCanonicalToModel('outputFormat', 'lossless', 'flux-1.1-pro')).toEqual({ outputFormat: 'png' })
  })

  // @requirement: FR-082 — Fal n'a pas de webp officiel : balanced retombe sur jpeg
  it('balanced → webp côté OpenAI, jpeg côté Fal', () => {
    expect(applyCanonicalToModel('outputFormat', 'balanced', 'gpt-image-2')).toEqual({ outputFormat: 'webp' })
    expect(applyCanonicalToModel('outputFormat', 'balanced', 'flux-1.1-pro')).toEqual({ outputFormat: 'jpeg' })
  })

  it('compact → jpeg partout', () => {
    expect(applyCanonicalToModel('outputFormat', 'compact', 'gpt-image-2')).toEqual({ outputFormat: 'jpeg' })
    expect(applyCanonicalToModel('outputFormat', 'compact', 'sd-3.5-large')).toEqual({ outputFormat: 'jpeg' })
  })
})

describe('creativity (slider 0..10)', () => {
  // @requirement: FR-082 — temperature : 0..10 → 0..2 (linéaire)
  it('Gemini : 0 → 0, 5 → 1, 10 → 2', () => {
    expect(applyCanonicalToModel('creativity', 0, 'gemini-2.5-flash-image')).toEqual({ geminiTemperature: 0 })
    expect(applyCanonicalToModel('creativity', 5, 'gemini-2.5-flash-image')).toEqual({ geminiTemperature: 1 })
    expect(applyCanonicalToModel('creativity', 10, 'gemini-2.5-flash-image')).toEqual({ geminiTemperature: 2 })
  })

  // @requirement: FR-082 — guidance INVERSÉE : 0 = strict (15), 10 = sauvage (1)
  it('Flux : 0 → 15 (strict), 5 → 8 (équilibré), 10 → 1 (sauvage)', () => {
    expect(applyCanonicalToModel('creativity', 0, 'flux-1.1-pro')).toEqual({ guidanceScale: 15 })
    const middle = applyCanonicalToModel('creativity', 5, 'flux-1.1-pro')
    expect(middle.guidanceScale).toBeCloseTo(8, 1)
    expect(applyCanonicalToModel('creativity', 10, 'flux-1.1-pro')).toEqual({ guidanceScale: 1 })
  })
})

describe('inferenceEffort (slider 1..5)', () => {
  // @requirement: FR-082
  it('Schnell : niveau 3 → 4 steps (défaut), niveau 5 → 8 (max)', () => {
    expect(applyCanonicalToModel('inferenceEffort', 3, 'flux-1.1-schnell')).toEqual({ numInferenceSteps: 4 })
    expect(applyCanonicalToModel('inferenceEffort', 5, 'flux-1.1-schnell')).toEqual({ numInferenceSteps: 8 })
  })

  // @requirement: FR-082
  it('Pro/SD : niveau 3 → 28 steps (défaut), niveau 5 → 50 (max)', () => {
    expect(applyCanonicalToModel('inferenceEffort', 3, 'flux-1.1-pro')).toEqual({ numInferenceSteps: 28 })
    expect(applyCanonicalToModel('inferenceEffort', 5, 'sd-3.5-large')).toEqual({ numInferenceSteps: 50 })
  })

  it('Imagen n\'est pas concerné', () => {
    expect(applyCanonicalToModel('inferenceEffort', 3, 'imagen-4')).toEqual({})
  })
})

describe('safetyLevel (multiplexage)', () => {
  // @requirement: FR-082 — strict pilote 2 traits
  it('Flux Pro : strict → safety_tolerance=2 + safety_checker=true', () => {
    expect(applyCanonicalToModel('safetyLevel', 'strict', 'flux-1.1-pro')).toEqual({
      safetyTolerance: 2,
      enableSafetyChecker: true,
    })
  })

  // @requirement: FR-082 — Schnell n'a pas de safety_tolerance, juste le checker
  it('Schnell : permissive → enable_safety_checker=false (pas de safety_tolerance)', () => {
    const out = applyCanonicalToModel('safetyLevel', 'permissive', 'flux-1.1-schnell')
    expect(out).toEqual({ enableSafetyChecker: false })
    expect(out).not.toHaveProperty('safetyTolerance')
  })

  // @requirement: FR-082 — OpenAI : moderation auto/low
  it('GPT Image : permissive → moderation=low', () => {
    expect(applyCanonicalToModel('safetyLevel', 'permissive', 'gpt-image-2')).toEqual({ openaiModeration: 'low' })
  })
})

describe('listApplicableCanonicalParams', () => {
  // @requirement: FR-082
  it('avec un seul modèle Flux Pro : retourne outputFormat + creativity + inferenceEffort + safetyLevel (pas quality)', () => {
    const params = listApplicableCanonicalParams(['flux-1.1-pro'])
    const keys = params.map((p) => p.key).sort()
    expect(keys).toEqual(['creativity', 'inferenceEffort', 'outputFormat', 'safetyLevel'])
  })

  // @requirement: FR-082
  it('avec DALL·E 3 + Flux Pro : retourne quality + outputFormat + creativity + inferenceEffort + safetyLevel', () => {
    const params = listApplicableCanonicalParams(['dall-e-3', 'flux-1.1-pro'])
    const keys = params.map((p) => p.key).sort()
    expect(keys).toEqual(['creativity', 'inferenceEffort', 'outputFormat', 'quality', 'safetyLevel'])
  })

  // @requirement: FR-082
  it('avec aucun modèle sélectionné : liste vide', () => {
    expect(listApplicableCanonicalParams([])).toEqual([])
  })

  // @requirement: FR-082
  it('avec Imagen seul : retourne uniquement negativePrompt (seul canonique applicable)', () => {
    const params = listApplicableCanonicalParams(['imagen-4-fast'])
    expect(params.map((p) => p.key)).toEqual(['negativePrompt'])
  })

  // @requirement: FR-082 — chaque DTO retourne `appliesTo` filtré aux modèles connus
  it('appliesTo de chaque DTO contient bien tous les modèles concernés', () => {
    const params = listApplicableCanonicalParams(['dall-e-3', 'gpt-image-2', 'flux-1.1-pro'])
    const quality = params.find((p) => p.key === 'quality')!
    expect(quality.appliesTo).toContain('dall-e-3')
    expect(quality.appliesTo).toContain('gpt-image-2')
    expect(quality.appliesTo).not.toContain('flux-1.1-pro')
  })
})
