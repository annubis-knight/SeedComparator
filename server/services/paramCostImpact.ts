import { PARAM_TRAITS, type ParamTrait, type ParamTraitKey } from '../providers/paramTraits'
import { MODEL_PROFILES } from '../providers/modelParamProfiles'

/**
 * STORY-125 / EPIC-18 — Calcul du multiplicateur de coût pour un modèle
 * × overrides utilisateur. Multiplie tous les `affectsCost.multiplier` des
 * traits exposés par le modèle dont l'utilisateur a fourni une valeur.
 */
export function costMultiplierForOverrides(
  modelId: string,
  overrides: Record<string, unknown> | undefined,
): number {
  if (!overrides) return 1
  const profile = MODEL_PROFILES[modelId]
  if (!profile) return 1

  let multiplier = 1
  for (const traitKey of profile.traits) {
    const trait = PARAM_TRAITS[traitKey as ParamTraitKey] as ParamTrait
    if (!trait.affectsCost?.multiplier) continue
    const value = overrides[traitKey]
    if (value === undefined) continue
    multiplier *= trait.affectsCost.multiplier(value)
  }
  return multiplier
}

export function costAdditionForOverrides(
  modelId: string,
  overrides: Record<string, unknown> | undefined,
): number {
  if (!overrides) return 0
  const profile = MODEL_PROFILES[modelId]
  if (!profile) return 0

  let addition = 0
  for (const traitKey of profile.traits) {
    const trait = PARAM_TRAITS[traitKey as ParamTraitKey] as ParamTrait
    if (!trait.affectsCost?.addition) continue
    const value = overrides[traitKey]
    if (value === undefined) continue
    addition += trait.affectsCost.addition(value)
  }
  return addition
}
