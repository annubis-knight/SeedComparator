import { z } from 'zod'
import { PARAM_TRAITS, type ParamScope, type ParamTrait } from './paramTraits'
import { MODEL_PROFILES, type ModelProfile, type ParamOverride } from './modelParamProfiles'

/**
 * STORY-120 / EPIC-18 — Résolution traits + profils.
 *
 * Trois fonctions consommables côté server route :
 *   - resolveModelParamFields : pour `GET /api/models` (sérialisation UI).
 *   - defaultsForModel        : pour le merge defaults ⊕ overrides côté adapters.
 *   - validateModelParams     : pour `POST /api/generate` (validation Zod stricte).
 */

/**
 * Métadonnée d'un champ résolu (trait ⊕ override d'un modèle).
 * Contient tout ce qu'il faut pour rendre le contrôle UI sans connaître la notion de trait.
 */
export interface ParamFieldMeta {
  key: string
  label: string
  tooltip: string
  kind: ParamTrait['kind']
  scope: ParamScope
  default: unknown
  min?: number
  max?: number
  step?: number
  options?: ParamTrait['options']
  maxLength?: number
  /** Sérialisé en booléen pour la couche transport — la fonction de calcul vit côté server. */
  affectsCost?: boolean
}

function getProfile(modelId: string): ModelProfile {
  const profile = MODEL_PROFILES[modelId]
  if (!profile) {
    throw new Error(`No param profile for modelId="${modelId}"`)
  }
  return profile
}

function applyOverride(trait: ParamTrait, override: ParamOverride | undefined): ParamFieldMeta {
  return {
    key: trait.key,
    label: trait.label,
    tooltip: trait.tooltip,
    kind: trait.kind,
    scope: trait.scope,
    default: override?.default !== undefined ? override.default : trait.default,
    min: override?.min !== undefined ? override.min : trait.min,
    max: override?.max !== undefined ? override.max : trait.max,
    step: override?.step !== undefined ? override.step : trait.step,
    options: trait.options,
    maxLength: trait.maxLength,
    affectsCost: trait.affectsCost !== undefined,
  }
}

/**
 * Liste plate de tous les paramètres d'un modèle (global ∪ per-generation),
 * traits déclarés ⊕ overrides du profil appliqués.
 */
export function resolveModelParamFields(modelId: string): ParamFieldMeta[] {
  const profile = getProfile(modelId)
  return profile.traits.map((traitKey) => {
    const trait = PARAM_TRAITS[traitKey]
    const override = profile.overrides?.[traitKey]
    return applyOverride(trait, override)
  })
}

/**
 * Map { key: defaultValue } pour un modèle donné, filtrée par scope.
 * Sert au `batchOrchestrator` pour figer l'objet `params` en DB
 * (defaults ⊕ overrides utilisateur).
 */
export function defaultsForModel(modelId: string, scope: ParamScope): Record<string, unknown> {
  const fields = resolveModelParamFields(modelId).filter((f) => f.scope === scope)
  const result: Record<string, unknown> = {}
  for (const f of fields) {
    result[f.key] = f.default
  }
  return result
}

/**
 * Construit un schéma Zod composé pour un modèle × scope donné.
 * - rejette toute clé inconnue (`.strict()`)
 * - applique le Zod du trait + ses bornes (overrides du profil)
 * - rejette une clé global passée en scope per-generation et inversement
 */
function buildZodForScope(modelId: string, scope: ParamScope): z.ZodTypeAny {
  const profile = getProfile(modelId)
  const shape: Record<string, z.ZodTypeAny> = {}
  for (const traitKey of profile.traits) {
    const trait = PARAM_TRAITS[traitKey]
    if (trait.scope !== scope) continue
    const override = profile.overrides?.[traitKey]
    let zod = trait.zod
    // Si l'override resserre min/max et que le trait est un number, on encapsule.
    if (
      (override?.min !== undefined || override?.max !== undefined) &&
      (trait.kind === 'slider-continuous' || trait.kind === 'slider-stepped' || trait.kind === 'number')
    ) {
      let z2: z.ZodNumber = z.number()
      if (trait.kind === 'slider-stepped' || trait.kind === 'number') z2 = z2.int()
      const min = override?.min ?? trait.min
      const max = override?.max ?? trait.max
      if (min !== undefined) z2 = z2.min(min)
      if (max !== undefined) z2 = z2.max(max)
      zod = z2
    }
    shape[traitKey] = zod.optional()
  }
  return z.object(shape).strict()
}

export interface ValidationResult {
  success: boolean
  error?: string
  data?: Record<string, unknown>
}

export function validateModelParams(
  modelId: string,
  params: Record<string, unknown>,
  scope: ParamScope,
): ValidationResult {
  const schema = buildZodForScope(modelId, scope)
  const parsed = schema.safeParse(params)
  if (!parsed.success) {
    return { success: false, error: parsed.error.message }
  }
  return { success: true, data: parsed.data as Record<string, unknown> }
}

/**
 * Fusionne defaults du modèle ⊕ overrides utilisateur (validés en amont).
 * Utilisé pour figer `Generation.params` en DB.
 */
export function mergeWithDefaults(
  modelId: string,
  scope: ParamScope,
  overrides: Record<string, unknown>,
): Record<string, unknown> {
  return { ...defaultsForModel(modelId, scope), ...overrides }
}
