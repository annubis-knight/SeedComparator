import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ModelSelector from '../../../app/components/session/ModelSelector.vue'
import type { ModelDTO } from '../../../shared/contracts'

const M = (over: Partial<ModelDTO>): ModelDTO => ({
  id: 'x', providerId: 'p', providerDisplayName: 'P',
  brandId: 'unknown', brandDisplayName: 'Unknown', brandSortOrder: 99,
  displayName: 'X', supportsSeed: false, supportsEditing: false,
  pricePerImage: 0.01, enabled: true, hasApiKey: true, hasFixture: true, paramFields: [], ...over,
})

describe('ModelSelector', () => {
  // @requirement: FR-003
  it('grise les modèles sans clé API', () => {
    const models = [M({ id: 'a', hasApiKey: true }), M({ id: 'b', hasApiKey: false })]
    const wrapper = mount(ModelSelector, { props: { modelValue: [], models } })
    // STORY-124 révision UX 2026-05-06 — la ligne redevient un <label> simple
    // (l'icône ⚙ a été retirée, l'édition se fait depuis ImageConfigPanel).
    const itemLabels = wrapper.findAll('label.flex')
    expect(itemLabels).toHaveLength(2)
    expect(itemLabels[0]!.classes()).not.toContain('opacity-40')
    expect(itemLabels[1]!.classes()).toContain('opacity-40')
  })

  // @requirement: FR-007
  it('émet la nouvelle sélection au check', async () => {
    const models = [M({ id: 'a' })]
    const wrapper = mount(ModelSelector, { props: { modelValue: [], models } })
    await wrapper.find('input[type="checkbox"]').setValue(true)
    expect(wrapper.emitted('update:modelValue')![0]![0]).toEqual(['a'])
  })

  // @requirement: FR-003
  it('affiche le badge "clé manquante" quand hasApiKey=false', () => {
    const models = [M({ id: 'a', hasApiKey: false })]
    const wrapper = mount(ModelSelector, { props: { modelValue: [], models } })
    expect(wrapper.text()).toContain('clé manquante')
  })

  // @requirement: FR-042
  it('groupe par brand et trie par brandSortOrder (pas par gateway)', () => {
    const models = [
      M({ id: 'flux', brandId: 'bfl', brandDisplayName: 'Black Forest Labs', brandSortOrder: 3, providerId: 'fal', providerDisplayName: 'Fal.ai' }),
      M({ id: 'nano', brandId: 'google', brandDisplayName: 'Google', brandSortOrder: 1, providerId: 'openrouter', providerDisplayName: 'OpenRouter' }),
      M({ id: 'gpt',  brandId: 'openai', brandDisplayName: 'OpenAI', brandSortOrder: 2, providerId: 'openrouter', providerDisplayName: 'OpenRouter' }),
    ]
    const wrapper = mount(ModelSelector, { props: { modelValue: [], models } })
    const headers = wrapper.findAll('.uppercase').map((n) => n.text())
    expect(headers).toEqual(['Google', 'OpenAI', 'Black Forest Labs'])
    // gateway invisible
    expect(wrapper.text()).not.toContain('OpenRouter')
    expect(wrapper.text()).not.toContain('Fal.ai')
  })

  // @requirement: FR-042
  it('regroupe plusieurs modèles d\'une même brand dans le même bloc', () => {
    const models = [
      M({ id: 'nano-1', brandId: 'google', brandDisplayName: 'Google', brandSortOrder: 1, displayName: 'Nano Banana 2 Lite' }),
      M({ id: 'nano-2', brandId: 'google', brandDisplayName: 'Google', brandSortOrder: 1, displayName: 'Nano Banana 2' }),
    ]
    const wrapper = mount(ModelSelector, { props: { modelValue: [], models } })
    const headers = wrapper.findAll('.uppercase')
    expect(headers).toHaveLength(1)
    expect(headers[0]!.text()).toBe('Google')
    expect(wrapper.text()).toContain('Nano Banana 2 Lite')
    expect(wrapper.text()).toContain('Nano Banana 2')
  })

  // @requirement: FR-064
  it('grise et désactive les modèles sans fixture (mode mock-real)', () => {
    const models = [
      M({ id: 'a', hasApiKey: true, hasFixture: true }),
      M({ id: 'b', hasApiKey: true, hasFixture: false }),
    ]
    const wrapper = mount(ModelSelector, { props: { modelValue: [], models } })
    const checkboxes = wrapper.findAll('input[type="checkbox"]')
    expect(checkboxes[0]!.attributes('disabled')).toBeUndefined()
    expect(checkboxes[1]!.attributes('disabled')).toBeDefined()

    const rowB = wrapper.find('[data-testid="model-row-b"]')
    expect(rowB.classes()).toContain('opacity-40')
    // STORY-124 révision UX 2026-05-06 — la ligne est redevenue un <label> qui porte
    // directement le `title`. L'icône ⚙ et son wrapper intermédiaire ont été retirés.
    expect(rowB.attributes('title')).toContain('Aucune fixture')
    expect(rowB.find('[data-testid="badge-no-fixture"]').exists()).toBe(true)
  })

  // @requirement: FR-064
  it('le badge "clé manquante" prime sur "fixture manquante" si les deux sont absents', () => {
    const models = [M({ id: 'c', hasApiKey: false, hasFixture: false })]
    const wrapper = mount(ModelSelector, { props: { modelValue: [], models } })
    expect(wrapper.find('[data-testid="badge-no-key"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="badge-no-fixture"]').exists()).toBe(false)
  })

  // @requirement: FR-064
  it('un modèle complet (clé + fixture) reste sélectionnable', async () => {
    const models = [M({ id: 'ok', hasApiKey: true, hasFixture: true })]
    const wrapper = mount(ModelSelector, { props: { modelValue: [], models } })
    const cb = wrapper.find('input[type="checkbox"]')
    expect(cb.attributes('disabled')).toBeUndefined()
    await cb.setValue(true)
    expect(wrapper.emitted('update:modelValue')![0]![0]).toEqual(['ok'])
  })
})
