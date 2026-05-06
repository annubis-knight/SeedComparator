import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import SidePanel from '../../../app/components/session/SidePanel.vue'
import { SIDEPANEL_STORAGE_KEY } from '../../../app/composables/useSidePanel'

const baseProps = {
  ratio: '16:9' as const,
  selectedModelIds: [],
  models: [],
}

const globalStubs = {
  NuxtLink: { template: '<a><slot /></a>' },
  CostMeter: { template: '<div data-testid="cost-meter-stub" />' },
  SessionHeader: { template: '<div data-testid="session-header-stub" />' },
}

const setRoute = (path: string) => (globalThis as { __setRoute?: (p: string) => void }).__setRoute?.(path)

describe('SidePanel (STORY-099 — Image/Providers only)', () => {
  beforeEach(() => {
    localStorage.clear()
    ;(globalThis as { __resetStateCache?: () => void }).__resetStateCache?.()
    setRoute('/')
  })

  // @requirement: FR-035
  it('rend la zone de contenu quand non replié', () => {
    const wrapper = mount(SidePanel, { props: baseProps, global: { stubs: globalStubs } })
    expect(wrapper.find('[data-testid="sidepanel-content"]').exists()).toBe(true)
  })

  // @requirement: FR-035
  it('cache la zone de contenu après clic sur le toggle', async () => {
    const wrapper = mount(SidePanel, { props: baseProps, global: { stubs: globalStubs } })
    await wrapper.find('[data-testid="sidepanel-toggle"]').trigger('click')
    expect(wrapper.find('[data-testid="sidepanel-content"]').exists()).toBe(false)
    expect(localStorage.getItem(SIDEPANEL_STORAGE_KEY)).toBe('true')
  })

  // @requirement: FR-036
  it('expose deux onglets image et providers', () => {
    const wrapper = mount(SidePanel, { props: baseProps, global: { stubs: globalStubs } })
    expect(wrapper.find('[data-testid="tab-image"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="tab-providers"]').exists()).toBe(true)
  })

  // @requirement: FR-036
  it('cliquer sur un onglet collapsé déploie et active le tab', async () => {
    localStorage.setItem(SIDEPANEL_STORAGE_KEY, 'true')
    const wrapper = mount(SidePanel, { props: baseProps, global: { stubs: globalStubs } })
    expect(wrapper.find('[data-testid="sidepanel-content"]').exists()).toBe(false)
    // Quand collapsed, les tabs ont le suffixe -collapsed
    await wrapper.find('[data-testid="tab-providers-collapsed"]').trigger('click')
    expect(wrapper.find('[data-testid="sidepanel-content"]').exists()).toBe(true)
  })

  // @requirement: FR-060
  it('ne contient PLUS de nav globale (déplacée vers RailNav)', () => {
    const wrapper = mount(SidePanel, { props: baseProps, global: { stubs: globalStubs } })
    expect(wrapper.find('[data-testid="nav-exploration"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="nav-galerie"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="nav-reglages"]').exists()).toBe(false)
  })

  // @requirement: FR-060
  it('ne contient PLUS de CostMeter (déplacé vers RailNav)', () => {
    const wrapper = mount(SidePanel, { props: baseProps, global: { stubs: globalStubs } })
    expect(wrapper.find('[data-testid="cost-footer"]').exists()).toBe(false)
  })

  // @requirement: FR-060 (correction UX 2026-05-01) — pas de SessionHeader dans SidePanel
  it('ne contient PLUS de SessionHeader (les sessions vivent dans le RailNav)', () => {
    const wrapper = mount(SidePanel, { props: baseProps, global: { stubs: globalStubs } })
    expect(wrapper.find('[data-testid="session-header"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="session-header-stub"]').exists()).toBe(false)
  })

  // @requirement: FR-060 (correction UX 2026-05-01) — onglets en haut, pas dans un rail latéral
  it('en mode déployé, les tabs sont sur la même ligne que le bouton collapse (en haut)', () => {
    const wrapper = mount(SidePanel, { props: baseProps, global: { stubs: globalStubs } })
    // En mode déployé, les tabs ont les ids sans suffixe
    expect(wrapper.find('[data-testid="tab-image"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="tab-image-collapsed"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="sidepanel-toggle"]').exists()).toBe(true)
  })
})
