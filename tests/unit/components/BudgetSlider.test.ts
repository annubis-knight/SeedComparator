import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BudgetSlider from '../../../app/components/session/BudgetSlider.vue'
import type { ModelDTO } from '../../../shared/contracts'

const M = (id: string, price: number): ModelDTO => ({
  id, providerId: 'p', providerDisplayName: 'P',
  brandId: 'b', brandDisplayName: 'B', brandSortOrder: 1,
  displayName: id, supportsSeed: false, supportsEditing: false,
  pricePerImage: price, enabled: true, hasApiKey: true, hasFixture: true, paramFields: [],
})

const FIXTURES: ModelDTO[] = [
  M('cheap', 0.005),
  M('mid', 0.030),
  M('expensive', 0.130),
]

describe('BudgetSlider', () => {
  // @requirement: FR-055
  it('rend le slider et l\'input texte synchronisés sur la valeur initiale', () => {
    const wrapper = mount(BudgetSlider, { props: { models: FIXTURES, modelValue: 0.030 } })
    const range = wrapper.find('[data-testid="budget-range"]').element as HTMLInputElement
    const input = wrapper.find('[data-testid="budget-input"]').element as HTMLInputElement
    expect(range.value).toBe('0.03')
    expect(input.value).toBe('0.030')
  })

  // @requirement: FR-055
  it('au déplacement du slider, émet update:modelValue + apply avec la liste filtrée', async () => {
    const wrapper = mount(BudgetSlider, { props: { models: FIXTURES, modelValue: 0 } })
    const range = wrapper.find('[data-testid="budget-range"]')
    await range.setValue('0.030')
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')![0]![0]).toBeCloseTo(0.030, 5)
    const applyEvents = wrapper.emitted('apply')!
    expect(applyEvents[applyEvents.length - 1]![0]).toEqual(['cheap', 'mid'])
  })

  // @requirement: FR-055
  it('saisie dans l\'input texte synchronise le slider et émet apply', async () => {
    const wrapper = mount(BudgetSlider, { props: { models: FIXTURES, modelValue: 0 } })
    const input = wrapper.find('[data-testid="budget-input"]')
    await input.setValue('0.005')
    const applyEvents = wrapper.emitted('apply')!
    expect(applyEvents[applyEvents.length - 1]![0]).toEqual(['cheap'])
  })

  // @requirement: FR-055
  it('à valeur 0, aucun modèle sélectionné', async () => {
    const wrapper = mount(BudgetSlider, { props: { models: FIXTURES, modelValue: 0.05 } })
    await wrapper.find('[data-testid="budget-range"]').setValue('0')
    const applyEvents = wrapper.emitted('apply')!
    expect(applyEvents[applyEvents.length - 1]![0]).toEqual([])
  })

  // @requirement: FR-055
  it('à valeur max (0.15), tous les modèles sont sélectionnés', async () => {
    const wrapper = mount(BudgetSlider, { props: { models: FIXTURES, modelValue: 0 } })
    await wrapper.find('[data-testid="budget-range"]').setValue('0.15')
    const applyEvents = wrapper.emitted('apply')!
    expect(applyEvents[applyEvents.length - 1]![0]).toEqual(['cheap', 'mid', 'expensive'])
  })

  // @requirement: FR-055
  it('clamp les valeurs hors range (input texte > max)', async () => {
    const wrapper = mount(BudgetSlider, { props: { models: FIXTURES, modelValue: 0 } })
    await wrapper.find('[data-testid="budget-input"]').setValue('5')
    expect(wrapper.emitted('update:modelValue')![0]![0]).toBeLessThanOrEqual(0.15)
  })

  // @requirement: FR-055
  it('résumé indique le nombre de modèles filtrés', async () => {
    const wrapper = mount(BudgetSlider, { props: { models: FIXTURES, modelValue: 0.030 } })
    expect(wrapper.find('[data-testid="budget-summary"]').text()).toBe('2 / 3 modèles')
  })
})
