import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref } from 'vue'
import { useSplitPane } from '../../../app/composables/useSplitPane'

// Stub localStorage
const store: Record<string, string> = {}
vi.stubGlobal('localStorage', {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v },
  removeItem: (k: string) => { delete store[k] },
})

describe('useSplitPane', () => {
  beforeEach(() => {
    // Nettoie le store entre chaque test
    for (const k of Object.keys(store)) delete store[k]
  })

  const height = ref(600)

  // @requirement: FR-075
  it('utilise le pourcentage par défaut si aucune valeur persistée', () => {
    const sp = useSplitPane(height, { defaultPct: 45 })
    expect(sp.topPct.value).toBe(45)
  })

  // @requirement: FR-075
  it('restaure la valeur persistée depuis localStorage', () => {
    store['seedcomparator.splitpane.topPct'] = '60'
    const sp = useSplitPane(height, { defaultPct: 45 })
    expect(sp.topPct.value).toBe(60)
  })

  // @requirement: FR-075
  it('clamp empêche de dépasser le minimum haut (minTopPx/hauteur)', () => {
    const sp = useSplitPane(height, { minTopPx: 80, minBottomPx: 80 })
    sp.setPct(0)
    // min = 80/600 * 100 ≈ 13.3%
    expect(sp.topPct.value).toBeGreaterThanOrEqual(13)
  })

  // @requirement: FR-075
  it('clamp empêche de dépasser le maximum bas (hauteur - minBottomPx)', () => {
    const sp = useSplitPane(height, { minTopPx: 80, minBottomPx: 80 })
    sp.setPct(100)
    // max = (600 - 80)/600 * 100 ≈ 86.7%
    expect(sp.topPct.value).toBeLessThanOrEqual(87)
  })

  // @requirement: FR-075
  it('setPct persiste la valeur en localStorage', () => {
    const sp = useSplitPane(height, { defaultPct: 45 })
    sp.setPct(55)
    expect(store['seedcomparator.splitpane.topPct']).toBeDefined()
    expect(parseFloat(store['seedcomparator.splitpane.topPct']!)).toBeCloseTo(55, 0)
  })

  // @requirement: FR-075
  it('setCollapsed(true) descend le séparateur à minTopPx', () => {
    const sp = useSplitPane(height, { minTopPx: 80, defaultPct: 50 })
    sp.setPct(50)
    sp.setCollapsed(true)
    const minPct = (80 / 600) * 100
    expect(sp.topPct.value).toBeCloseTo(minPct, 0)
  })

  // @requirement: FR-075
  it('setCollapsed(false) restaure la position userTopPct', () => {
    const sp = useSplitPane(height, { defaultPct: 50 })
    sp.setPct(50)
    sp.setCollapsed(true)
    sp.setCollapsed(false)
    expect(sp.topPct.value).toBeCloseTo(50, 0)
  })

  // @requirement: FR-076
  it('setAutoCollapse(true) descend le séparateur', () => {
    const sp = useSplitPane(height, { minTopPx: 80, defaultPct: 50 })
    sp.setPct(50)
    sp.setAutoCollapse(true)
    const minPct = (80 / 600) * 100
    expect(sp.topPct.value).toBeCloseTo(minPct, 0)
  })

  // @requirement: FR-076
  it('setAutoCollapse(false) restaure userTopPct si pas collapsé manuellement', () => {
    const sp = useSplitPane(height, { defaultPct: 50 })
    sp.setPct(50)
    sp.setAutoCollapse(true)
    sp.setAutoCollapse(false)
    expect(sp.topPct.value).toBeCloseTo(50, 0)
  })

  // @requirement: FR-076
  it('setAutoCollapse(false) ne restaure pas si collapsé manuellement', () => {
    const sp = useSplitPane(height, { minTopPx: 80, defaultPct: 50 })
    sp.setPct(50)
    sp.setCollapsed(true)
    sp.setAutoCollapse(true)
    sp.setAutoCollapse(false)
    // toujours à minTopPct car isCollapsed=true
    const minPct = (80 / 600) * 100
    expect(sp.topPct.value).toBeCloseTo(minPct, 0)
  })
})
