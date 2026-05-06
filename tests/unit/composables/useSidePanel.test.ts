import { describe, it, expect, beforeEach } from 'vitest'
import { useSidePanel, SIDEPANEL_STORAGE_KEY } from '../../../app/composables/useSidePanel'

describe('useSidePanel', () => {
  beforeEach(() => {
    localStorage.clear()
    ;(globalThis as { __resetStateCache?: () => void }).__resetStateCache?.()
  })

  // @requirement: FR-035
  it('démarre déployé par défaut quand le storage est vide', () => {
    const panel = useSidePanel()
    expect(panel.collapsed.value).toBe(false)
  })

  // @requirement: FR-035
  it('toggle bascule l\'état collapsed et le persiste', () => {
    const panel = useSidePanel()
    expect(panel.collapsed.value).toBe(false)
    panel.toggle()
    expect(panel.collapsed.value).toBe(true)
    expect(localStorage.getItem(SIDEPANEL_STORAGE_KEY)).toBe('true')
    panel.toggle()
    expect(panel.collapsed.value).toBe(false)
    expect(localStorage.getItem(SIDEPANEL_STORAGE_KEY)).toBe('false')
  })

  // @requirement: FR-035
  it('lit l\'état persisté à l\'initialisation', () => {
    localStorage.setItem(SIDEPANEL_STORAGE_KEY, 'true')
    const panel = useSidePanel()
    expect(panel.collapsed.value).toBe(true)
  })

  // @requirement: FR-036
  it('expose un activeTab par défaut "image" et le change via setActiveTab', () => {
    const panel = useSidePanel()
    expect(panel.activeTab.value).toBe('image')
    panel.setActiveTab('providers')
    expect(panel.activeTab.value).toBe('providers')
  })

  // @requirement: FR-036
  it('setActiveTab déploie le panneau si replié', () => {
    localStorage.setItem(SIDEPANEL_STORAGE_KEY, 'true')
    const panel = useSidePanel()
    expect(panel.collapsed.value).toBe(true)
    panel.setActiveTab('providers')
    expect(panel.collapsed.value).toBe(false)
    expect(panel.activeTab.value).toBe('providers')
  })
})
