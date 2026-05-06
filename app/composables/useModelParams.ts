import { ref, computed } from 'vue'

/**
 * EPIC-18 / STORY-124 — État des overrides utilisateur pour les paramètres
 * scope=global, par modèle. Vit le temps de la session (pas persisté localStorage).
 *
 * Note : seul `globalParams` vit ici. Les overrides scope=per-generation
 * (seed, image de référence) sont gérés ailleurs (STORY-128).
 */
const overrides = ref<Record<string, Record<string, unknown>>>({})

export function useModelParams() {
  function setParam(modelId: string, key: string, value: unknown) {
    const current = overrides.value[modelId] ?? {}
    overrides.value = {
      ...overrides.value,
      [modelId]: { ...current, [key]: value },
    }
  }

  function clearParam(modelId: string, key: string) {
    const current = overrides.value[modelId]
    if (!current) return
    const { [key]: _removed, ...rest } = current
    overrides.value = { ...overrides.value, [modelId]: rest }
  }

  function resetModel(modelId: string) {
    const next = { ...overrides.value }
    delete next[modelId]
    overrides.value = next
  }

  function getParams(modelId: string): Record<string, unknown> {
    return overrides.value[modelId] ?? {}
  }

  function hasOverridesFor(modelId: string): boolean {
    const m = overrides.value[modelId]
    return !!m && Object.keys(m).length > 0
  }

  /** Map brute (inclut le shadow store `__canonical__*`). Utilisée par l'UI. */
  const allOverrides = computed(() => overrides.value)

  /**
   * STORY-124 v3 — Map filtrée pour l'envoi serveur : on retire les clés
   * `__canonical__*` (shadow store du composant CanonicalParamRow). Le server
   * Zod valide en `.strict()` et rejette toute clé inconnue.
   */
  const cleanOverridesForServer = computed<Record<string, Record<string, unknown>>>(() => {
    const out: Record<string, Record<string, unknown>> = {}
    for (const [modelId, params] of Object.entries(overrides.value)) {
      const filtered: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(params)) {
        if (!k.startsWith('__canonical__')) filtered[k] = v
      }
      if (Object.keys(filtered).length > 0) out[modelId] = filtered
    }
    return out
  })

  return {
    overrides,
    setParam,
    clearParam,
    resetModel,
    getParams,
    hasOverridesFor,
    allOverrides,
    cleanOverridesForServer,
  }
}
