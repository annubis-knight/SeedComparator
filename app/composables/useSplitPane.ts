// @requirement: FR-075, FR-076

const STORAGE_KEY = 'seedcomparator.splitpane.topPct'
const DEFAULT_TOP_PCT = 45
const MIN_TOP_PX = 80
const MIN_BOTTOM_PX = 80

export interface SplitPaneOptions {
  defaultPct?: number
  minTopPx?: number
  minBottomPx?: number
}

export function useSplitPane(containerHeightRef: Ref<number>, options: SplitPaneOptions = {}) {
  const minTopPx = options.minTopPx ?? MIN_TOP_PX
  const minBottomPx = options.minBottomPx ?? MIN_BOTTOM_PX
  const defaultPct = options.defaultPct ?? DEFAULT_TOP_PCT

  function readPersistedPct(): number {
    if (typeof localStorage === 'undefined') return defaultPct
    const v = parseFloat(localStorage.getItem(STORAGE_KEY) ?? '')
    return isNaN(v) ? defaultPct : v
  }

  // Position courante (0–100) — peut être modifiée par drag ou collapse
  const topPct = ref<number>(readPersistedPct())
  // Position mémorisée par l'utilisateur (survit au collapse auto)
  const userTopPct = ref<number>(topPct.value)
  const isCollapsed = ref(false)
  const isAutoCollapsed = ref(false)

  function clamp(pct: number): number {
    const h = containerHeightRef.value
    if (h <= 0) return pct
    const minPct = (minTopPx / h) * 100
    const maxPct = ((h - minBottomPx) / h) * 100
    return Math.min(Math.max(pct, minPct), maxPct)
  }

  function setPct(pct: number, persist = true) {
    const clamped = clamp(pct)
    topPct.value = clamped
    if (persist) {
      userTopPct.value = clamped
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, String(clamped))
      }
    }
  }

  // Collapse manuel (toggle prompts)
  function setCollapsed(collapsed: boolean) {
    isCollapsed.value = collapsed
    if (collapsed) {
      topPct.value = clamp((minTopPx / Math.max(containerHeightRef.value, 1)) * 100)
    } else {
      topPct.value = clamp(userTopPct.value)
    }
  }

  // Collapse automatique (démarrage/fin génération)
  function setAutoCollapse(autoCollapsed: boolean) {
    isAutoCollapsed.value = autoCollapsed
    if (autoCollapsed) {
      topPct.value = clamp((minTopPx / Math.max(containerHeightRef.value, 1)) * 100)
    } else if (!isCollapsed.value) {
      topPct.value = clamp(userTopPct.value)
    }
  }

  const topStyle = computed(() => ({ height: `${topPct.value}%` }))
  const bottomStyle = computed(() => ({ height: `${100 - topPct.value}%` }))

  return {
    topPct,
    userTopPct,
    isCollapsed,
    isAutoCollapsed,
    topStyle,
    bottomStyle,
    setPct,
    setCollapsed,
    setAutoCollapse,
    clamp,
  }
}
