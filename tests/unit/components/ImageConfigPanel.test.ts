import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ImageConfigPanel from '../../../app/components/session/ImageConfigPanel.vue'
import { useModelParams } from '../../../app/composables/useModelParams'
import type { ModelDTO, ParamFieldMetaDTO } from '../../../shared/contracts'

const F = (over: Partial<ParamFieldMetaDTO>): ParamFieldMetaDTO => ({
  key: 'guidanceScale',
  label: 'Adhérence',
  tooltip: 'Tooltip explicatif assez long.',
  kind: 'slider-continuous',
  scope: 'global',
  default: 3.5,
  ...over,
})

const M = (id: string, paramFields: ParamFieldMetaDTO[], displayName?: string): ModelDTO => ({
  id, providerId: 'p', providerDisplayName: 'P',
  brandId: 'b', brandDisplayName: 'Brand', brandSortOrder: 1,
  displayName: displayName ?? id, supportsSeed: false, supportsEditing: false,
  pricePerImage: 0.04, enabled: true, hasApiKey: true, hasFixture: true,
  paramFields,
})

describe('ImageConfigPanel — factorisation totale (STORY-124 v4)', () => {
  beforeEach(() => {
    const { resetModel, allOverrides } = useModelParams()
    for (const k of Object.keys(allOverrides.value)) resetModel(k)
  })

  // @requirement: FR-082
  it('affiche un message si aucun modèle sélectionné', () => {
    const w = mount(ImageConfigPanel, {
      props: { ratio: '1:1', selectedModelIds: [], models: [] },
    })
    expect(w.text()).toContain('Sélectionne un modèle')
  })

  // @requirement: FR-082 — un canonique apparaît une fois
  it('affiche les paramètres canoniques applicables', () => {
    const fluxPro = M('flux-1.1-pro', [
      F({ key: 'guidanceScale' }),
      F({ key: 'numInferenceSteps', kind: 'slider-stepped', default: 28 }),
    ])
    const w = mount(ImageConfigPanel, {
      props: { ratio: '1:1', selectedModelIds: ['flux-1.1-pro'], models: [fluxPro] },
    })
    expect(w.text()).toContain('Créativité')
    expect(w.text()).toContain('Effort de calcul')
  })

  // @requirement: FR-082 — clé canonique unique même avec N modèles concernés
  it('rend chaque canonique UNE SEULE FOIS, peu importe le nombre de modèles concernés', () => {
    const m1 = M('flux-1.1-pro', [F({ key: 'outputFormat', kind: 'segmented', default: 'png', options: [{ value: 'png', label: 'PNG' }] })])
    const m2 = M('flux-1.1-schnell', [F({ key: 'outputFormat', kind: 'segmented', default: 'png', options: [{ value: 'png', label: 'PNG' }] })])
    const m3 = M('sd-3.5-large', [F({ key: 'outputFormat', kind: 'segmented', default: 'png', options: [{ value: 'png', label: 'PNG' }] })])
    const w = mount(ImageConfigPanel, {
      props: { ratio: '1:1', selectedModelIds: ['flux-1.1-pro', 'flux-1.1-schnell', 'sd-3.5-large'], models: [m1, m2, m3] },
    })
    expect((w.text().match(/Format de sortie/g) || []).length).toBe(1)
  })

  // @requirement: FR-082 — le bug rapporté par l'utilisateur : pas de doublon idiosyncratique
  it('factorise aussi les traits sans canonique : un seul "Fond" pour 4 modèles GPT Image', () => {
    const bgField = F({
      key: 'openaiBackground',
      label: 'Fond',
      kind: 'segmented',
      default: 'auto',
      options: [{ value: 'auto', label: 'Auto' }, { value: 'transparent', label: 'Transparent' }, { value: 'opaque', label: 'Opaque' }],
    })
    const m1 = M('gpt-image-1-mini', [bgField], 'GPT Image 1 Mini')
    const m2 = M('gpt-image-1.5', [bgField], 'GPT Image 1.5')
    const m3 = M('gpt-image-1', [bgField], 'GPT Image 1')
    const m4 = M('gpt-image-2', [bgField], 'GPT Image 2')
    const w = mount(ImageConfigPanel, {
      props: {
        ratio: '1:1',
        selectedModelIds: ['gpt-image-1-mini', 'gpt-image-1.5', 'gpt-image-1', 'gpt-image-2'],
        models: [m1, m2, m3, m4],
      },
    })
    // "Fond" apparaît une seule fois, pas 4
    expect((w.text().match(/Fond/g) || []).length).toBe(1)
    expect(w.text()).toContain('Appliqué à 4 modèles')
  })

  // @requirement: FR-082 — propagation : changer le contrôle factorisé écrit sur tous les modèles
  it('changer un trait factorisé propage à tous les modèles concernés', async () => {
    const compressionField = F({
      key: 'outputCompression',
      label: 'Compression',
      kind: 'slider-continuous',
      default: 100,
      min: 0,
      max: 100,
      step: 1,
    })
    const m1 = M('gpt-image-1', [compressionField])
    const m2 = M('gpt-image-2', [compressionField])
    const w = mount(ImageConfigPanel, {
      props: { ratio: '1:1', selectedModelIds: ['gpt-image-1', 'gpt-image-2'], models: [m1, m2] },
    })
    // Avec 2 modèles GPT Image, `quality` (canonique) est aussi rendue. On cible
    // explicitement le slider "Compression" via son aria-label pour ne pas
    // dépendre de l'ordre.
    const compressionSlider = w.find('input[type="range"][aria-label="Compression"]')
    expect(compressionSlider.exists()).toBe(true)
    await compressionSlider.setValue('60')

    const { getParams } = useModelParams()
    expect(getParams('gpt-image-1').outputCompression).toBe(60)
    expect(getParams('gpt-image-2').outputCompression).toBe(60)
  })

  // @requirement: FR-082 — un trait propre à 1 seul modèle reste affiché (avec "Appliqué à 1 modèle")
  it('un trait propre à un seul modèle (openaiStyle DALL·E 3) est rendu avec compteur "1 modèle"', () => {
    const styleField = F({
      key: 'openaiStyle',
      label: 'Style',
      kind: 'radio',
      default: 'vivid',
      options: [{ value: 'vivid', label: 'Vivid' }, { value: 'natural', label: 'Natural' }],
    })
    const dalle3 = M('dall-e-3', [styleField], 'DALL·E 3')
    const w = mount(ImageConfigPanel, {
      props: { ratio: '1:1', selectedModelIds: ['dall-e-3'], models: [dalle3] },
    })
    expect(w.text()).toContain('Style')
    expect(w.text()).toContain('Appliqué à 1 modèle')
  })

  // @requirement: FR-082 — pas de paramètre per-generation dans cette section
  it('n\'affiche pas les paramètres scope=per-generation', () => {
    const m = M('flux-1.1-pro', [
      F({ key: 'seed', label: 'Seed', kind: 'number-with-random', scope: 'per-generation', default: null }),
      F({ key: 'guidanceScale' }),
    ])
    const w = mount(ImageConfigPanel, {
      props: { ratio: '1:1', selectedModelIds: ['flux-1.1-pro'], models: [m] },
    })
    expect(w.text()).not.toContain('Seed')
  })

  // @requirement: FR-082 — pas de section "Spécifique par modèle" résiduelle
  it('n\'affiche plus de section "Spécifique par modèle" (v3 supprimée)', () => {
    const m = M('dall-e-3', [
      F({ key: 'openaiStyle', label: 'Style', kind: 'radio', default: 'vivid', options: [] }),
    ])
    const w = mount(ImageConfigPanel, {
      props: { ratio: '1:1', selectedModelIds: ['dall-e-3'], models: [m] },
    })
    expect(w.text()).not.toContain('Spécifique par modèle')
  })
})
