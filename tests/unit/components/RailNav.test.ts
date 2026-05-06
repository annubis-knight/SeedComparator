import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import RailNav from '../../../app/components/session/RailNav.vue'

const globalStubs = {
  NuxtLink: { template: '<a :href="to"><slot /></a>', props: ['to'] },
  CostMeter: { template: '<div data-testid="cost-meter-stub" />' },
}

// Permet de driver le state useActiveSession dans les tests via __mockActiveSession
const mockActive = {
  activeId: ref<string | null>(null),
  activeName: ref<string | null>(null),
  draftMode: ref(false),
  hasActive: ref(false),
  recent: ref([] as Array<{ id: string; name: string | null; createdAt: string; generationsCount: number }>),
  setFromGenerate: vi.fn(),
  clear: vi.fn(),
  startDraft: vi.fn(() => { mockActive.draftMode.value = true; mockActive.hasActive.value = true }),
  setName: vi.fn(),
  rename: vi.fn(),
  activate: vi.fn((id: string, name: string | null) => {
    mockActive.activeId.value = id
    mockActive.activeName.value = name
    mockActive.hasActive.value = true
  }),
  loadRecent: vi.fn(),
  remove: vi.fn(async () => {}),
}
// @ts-expect-error
globalThis.useActiveSession = () => mockActive
// @ts-expect-error
globalThis.useRailNav = () => {
  const collapsed = ref(false)
  return { collapsed, toggle: () => { collapsed.value = !collapsed.value } }
}

describe('RailNav (STORY-099)', () => {
  beforeEach(() => {
    mockActive.activeId.value = null
    mockActive.activeName.value = null
    mockActive.draftMode.value = false
    mockActive.hasActive.value = false
    mockActive.recent.value = []
    Object.values(mockActive).forEach((v) => {
      if (typeof v === 'function' && 'mockClear' in v) (v as { mockClear: () => void }).mockClear()
    })
  })

  // @requirement: FR-060
  it('rend le bouton "+ Nouvelle session" toujours visible', () => {
    const wrapper = mount(RailNav, { global: { stubs: globalStubs } })
    expect(wrapper.find('[data-testid="new-session-btn"]').exists()).toBe(true)
  })

  // @requirement: FR-060
  it('cache la nav haute (Brief, Génération) quand pas de session active', () => {
    const wrapper = mount(RailNav, { global: { stubs: globalStubs } })
    expect(wrapper.find('[data-testid="railnav-accueil"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="railnav-generation"]').exists()).toBe(false)
  })

  // @requirement: FR-060
  it('affiche la nav haute (Brief, Génération) quand session active, sans Galerie', () => {
    mockActive.activeId.value = 'sess-123'
    mockActive.hasActive.value = true
    const wrapper = mount(RailNav, { global: { stubs: globalStubs } })
    expect(wrapper.find('[data-testid="railnav-accueil"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="railnav-generation"]').exists()).toBe(true)
    // Galerie a été retirée (redondant avec "Voir toutes les sessions")
    expect(wrapper.find('[data-testid="railnav-galerie"]').exists()).toBe(false)
  })

  // @requirement: FR-060 — Réglages always visible (ChatGPT-like, near footer)
  it('affiche Réglages tout en bas, même sans session active', () => {
    const wrapper = mount(RailNav, { global: { stubs: globalStubs } })
    expect(wrapper.find('[data-testid="railnav-reglages"]').exists()).toBe(true)
  })

  // @requirement: FR-060
  it('affiche Réglages aussi quand session active', () => {
    mockActive.activeId.value = 'sess-123'
    mockActive.hasActive.value = true
    const wrapper = mount(RailNav, { global: { stubs: globalStubs } })
    expect(wrapper.find('[data-testid="railnav-reglages"]').exists()).toBe(true)
  })

  // @requirement: FR-060 — rename Accueil → Brief
  it('le label de l\'item accueil est "Brief"', () => {
    mockActive.activeId.value = 'sess-123'
    mockActive.hasActive.value = true
    const wrapper = mount(RailNav, { global: { stubs: globalStubs } })
    expect(wrapper.find('[data-testid="railnav-accueil"]').text()).toContain('Brief')
  })

  // @requirement: FR-060
  it('rend la liste des sessions récentes', () => {
    mockActive.recent.value = [
      { id: 'a', name: 'Session A', createdAt: '2026-05-01T10:00:00Z', generationsCount: 3 },
      { id: 'b', name: 'Session B', createdAt: '2026-04-29T14:00:00Z', generationsCount: 5 },
    ]
    const wrapper = mount(RailNav, { global: { stubs: globalStubs } })
    expect(wrapper.find('[data-testid="railnav-session-a"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="railnav-session-b"]').exists()).toBe(true)
  })

  // @requirement: FR-060
  it('clic "+ Nouvelle session" appelle startDraft()', async () => {
    const wrapper = mount(RailNav, { global: { stubs: globalStubs } })
    await wrapper.find('[data-testid="new-session-btn"]').trigger('click')
    expect(mockActive.startDraft).toHaveBeenCalled()
  })

  // @requirement: FR-060
  it('clic sur une session recent appelle activate(id, name)', async () => {
    mockActive.recent.value = [
      { id: 'sess-X', name: 'My Session', createdAt: '2026-05-01T10:00:00Z', generationsCount: 1 },
    ]
    const wrapper = mount(RailNav, { global: { stubs: globalStubs } })
    await wrapper.find('[data-testid="railnav-session-sess-X"]').trigger('click')
    expect(mockActive.activate).toHaveBeenCalledWith('sess-X', 'My Session')
  })

  // @requirement: FR-060
  it('rend le lien "Voir toutes les sessions" quand recent.length > 0', () => {
    mockActive.recent.value = [
      { id: 'a', name: 'A', createdAt: '2026-05-01T10:00:00Z', generationsCount: 1 },
    ]
    const wrapper = mount(RailNav, { global: { stubs: globalStubs } })
    expect(wrapper.find('[data-testid="railnav-see-all"]').exists()).toBe(true)
  })

  // @requirement: FR-060
  it('rend le CostMeter en footer du rail', () => {
    const wrapper = mount(RailNav, { global: { stubs: globalStubs } })
    expect(wrapper.find('[data-testid="railnav-cost-footer"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="cost-meter-stub"]').exists()).toBe(true)
  })

  // @requirement: FR-060
  it('expose un toggle collapse au sommet', () => {
    const wrapper = mount(RailNav, { global: { stubs: globalStubs } })
    expect(wrapper.find('[data-testid="railnav-toggle"]').exists()).toBe(true)
  })

  // ─── Pattern ChatGPT : entrée draft virtuelle + menu actions sur sessions ───

  // @requirement: FR-066
  it('affiche une entrée "Nouvelle session" virtuelle en tête quand draftMode=true', async () => {
    mockActive.draftMode.value = true
    mockActive.hasActive.value = true
    const wrapper = mount(RailNav, { global: { stubs: globalStubs } })
    const draftEntry = wrapper.find('[data-testid="railnav-session-draft"]')
    expect(draftEntry.exists()).toBe(true)
    expect(draftEntry.text()).toContain('Nouvelle session')
  })

  // @requirement: FR-066
  it('cache l\'entrée draft quand draftMode=false', () => {
    mockActive.draftMode.value = false
    const wrapper = mount(RailNav, { global: { stubs: globalStubs } })
    expect(wrapper.find('[data-testid="railnav-session-draft"]').exists()).toBe(false)
  })

  // @requirement: FR-066
  it('rend un bouton "..." (menu) sur chaque session récente', () => {
    mockActive.recent.value = [
      { id: 'a', name: 'Session A', createdAt: '2026-05-01T10:00:00Z', generationsCount: 3 },
    ]
    const wrapper = mount(RailNav, { global: { stubs: globalStubs } })
    expect(wrapper.find('[data-testid="railnav-session-menu-btn-a"]').exists()).toBe(true)
  })

  // @requirement: FR-066
  it('clic sur "..." ouvre un menu avec Renommer et Supprimer', async () => {
    mockActive.recent.value = [
      { id: 'a', name: 'Session A', createdAt: '2026-05-01T10:00:00Z', generationsCount: 3 },
    ]
    const wrapper = mount(RailNav, { global: { stubs: globalStubs } })
    expect(wrapper.find('[data-testid="railnav-session-menu-a"]').exists()).toBe(false)
    await wrapper.find('[data-testid="railnav-session-menu-btn-a"]').trigger('click')
    expect(wrapper.find('[data-testid="railnav-session-menu-a"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="railnav-session-rename-a"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="railnav-session-delete-a"]').exists()).toBe(true)
  })

  // @requirement: FR-066
  it('clic Supprimer (confirmé) appelle activeSession.remove(id)', async () => {
    mockActive.recent.value = [
      { id: 'a', name: 'Session A', createdAt: '2026-05-01T10:00:00Z', generationsCount: 3 },
    ]
    // confirm() retourne true
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const wrapper = mount(RailNav, { global: { stubs: globalStubs } })
    await wrapper.find('[data-testid="railnav-session-menu-btn-a"]').trigger('click')
    await wrapper.find('[data-testid="railnav-session-delete-a"]').trigger('click')
    expect(confirmSpy).toHaveBeenCalled()
    expect(mockActive.remove).toHaveBeenCalledWith('a')
    confirmSpy.mockRestore()
  })

  // @requirement: FR-066
  it('clic Supprimer (annulé) n\'appelle pas remove', async () => {
    mockActive.recent.value = [
      { id: 'a', name: 'Session A', createdAt: '2026-05-01T10:00:00Z', generationsCount: 3 },
    ]
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    const wrapper = mount(RailNav, { global: { stubs: globalStubs } })
    await wrapper.find('[data-testid="railnav-session-menu-btn-a"]').trigger('click')
    await wrapper.find('[data-testid="railnav-session-delete-a"]').trigger('click')
    expect(mockActive.remove).not.toHaveBeenCalled()
    confirmSpy.mockRestore()
  })

  // @requirement: FR-066
  it('clic sur "..." ne déclenche pas activate (stopPropagation)', async () => {
    mockActive.recent.value = [
      { id: 'a', name: 'Session A', createdAt: '2026-05-01T10:00:00Z', generationsCount: 3 },
    ]
    const wrapper = mount(RailNav, { global: { stubs: globalStubs } })
    await wrapper.find('[data-testid="railnav-session-menu-btn-a"]').trigger('click')
    expect(mockActive.activate).not.toHaveBeenCalled()
  })
})
