import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PromptInputs from '../../../app/components/session/PromptInputs.vue'

describe('PromptInputs', () => {
  // @requirement: FR-006, FR-037
  it('affiche un seul textarea actif et trois tabs A/B/C', () => {
    const wrapper = mount(PromptInputs, { props: { modelValue: ['', '', ''] } })
    expect(wrapper.findAll('textarea')).toHaveLength(1)
    expect(wrapper.find('[data-testid="prompt-tab-A"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="prompt-tab-B"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="prompt-tab-C"]').exists()).toBe(true)
  })

  // @requirement: FR-006, FR-037
  it('émet update:modelValue avec la valeur sur l\'index actif', async () => {
    const wrapper = mount(PromptInputs, { props: { modelValue: ['', '', ''] } })
    await wrapper.find('textarea').setValue('hello')
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')![0]![0]).toEqual(['hello', '', ''])
  })

  // @requirement: FR-037
  it('changer de tab affiche la valeur correspondante sans perdre les autres', async () => {
    const wrapper = mount(PromptInputs, { props: { modelValue: ['promptA', 'promptB', ''] } })
    expect((wrapper.find('textarea').element as HTMLTextAreaElement).value).toBe('promptA')
    await wrapper.find('[data-testid="prompt-tab-B"]').trigger('click')
    expect((wrapper.find('textarea').element as HTMLTextAreaElement).value).toBe('promptB')
    await wrapper.find('[data-testid="prompt-tab-C"]').trigger('click')
    expect((wrapper.find('textarea').element as HTMLTextAreaElement).value).toBe('')
  })

  // @requirement: FR-037
  it('affiche un point indicateur sur les tabs remplis', () => {
    const wrapper = mount(PromptInputs, { props: { modelValue: ['x', '', 'z'] } })
    expect(wrapper.find('[data-testid="prompt-dot-A"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="prompt-dot-B"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="prompt-dot-C"]').exists()).toBe(true)
  })

  // @requirement: FR-037
  it('éditer le tab B met à jour seulement l\'index 1', async () => {
    const wrapper = mount(PromptInputs, { props: { modelValue: ['a', '', ''] } })
    await wrapper.find('[data-testid="prompt-tab-B"]').trigger('click')
    await wrapper.find('textarea').setValue('bbb')
    const events = wrapper.emitted('update:modelValue')!
    expect(events[events.length - 1]![0]).toEqual(['a', 'bbb', ''])
  })

  // @requirement: STORY-089 (slot actions)
  it('rend le contenu du slot actions à côté des tabs', () => {
    const wrapper = mount(PromptInputs, {
      props: { modelValue: ['', '', ''] },
      slots: { actions: '<button data-testid="generate-btn">Générer</button>' },
    })
    expect(wrapper.find('[data-testid="generate-btn"]').exists()).toBe(true)
  })
})
