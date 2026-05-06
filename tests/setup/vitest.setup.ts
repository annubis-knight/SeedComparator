// Setup global pour Vitest
// On stub les helpers Nuxt utilisés dans les composables (qui sont normalement auto-importés)
import { vi } from 'vitest'
import { ref } from 'vue'
import { useSidePanel } from '../../app/composables/useSidePanel'

// useState minimaliste avec mémorisation par clé pour préserver la réactivité partagée
// (utilisé par les composables Nuxt sous test)
const _stateCache = new Map<string, { value: unknown }>()
// @ts-expect-error stubs minimaux
globalThis.useState = (key: string, init: () => any) => {
  if (!_stateCache.has(key)) _stateCache.set(key, ref(init()))
  return _stateCache.get(key)
}
// @ts-expect-error expose une API utile aux tests pour reset le cache
globalThis.__resetStateCache = () => _stateCache.clear()
// @ts-expect-error expose le composable comme auto-import
globalThis.useSidePanel = useSidePanel
// @ts-expect-error
globalThis.$fetch = vi.fn()
// @ts-expect-error
globalThis.useFetch = vi.fn()
// @ts-expect-error
globalThis.defineEventHandler = (h: any) => h
// @ts-expect-error
globalThis.createError = (e: any) => Object.assign(new Error(e.statusMessage ?? 'error'), e)
// @ts-expect-error
globalThis.readBody = vi.fn()
// @ts-expect-error
globalThis.getRouterParam = vi.fn()
// @ts-expect-error
globalThis.useRuntimeConfig = () => ({ providersMockMode: true })
// @ts-expect-error
globalThis.setHeader = vi.fn()
// @ts-expect-error
globalThis.sendStream = vi.fn()

// useRoute stub : path configurable par test via __setRoute()
const _routeRef = ref<{ path: string }>({ path: '/' })
// @ts-expect-error
globalThis.useRoute = () => _routeRef.value
// @ts-expect-error
globalThis.useRouter = () => ({ push: vi.fn(), replace: vi.fn() })
// @ts-expect-error
globalThis.__setRoute = (path: string) => { _routeRef.value = { path } }

// CostMeter stub (composable utilisé dans SidePanel)
// @ts-expect-error
globalThis.useCostMeter = () => ({
  sessionCost: ref(0),
  monthlyCost: ref(0),
  loadMonthly: vi.fn(),
  addToSession: vi.fn(),
  resetSession: vi.fn(),
})

// useActiveSession stub (STORY-096) — minimaliste, ID/name null par défaut
// @ts-expect-error
globalThis.useActiveSession = () => ({
  activeId: ref<string | null>(null),
  activeName: ref<string | null>(null),
  setFromGenerate: vi.fn(),
  clear: vi.fn(),
  setName: vi.fn(),
  rename: vi.fn(),
})

// @ts-expect-error
globalThis.onMounted = (fn: () => void) => fn()
// @ts-expect-error
globalThis.nextTick = (fn?: () => void) => Promise.resolve().then(fn)
