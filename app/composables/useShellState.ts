import type { Ratio, ModelDTO } from '#shared/contracts'

export interface ShellState {
  ratio: Ratio
  selectedModelIds: string[]
  models: ModelDTO[]
}

/**
 * État partagé entre `app.vue` (qui rend le SidePanel global) et `pages/index.vue`
 * (qui pilote la génération). Le SidePanel doit pouvoir éditer ratio + sélection
 * de modèles depuis l'app shell, et la page de génération doit y avoir accès.
 */
export const useShellState = () => {
  const state = useState<ShellState>('shell-state', () => ({
    ratio: '16:9',
    selectedModelIds: [],
    models: [],
  }))

  return reactive({
    get ratio() { return state.value.ratio },
    set ratio(v: Ratio) { state.value = { ...state.value, ratio: v } },
    get selectedModelIds() { return state.value.selectedModelIds },
    set selectedModelIds(v: string[]) { state.value = { ...state.value, selectedModelIds: v } },
    get models() { return state.value.models },
    set models(v: ModelDTO[]) { state.value = { ...state.value, models: v } },
  })
}
