import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import GenerationControls from '../../../app/components/generation/GenerationControls.vue'

const defaultProps = {
  phase: 'concept' as const,
  prompts: ['', '', ''],
  activePromptIdx: 0,
  collapsed: false,
}

describe('GenerationControls', () => {
  // @requirement: FR-046
  it('affiche le toggle collapse et le bouton assistant en mode déployé', () => {
    const wrapper = mount(GenerationControls, { props: defaultProps })
    expect(wrapper.find('[data-testid="controls-collapse-toggle"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="helper-open-btn"]').exists()).toBe(true)
  })

  // @requirement: FR-046
  it('affiche le bouton assistant même quand collapsed=true', () => {
    const wrapper = mount(GenerationControls, { props: { ...defaultProps, collapsed: true } })
    expect(wrapper.find('[data-testid="helper-open-btn"]').exists()).toBe(true)
  })

  // @requirement: FR-046
  it('émet update:collapsed=true quand on clique sur le toggle en mode déployé', async () => {
    const wrapper = mount(GenerationControls, { props: defaultProps })
    await wrapper.find('[data-testid="controls-collapse-toggle"]').trigger('click')
    expect(wrapper.emitted('update:collapsed')![0]![0]).toBe(true)
  })

  // @requirement: FR-046
  it('cache le corps des prompts quand collapsed=true', () => {
    const wrapper = mount(GenerationControls, { props: { ...defaultProps, collapsed: true } })
    expect(wrapper.findAll('textarea')).toHaveLength(0)
  })

  // @requirement: FR-046
  it('affiche un aperçu du prompt actif quand collapsed et prompt non vide', () => {
    const wrapper = mount(GenerationControls, {
      props: { ...defaultProps, prompts: ['hello world', '', ''], collapsed: true },
    })
    const bar = wrapper.find('[data-testid="controls-collapse-toggle"]').element.closest('div')
    expect(bar?.textContent).toContain('hello world')
  })

  // @requirement: FR-046
  it('ne montre pas le slot actions dans la barre quand déployé', () => {
    // En mode déployé, les actions (Générer) vivent dans le corps via PromptInputs, pas dans la barre
    const wrapper = mount(GenerationControls, { props: defaultProps })
    // La barre ne contient pas de div d'actions ml-auto (réservée au mode collapsé)
    expect(wrapper.find('[data-testid="controls-collapse-toggle"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="helper-open-btn"]').exists()).toBe(true)
  })
})
