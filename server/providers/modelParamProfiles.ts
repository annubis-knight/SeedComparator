import type { ParamTraitKey } from './paramTraits'

/**
 * STORY-120 / EPIC-18 — Composition par modèle.
 *
 * Chaque modèle = liste de traits (référencés par clé) + overrides locaux
 * (default, range plus restreint…). Les overrides ne mutent PAS le trait
 * source : ils sont appliqués au moment de la résolution (`paramResolver.ts`).
 */
export interface ParamOverride {
  default?: unknown
  min?: number
  max?: number
  step?: number
}

export interface ModelProfile {
  /** Liste des traits exposés par le modèle (global ∪ per-generation). */
  traits: ParamTraitKey[]
  /** Overrides éventuels par trait. */
  overrides?: Partial<Record<ParamTraitKey, ParamOverride>>
}

/**
 * Couverture : 15 modèles V1 listés dans `registry.ts`.
 *
 * Règle : on ne référence un trait que si le modèle l'expose réellement
 * (vu dans la doc API du provider). Les modèles sans levier hors prompt
 * (ex : DALL·E 2) gardent un profil minimal.
 */
export const MODEL_PROFILES: Record<string, ModelProfile> = {
  // ─── OpenAI ─────────────────────────────────────────────────────────────
  'dall-e-2': {
    // DALL·E 2 : pas de quality, pas de style, pas de seed.
    traits: [],
  },
  'dall-e-3': {
    traits: ['openaiQuality', 'openaiStyle'],
    overrides: {
      openaiQuality: { default: 'standard' },
    },
  },
  'gpt-image-1-mini': {
    traits: ['openaiQuality', 'openaiBackground', 'outputFormat', 'outputCompression', 'openaiModeration'],
    overrides: {
      openaiQuality: { default: 'auto' },
    },
  },
  'gpt-image-1': {
    traits: ['openaiQuality', 'openaiBackground', 'outputFormat', 'outputCompression', 'openaiModeration'],
    overrides: {
      openaiQuality: { default: 'auto' },
    },
  },
  'gpt-image-1.5': {
    traits: ['openaiQuality', 'openaiBackground', 'outputFormat', 'outputCompression', 'openaiModeration'],
    overrides: {
      openaiQuality: { default: 'auto' },
    },
  },
  'gpt-image-2': {
    traits: ['openaiQuality', 'openaiBackground', 'outputFormat', 'outputCompression', 'openaiModeration'],
    overrides: {
      openaiQuality: { default: 'auto' },
    },
  },

  // ─── Google Imagen ──────────────────────────────────────────────────────
  'imagen-4-fast': {
    traits: ['seed', 'imagenPersonGeneration', 'imagenAddWatermark', 'negativePrompt'],
  },
  'imagen-4': {
    traits: ['seed', 'imagenPersonGeneration', 'imagenAddWatermark', 'negativePrompt'],
  },
  'imagen-4-ultra': {
    traits: ['seed', 'imagenPersonGeneration', 'imagenAddWatermark', 'negativePrompt'],
  },

  // ─── Google Gemini Image (Nano Banana) ──────────────────────────────────
  'gemini-2.5-flash-image': {
    traits: ['geminiTemperature', 'geminiImageSize'],
  },
  'gemini-3.1-flash-image-preview': {
    traits: ['geminiTemperature', 'geminiImageSize'],
  },
  'gemini-3-pro-image-preview': {
    traits: ['geminiTemperature', 'geminiImageSize'],
  },

  // ─── Fal.ai ─────────────────────────────────────────────────────────────
  'flux-1.1-schnell': {
    traits: ['seed', 'guidanceScale', 'numInferenceSteps', 'outputFormat', 'enableSafetyChecker'],
    overrides: {
      // Schnell : 1–8 steps, défaut 4.
      numInferenceSteps: { default: 4, max: 8 },
      // Schnell : guidance moins critique, on garde 3.5 par défaut.
    },
  },
  'flux-1.1-pro': {
    traits: ['seed', 'guidanceScale', 'numInferenceSteps', 'safetyTolerance', 'outputFormat', 'enableSafetyChecker', 'falImageUrl', 'falImagePromptStrength'],
    overrides: {
      numInferenceSteps: { default: 28, max: 50 },
    },
  },
  'sd-3.5-large': {
    traits: ['seed', 'guidanceScale', 'numInferenceSteps', 'negativePrompt', 'outputFormat', 'enableSafetyChecker'],
    overrides: {
      numInferenceSteps: { default: 28, max: 50 },
    },
  },
}
