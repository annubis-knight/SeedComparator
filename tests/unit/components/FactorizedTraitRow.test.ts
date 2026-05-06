import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import FactorizedTraitRow from '../../../app/components/session/FactorizedTraitRow.vue'
import { useModelParams } from '../../../app/composables/useModelParams'
import type { ModelDTO, ParamFieldMetaDTO } from '../../../shared/contracts'

const F = (over: Partial<ParamFieldMetaDTO>): ParamFieldMetaDTO => ({
  key: 'openaiBackground',
  label: 'Fond',
  tooltip: 'Auto, transparent ou opaque (suffisamment long).',
  kind: 'segmented',
  scope: 'global',
  default: 'auto',
  options: [
    { value: 'auto', label: 'Auto' },
    { value: 'transparent', label: 'Transparent' },
    { value: 'opaque', label: 'Opaque' },
  ],
  ...over,
})

const M = (id: string, displayName: string): ModelDTO => ({
  id, providerId: 'openai', providerDisplayName: 'OpenAI',
  brandId: 'openai', brandDisplayName: 'OpenAI', brandSortOrder: 1,
  displayName, supportsSeed: false, supportsEditing: false,
  pricePerImage: 0.04, enabled: true, hasApiKey: true, hasFixture: true,
  paramFields: [],
})

describe('FactorizedTraitRow — propagation à tous les modèles concernés', () => {
  beforeEach(() => {
    const { resetModel, allOverrides } = useModelParams()
    for (const k of Object.keys(allOverrides.value)) resetModel(k)
  })

  // @requirement: FR-082 — un seul rendu pour N modèles
  it('rend le label et le contrôle une seule fois quel que soit N', () => {
    const w = mount(FactorizedTraitRow, {
      props: {
        field: F({}),
        modelIds: ['gpt-image-1', 'gpt-image-1.5', 'gpt-image-2'],
        models: [M('gpt-image-1', 'GPT Image 1'), M('gpt-image-1.5', 'GPT Image 1.5'), M('gpt-image-2', 'GPT Image 2')],
      },
    })
    // Le label "Fond" apparaît une seule fois
    expect((w.text().match(/Fond/g) || []).length).toBe(1)
  })

  // @requirement: FR-082 — propagation à tous les modèles
  it('change la valeur sur les 3 modèles simultanément', async () => {
    const w = mount(FactorizedTraitRow, {
      props: {
        field: F({}),
        modelIds: ['gpt-image-1', 'gpt-image-1.5', 'gpt-image-2'],
        models: [M('gpt-image-1', 'GPT Image 1'), M('gpt-image-1.5', 'GPT Image 1.5'), M('gpt-image-2', 'GPT Image 2')],
      },
    })
    const transparent = w.findAll('button[role="radio"]').find((p) => p.text() === 'Transparent')!
    await transparent.trigger('click')

    const { getParams } = useModelParams()
    expect(getParams('gpt-image-1').openaiBackground).toBe('transparent')
    expect(getParams('gpt-image-1.5').openaiBackground).toBe('transparent')
    expect(getParams('gpt-image-2').openaiBackground).toBe('transparent')
  })

  // @requirement: FR-082 — affichage "Appliqué à N modèles"
  it('affiche le compteur correct au pluriel', () => {
    const w = mount(FactorizedTraitRow, {
      props: {
        field: F({}),
        modelIds: ['gpt-image-1', 'gpt-image-2'],
        models: [M('gpt-image-1', 'GPT Image 1'), M('gpt-image-2', 'GPT Image 2')],
      },
    })
    expect(w.text()).toContain('Appliqué à 2 modèles')
  })

  it('affiche "Appliqué à 1 modèle" au singulier', () => {
    const w = mount(FactorizedTraitRow, {
      props: {
        field: F({}),
        modelIds: ['dall-e-3'],
        models: [M('dall-e-3', 'DALL·E 3')],
      },
    })
    expect(w.text()).toContain('Appliqué à 1 modèle')
    expect(w.text()).not.toContain('1 modèles')
  })

  // @requirement: FR-082 — un slider numeric (compression 0-100) marche aussi
  it('fonctionne avec un slider numérique (outputCompression)', async () => {
    const compressionField = F({
      key: 'outputCompression',
      label: 'Compression',
      kind: 'slider-continuous',
      default: 100,
      min: 0,
      max: 100,
      step: 1,
      options: undefined,
    })
    const w = mount(FactorizedTraitRow, {
      props: {
        field: compressionField,
        modelIds: ['gpt-image-1', 'gpt-image-2'],
        models: [M('gpt-image-1', 'GPT Image 1'), M('gpt-image-2', 'GPT Image 2')],
      },
    })
    await w.find('input[type="range"]').setValue('70')

    const { getParams } = useModelParams()
    expect(getParams('gpt-image-1').outputCompression).toBe(70)
    expect(getParams('gpt-image-2').outputCompression).toBe(70)
  })
})
