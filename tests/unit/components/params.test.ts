import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ParamToggle from '../../../app/components/params/ParamToggle.vue'
import ParamSegmented from '../../../app/components/params/ParamSegmented.vue'
import ParamSliderContinuous from '../../../app/components/params/ParamSliderContinuous.vue'
import ParamSeedInput from '../../../app/components/params/ParamSeedInput.vue'
import ParamSelect from '../../../app/components/params/ParamSelect.vue'
import ParamRadio from '../../../app/components/params/ParamRadio.vue'
import ParamSliderStepped from '../../../app/components/params/ParamSliderStepped.vue'
import ParamTextarea from '../../../app/components/params/ParamTextarea.vue'
import ParamNumberSpinner from '../../../app/components/params/ParamNumberSpinner.vue'
import type { ParamFieldMetaDTO } from '../../../shared/contracts'

const F = (over: Partial<ParamFieldMetaDTO>): ParamFieldMetaDTO => ({
  key: 'k', label: 'L', tooltip: 'T'.repeat(15), kind: 'toggle', scope: 'global', default: undefined,
  ...over,
})

describe('ParamToggle', () => {
  // @requirement: FR-080
  it('rend le switch et émet update:modelValue à l\'inversion', async () => {
    const w = mount(ParamToggle, {
      props: { field: F({ kind: 'toggle', default: false }), modelValue: false },
    })
    const btn = w.find('button[role="switch"]')
    expect(btn.attributes('aria-checked')).toBe('false')
    await btn.trigger('click')
    expect(w.emitted('update:modelValue')?.[0]).toEqual([true])
  })

  // @requirement: FR-080
  it('lit le défaut du field si modelValue undefined', () => {
    const w = mount(ParamToggle, {
      props: { field: F({ kind: 'toggle', default: true }), modelValue: undefined },
    })
    expect(w.find('button').attributes('aria-checked')).toBe('true')
  })
})

describe('ParamSegmented', () => {
  // @requirement: FR-080
  it('rend les options et émet la valeur cliquée', async () => {
    const field = F({
      kind: 'segmented', default: 'png',
      options: [{ value: 'png', label: 'PNG' }, { value: 'jpeg', label: 'JPEG' }],
    })
    const w = mount(ParamSegmented, { props: { field, modelValue: 'png' } })
    const pills = w.findAll('button[role="radio"]')
    expect(pills).toHaveLength(2)
    expect(pills[0]!.attributes('aria-checked')).toBe('true')
    await pills[1]!.trigger('click')
    expect(w.emitted('update:modelValue')?.[0]).toEqual(['jpeg'])
  })

  // @requirement: FR-080 — clavier
  it('navigation clavier ArrowRight cycle les options', async () => {
    const field = F({
      kind: 'segmented', default: 'a',
      options: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }, { value: 'c', label: 'C' }],
    })
    const w = mount(ParamSegmented, { props: { field, modelValue: 'a' } })
    await w.find('[role="radiogroup"]').trigger('keydown', { key: 'ArrowRight' })
    expect(w.emitted('update:modelValue')?.[0]).toEqual(['b'])
  })
})

describe('ParamSliderContinuous', () => {
  // @requirement: FR-080
  it('rend un input range et émet la valeur (number)', async () => {
    const field = F({ kind: 'slider-continuous', default: 3.5, min: 1, max: 20, step: 0.5 })
    const w = mount(ParamSliderContinuous, { props: { field, modelValue: 3.5 } })
    const input = w.find('input[type="range"]')
    expect(input.attributes('min')).toBe('1')
    expect(input.attributes('max')).toBe('20')
    await input.setValue('7.5')
    expect(w.emitted('update:modelValue')?.[0]).toEqual([7.5])
  })
})

describe('ParamSeedInput', () => {
  // @requirement: FR-080 — bouton 🎲 émet une seed entière
  it('clic sur le bouton 🎲 émet une seed entière non négative', async () => {
    const field = F({ kind: 'number-with-random', default: null, min: 0, max: 1000 })
    const w = mount(ParamSeedInput, { props: { field, modelValue: null } })
    const btns = w.findAll('button')
    expect(btns).toHaveLength(2)
    await btns[0]!.trigger('click')
    const emitted = w.emitted('update:modelValue')
    expect(emitted).toBeTruthy()
    const v = (emitted![0] as [number])[0]
    expect(Number.isInteger(v)).toBe(true)
    expect(v).toBeGreaterThanOrEqual(0)
  })

  // @requirement: FR-080
  it('clic sur ✕ émet null', async () => {
    const field = F({ kind: 'number-with-random', default: null })
    const w = mount(ParamSeedInput, { props: { field, modelValue: 42 } })
    const btns = w.findAll('button')
    await btns[1]!.trigger('click') // ✕
    expect(w.emitted('update:modelValue')?.[0]).toEqual([null])
  })
})

describe('ParamSelect', () => {
  // @requirement: FR-080
  it('rend un select natif et émet la valeur', async () => {
    const field = F({
      kind: 'select', default: 'allow_adult',
      options: [{ value: 'allow_adult', label: 'A' }, { value: 'allow_all', label: 'B' }],
    })
    const w = mount(ParamSelect, { props: { field, modelValue: 'allow_adult' } })
    await w.find('select').setValue('allow_all')
    expect(w.emitted('update:modelValue')?.[0]).toEqual(['allow_all'])
  })
})

describe('ParamRadio', () => {
  // @requirement: FR-080
  it('rend les radios et émet la valeur sélectionnée', async () => {
    const field = F({
      kind: 'radio', default: 'vivid',
      options: [{ value: 'vivid', label: 'Vivid' }, { value: 'natural', label: 'Natural' }],
    })
    const w = mount(ParamRadio, { props: { field, modelValue: 'vivid' } })
    const inputs = w.findAll('input[type="radio"]')
    expect(inputs).toHaveLength(2)
    await inputs[1]!.trigger('change')
    expect(w.emitted('update:modelValue')?.[0]).toEqual(['natural'])
  })
})

describe('ParamSliderStepped', () => {
  // @requirement: FR-080
  it('snap au step entier', async () => {
    const field = F({ kind: 'slider-stepped', default: 28, min: 1, max: 50 })
    const w = mount(ParamSliderStepped, { props: { field, modelValue: 28 } })
    expect(w.find('input').attributes('step')).toBe('1')
    await w.find('input').setValue('35')
    expect(w.emitted('update:modelValue')?.[0]).toEqual([35])
  })
})

describe('ParamTextarea', () => {
  // @requirement: FR-080
  it('rend la valeur et émet à l\'input', async () => {
    const field = F({ kind: 'textarea', default: '', maxLength: 100 })
    const w = mount(ParamTextarea, { props: { field, modelValue: '' } })
    await w.find('textarea').setValue('mon prompt négatif')
    expect(w.emitted('update:modelValue')?.[0]).toEqual(['mon prompt négatif'])
  })
})

describe('ParamNumberSpinner', () => {
  // @requirement: FR-080
  it('rend un input number avec min/max/step', async () => {
    const field = F({ kind: 'number', default: 1, min: 1, max: 4, step: 1 })
    const w = mount(ParamNumberSpinner, { props: { field, modelValue: 1 } })
    const input = w.find('input[type="number"]')
    expect(input.attributes('min')).toBe('1')
    expect(input.attributes('max')).toBe('4')
    await input.setValue('3')
    expect(w.emitted('update:modelValue')?.[0]).toEqual([3])
  })
})
