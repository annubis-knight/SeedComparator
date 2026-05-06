import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import SplitPane from '../../../app/components/SplitPane.vue'

// Stub ResizeObserver
vi.stubGlobal('ResizeObserver', class {
  observe() {}
  disconnect() {}
})

// Stub localStorage
vi.stubGlobal('localStorage', {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
})

describe('SplitPane', () => {
  // @requirement: FR-075
  it('rend les deux slots top et bottom', () => {
    const wrapper = mount(SplitPane, {
      slots: {
        top: '<div data-testid="slot-top">Zone prompts</div>',
        bottom: '<div data-testid="slot-bottom">Zone générations</div>',
      },
    })
    expect(wrapper.find('[data-testid="slot-top"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="slot-bottom"]').exists()).toBe(true)
  })

  // @requirement: FR-075
  it('affiche la barre de séparation', () => {
    const wrapper = mount(SplitPane, {
      slots: { top: '<div />', bottom: '<div />' },
    })
    expect(wrapper.find('[data-testid="split-pane-divider"]').exists()).toBe(true)
  })

  // @requirement: FR-075
  it('applique un style de hauteur au panneau haut', () => {
    const wrapper = mount(SplitPane, {
      props: { defaultPct: 40 },
      slots: { top: '<div />', bottom: '<div />' },
    })
    const top = wrapper.find('[data-testid="split-pane-top"]')
    expect(top.attributes('style')).toContain('height:')
  })

  // @requirement: FR-075
  it('démarre le drag sans erreur au mousedown sur le diviseur', async () => {
    const wrapper = mount(SplitPane, {
      attachTo: document.body,
      slots: { top: '<div />', bottom: '<div />' },
    })
    const divider = wrapper.find('[data-testid="split-pane-divider"]')
    // Ne doit pas lancer d'exception
    await expect(
      divider.trigger('mousedown', { clientY: 300 })
    ).resolves.not.toThrow()
    window.dispatchEvent(new MouseEvent('mouseup'))
    wrapper.unmount()
  })
})
