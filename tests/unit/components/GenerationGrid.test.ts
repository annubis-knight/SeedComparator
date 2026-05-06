import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import GenerationGrid from '../../../app/components/generation/GenerationGrid.vue'
import GenerationCard from '../../../app/components/generation/GenerationCard.vue'
import PromptSwitcher from '../../../app/components/generation/PromptSwitcher.vue'
import type { LiveGeneration } from '../../../app/composables/useGenerationSession'
import type { ModelDTO } from '../../../shared/contracts'

const globalComponents = { GenerationCard, PromptSwitcher }

const M = (id: string, over: Partial<ModelDTO> = {}): ModelDTO => ({
  id, providerId: 'p', providerDisplayName: 'P',
  brandId: 'unknown', brandDisplayName: 'Unknown', brandSortOrder: 99,
  displayName: id,
  supportsSeed: false, supportsEditing: false, pricePerImage: 0.01,
  enabled: true, hasApiKey: true, hasFixture: true, paramFields: [],
  ...over,
})

const G = (promptIdx: number, modelId: string, status: LiveGeneration['status'] = 'success'): LiveGeneration => ({
  taskId: `${promptIdx}-${modelId}`,
  generationId: 'g', promptIdx, modelId, status,
  imageDataUrl: status === 'success' ? 'data:image/png;base64,x' : null,
  seed: null, costUsd: 0, errorCode: null, errorMsg: null,
})

describe('GenerationGrid', () => {
  // @requirement: FR-040
  it('en mode flex, affiche 1 carte par modèle (pas de matrice modèles×prompts)', () => {
    const generations: LiveGeneration[] = [
      G(0, 'flux'), G(0, 'sd35'),
      G(1, 'flux'), G(1, 'sd35'),
    ]
    const wrapper = mount(GenerationGrid, {
      props: {
        generations,
        models: [M('flux'), M('sd35')],
        mode: 'flex',
        activePromptIdx: 0,
      },
      global: { components: globalComponents },
    })
    const flexGrid = wrapper.find('[data-testid="flex-grid"]')
    expect(flexGrid.exists()).toBe(true)
    // 1 carte par modèle (= 2)
    expect(flexGrid.findAll('img')).toHaveLength(2)
  })

  // @requirement: FR-040
  it('en mode flex avec >1 prompt, affiche le PromptSwitcher', () => {
    const generations: LiveGeneration[] = [G(0, 'flux'), G(1, 'flux')]
    const wrapper = mount(GenerationGrid, {
      props: { generations, models: [M('flux')], mode: 'flex', activePromptIdx: 0 },
      global: { components: globalComponents },
    })
    expect(wrapper.find('[data-testid="switch-prompt-A"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="switch-prompt-B"]').exists()).toBe(true)
  })

  // @requirement: FR-040
  it('en mode flex avec 1 prompt seulement, le PromptSwitcher est caché', () => {
    const generations: LiveGeneration[] = [G(0, 'flux')]
    const wrapper = mount(GenerationGrid, {
      props: { generations, models: [M('flux')], mode: 'flex', activePromptIdx: 0 },
      global: { components: globalComponents },
    })
    expect(wrapper.find('[data-testid="switch-prompt-A"]').exists()).toBe(false)
  })

  // @requirement: FR-052
  it('en mode grid avec >1 prompt, le PromptSwitcher est visible', () => {
    const generations: LiveGeneration[] = [G(0, 'flux'), G(1, 'flux')]
    const wrapper = mount(GenerationGrid, {
      props: { generations, models: [M('flux')], mode: 'grid', activePromptIdx: 0 },
      global: { components: globalComponents },
    })
    expect(wrapper.find('[data-testid="switch-prompt-all"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="switch-prompt-A"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="switch-prompt-B"]').exists()).toBe(true)
  })

  // @requirement: FR-052
  it('en mode grid, filtre les cartes selon activePromptIdx (par défaut)', () => {
    const generations: LiveGeneration[] = [
      G(0, 'flux'), G(0, 'sd35'),
      G(1, 'flux'), G(1, 'sd35'),
    ]
    const wrapper = mount(GenerationGrid, {
      props: {
        generations, models: [M('flux'), M('sd35')],
        mode: 'grid', activePromptIdx: 0, showAllPrompts: false,
      },
      global: { components: globalComponents },
    })
    // Filtrage actif : 2 cards (prompt 0 × 2 modèles)
    expect(wrapper.findAll('img')).toHaveLength(2)
  })

  // @requirement: FR-052
  it('en mode grid avec showAllPrompts=true, affiche toutes les cartes (toutes variantes)', () => {
    const generations: LiveGeneration[] = [
      G(0, 'flux'), G(0, 'sd35'),
      G(1, 'flux'), G(1, 'sd35'),
    ]
    const wrapper = mount(GenerationGrid, {
      props: {
        generations, models: [M('flux'), M('sd35')],
        mode: 'grid', activePromptIdx: 0, showAllPrompts: true,
      },
      global: { components: globalComponents },
    })
    expect(wrapper.findAll('img')).toHaveLength(4)
  })

  // @requirement: FR-052
  it('cliquer sur "Tous" émet update:showAllPrompts=true', async () => {
    const generations: LiveGeneration[] = [G(0, 'flux'), G(1, 'flux')]
    const wrapper = mount(GenerationGrid, {
      props: { generations, models: [M('flux')], mode: 'grid', activePromptIdx: 0 },
      global: { components: globalComponents },
    })
    await wrapper.find('[data-testid="switch-prompt-all"]').trigger('click')
    expect(wrapper.emitted('update:showAllPrompts')![0]![0]).toBe(true)
  })

  // @requirement: FR-052
  it('en mode flex avec showAllPrompts=true, affiche N colonnes par modèle (1 par prompt)', () => {
    const generations: LiveGeneration[] = [
      G(0, 'flux'), G(0, 'sd35'),
      G(1, 'flux'), G(1, 'sd35'),
    ]
    const wrapper = mount(GenerationGrid, {
      props: {
        generations, models: [M('flux'), M('sd35')],
        mode: 'flex', activePromptIdx: 0, showAllPrompts: true,
      },
      global: { components: globalComponents },
    })
    // 2 modèles × 2 prompts = 4 cards en flex
    expect(wrapper.findAll('img')).toHaveLength(4)
    expect(wrapper.find('[data-testid="flex-col-flux-0"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="flex-col-flux-1"]').exists()).toBe(true)
  })

  // @requirement: FR-052
  it('en mode flex avec showAllPrompts=false, conserve 1 colonne par modèle', () => {
    const generations: LiveGeneration[] = [G(0, 'flux'), G(1, 'flux')]
    const wrapper = mount(GenerationGrid, {
      props: {
        generations, models: [M('flux')],
        mode: 'flex', activePromptIdx: 0, showAllPrompts: false,
      },
      global: { components: globalComponents },
    })
    expect(wrapper.findAll('img')).toHaveLength(1)
  })

  // @requirement: FR-040
  it('cliquer sur un onglet du switch émet update:activePromptIdx', async () => {
    const generations: LiveGeneration[] = [G(0, 'flux'), G(1, 'flux'), G(2, 'flux')]
    const wrapper = mount(GenerationGrid, {
      props: { generations, models: [M('flux')], mode: 'flex', activePromptIdx: 0 },
      global: { components: globalComponents },
    })
    await wrapper.find('[data-testid="switch-prompt-C"]').trigger('click')
    const events = wrapper.emitted('update:activePromptIdx')!
    expect(events[events.length - 1]![0]).toBe(2)
  })

  // @requirement: FR-017, FR-052
  it('en mode grid avec 1 seul prompt, le switch est caché', () => {
    const generations: LiveGeneration[] = [G(0, 'flux'), G(0, 'sd35')]
    const wrapper = mount(GenerationGrid, {
      props: { generations, models: [M('flux'), M('sd35')], mode: 'grid' },
      global: { components: globalComponents },
    })
    expect(wrapper.findAll('img')).toHaveLength(2)
    expect(wrapper.find('[data-testid="switch-prompt-A"]').exists()).toBe(false)
  })

  // @requirement: FR-044
  it('en mode grid, regroupe les cartes en sections par brand triées par brandSortOrder', () => {
    const models = [
      M('flux', { brandId: 'bfl', brandDisplayName: 'Black Forest Labs', brandSortOrder: 3 }),
      M('nano', { brandId: 'google', brandDisplayName: 'Google', brandSortOrder: 1 }),
      M('gpt',  { brandId: 'openai', brandDisplayName: 'OpenAI', brandSortOrder: 2 }),
    ]
    const generations: LiveGeneration[] = [G(0, 'flux'), G(0, 'nano'), G(0, 'gpt')]
    const wrapper = mount(GenerationGrid, {
      props: { generations, models, mode: 'grid' },
      global: { components: globalComponents },
    })
    const headers = wrapper.findAll('h3').map((h) => h.text())
    expect(headers).toEqual(['Google', 'OpenAI', 'Black Forest Labs'])
    expect(wrapper.find('[data-testid="brand-section-google"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="brand-section-openai"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="brand-section-bfl"]').exists()).toBe(true)
  })

  // @requirement: FR-044
  it('en mode grid, regroupe plusieurs modèles d\'une même brand sous un header unique', () => {
    const models = [
      M('nano-1', { brandId: 'google', brandDisplayName: 'Google', brandSortOrder: 1 }),
      M('nano-2', { brandId: 'google', brandDisplayName: 'Google', brandSortOrder: 1 }),
      M('nano-3', { brandId: 'google', brandDisplayName: 'Google', brandSortOrder: 1 }),
    ]
    const generations: LiveGeneration[] = [G(0, 'nano-1'), G(0, 'nano-2'), G(0, 'nano-3')]
    const wrapper = mount(GenerationGrid, {
      props: { generations, models, mode: 'grid' },
      global: { components: globalComponents },
    })
    expect(wrapper.findAll('h3')).toHaveLength(1)
    expect(wrapper.find('h3').text()).toBe('Google')
    expect(wrapper.findAll('img')).toHaveLength(3)
  })

  // @requirement: FR-044
  it('en mode flex, regroupe les colonnes d\'une même brand sous un header unique', () => {
    const models = [
      M('nano-1', { brandId: 'google', brandDisplayName: 'Google', brandSortOrder: 1 }),
      M('nano-2', { brandId: 'google', brandDisplayName: 'Google', brandSortOrder: 1 }),
      M('flux',   { brandId: 'bfl', brandDisplayName: 'Black Forest Labs', brandSortOrder: 3 }),
    ]
    const generations: LiveGeneration[] = [G(0, 'nano-1'), G(0, 'nano-2'), G(0, 'flux')]
    const wrapper = mount(GenerationGrid, {
      props: { generations, models, mode: 'flex', activePromptIdx: 0 },
      global: { components: globalComponents },
    })
    // 2 sections (Google et BFL), pas 3
    const headers = wrapper.findAll('h3').map((h) => h.text())
    expect(headers).toEqual(['Google', 'Black Forest Labs'])
    // Mais toujours 3 cards (1 par modèle)
    expect(wrapper.findAll('img')).toHaveLength(3)
  })
})
