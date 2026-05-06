import { ref, computed } from 'vue'

/**
 * EPIC-18 / STORY-128 — État des overrides utilisateur scope=per-generation.
 *
 * Clé de l'objet : `${modelId}::${promptIdx}` — une valeur par instance précise
 * (modèle × prompt). La seed verrouillée pour Flux Pro ne contamine pas SD 3.5,
 * et la seed prompt A ne contamine pas prompt B.
 *
 * Vit en mémoire le temps de la session (pas persisté localStorage). Au reload,
 * tout retombe à zéro — cohérent avec la philosophie "outil d'exploration".
 */
const overrides = ref<Record<string, Record<string, unknown>>>({})

function buildKey(modelId: string, promptIdx: number): string {
  return `${modelId}::${promptIdx}`
}

export function usePerGenerationParams() {
  function setParam(modelId: string, promptIdx: number, key: string, value: unknown) {
    const k = buildKey(modelId, promptIdx)
    const current = overrides.value[k] ?? {}
    overrides.value = { ...overrides.value, [k]: { ...current, [key]: value } }
  }

  function clearParam(modelId: string, promptIdx: number, key: string) {
    const k = buildKey(modelId, promptIdx)
    const current = overrides.value[k]
    if (!current) return
    const { [key]: _removed, ...rest } = current
    overrides.value = { ...overrides.value, [k]: rest }
  }

  function reset(modelId: string, promptIdx: number) {
    const k = buildKey(modelId, promptIdx)
    const next = { ...overrides.value }
    delete next[k]
    overrides.value = next
  }

  function getParams(modelId: string, promptIdx: number): Record<string, unknown> {
    return overrides.value[buildKey(modelId, promptIdx)] ?? {}
  }

  /**
   * Verrouille la seed pour ce modèle × ce prompt.
   * STORY-128 : appelé depuis le bouton 🔒 sur la carte.
   */
  function lockSeed(modelId: string, promptIdx: number, seed: number | null) {
    if (seed === null) {
      clearParam(modelId, promptIdx, 'seed')
    } else {
      setParam(modelId, promptIdx, 'seed', seed)
    }
  }

  function isSeedLocked(modelId: string, promptIdx: number): boolean {
    return overrides.value[buildKey(modelId, promptIdx)]?.seed != null
  }

  /** Map prête à envoyer dans `GenerateRequest.perGenerationParams`. */
  const allOverrides = computed(() => overrides.value)

  return {
    overrides,
    setParam,
    clearParam,
    reset,
    getParams,
    lockSeed,
    isSeedLocked,
    allOverrides,
  }
}
