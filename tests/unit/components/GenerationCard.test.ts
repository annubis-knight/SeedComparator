import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import GenerationCard from '../../../app/components/generation/GenerationCard.vue'
import type { LiveGeneration } from '../../../app/composables/useGenerationSession'

const baseGen: LiveGeneration = {
  taskId: '0-m', generationId: 'g1', promptIdx: 0, modelId: 'm',
  status: 'pending', imageDataUrl: null, seed: null, costUsd: 0,
  errorCode: null, errorMsg: null, liked: false,
  phase: 'wireframe', promptVariant: 'A',
}

describe('GenerationCard', () => {
  // @requirement: FR-013, FR-018
  it('affiche un skeleton en pending', () => {
    const wrapper = mount(GenerationCard, { props: { gen: baseGen } })
    expect(wrapper.text().toLowerCase()).toContain('génération')
  })

  // @requirement: FR-018
  it('affiche l\'image quand status=success', () => {
    const wrapper = mount(GenerationCard, {
      props: { gen: { ...baseGen, status: 'success', imageDataUrl: 'data:image/png;base64,x', costUsd: 0.03 } },
    })
    expect(wrapper.find('img').exists()).toBe(true)
  })

  // @requirement: FR-016
  it('affiche le code et message d\'erreur en failed', () => {
    const wrapper = mount(GenerationCard, {
      props: { gen: { ...baseGen, status: 'failed', errorCode: 'rate_limited', errorMsg: 'too fast' } },
    })
    expect(wrapper.text()).toContain('rate_limited')
    expect(wrapper.text()).toContain('too fast')
  })

  // @requirement: FR-018
  it('affiche le seed et le coût formatés', () => {
    const wrapper = mount(GenerationCard, {
      props: { gen: { ...baseGen, seed: 42, costUsd: 0.040 } },
    })
    // STORY-128 : la seed devient cliquable + bouton 🔒, donc le texte est "seed:" puis "42"
    // dans des <span> distincts. On vérifie les deux composants séparément.
    expect(wrapper.text()).toMatch(/seed:\s*42/)
    expect(wrapper.text()).toContain('$0.040')
  })

  // @requirement: FR-039, FR-048
  it('rend un placeholder structuré (icône + label) en état idle', () => {
    const wrapper = mount(GenerationCard, {
      props: { gen: { ...baseGen, status: 'idle' }, modelDisplayName: 'Flux Pro' },
    })
    expect(wrapper.find('[data-testid="gen-card-idle"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="placeholder-bg"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="placeholder-icon"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('En attente')
    expect(wrapper.text()).toContain('Flux Pro')
  })

  // @requirement: FR-048
  it('le conteneur idle porte la classe gen-card-min-h pour garantir la hauteur', () => {
    const wrapper = mount(GenerationCard, {
      props: { gen: { ...baseGen, status: 'idle' } },
    })
    expect(wrapper.find('[data-testid="gen-card-idle"]').classes()).toContain('gen-card-min-h')
  })

  // @requirement: FR-039
  it('applique aspect-video quand ratio=16:9', () => {
    const wrapper = mount(GenerationCard, {
      props: { gen: { ...baseGen, status: 'idle' }, ratio: '16:9' },
    })
    expect(wrapper.find('[data-testid="gen-card-idle"]').classes()).toContain('aspect-video')
  })

  // @requirement: FR-043
  it('rend un tag "via {gateway}" quand gatewayDisplayName est fourni', () => {
    const wrapper = mount(GenerationCard, {
      props: { gen: { ...baseGen, status: 'success', imageDataUrl: 'data:image/png;base64,x' }, gatewayDisplayName: 'OpenRouter' },
    })
    const tag = wrapper.find('[data-testid="gateway-tag"]')
    expect(tag.exists()).toBe(true)
    expect(tag.text()).toBe('via OpenRouter')
  })

  // @requirement: FR-043
  it('n\'affiche aucun tag gateway quand gatewayDisplayName est absent', () => {
    const wrapper = mount(GenerationCard, {
      props: { gen: { ...baseGen, status: 'success', imageDataUrl: 'data:image/png;base64,x' } },
    })
    expect(wrapper.find('[data-testid="gateway-tag"]').exists()).toBe(false)
  })

  // @requirement: STORY-089 (zone prompt sous la card)
  it('affiche la zone "Prompt" sous la card quand promptText est fourni', () => {
    const wrapper = mount(GenerationCard, {
      props: { gen: baseGen, promptText: 'A serene mountain landscape' },
    })
    const area = wrapper.find('[data-testid="card-prompt-area"]')
    expect(area.exists()).toBe(true)
    expect(area.text()).toContain('Prompt')
    expect(area.text()).toContain('A serene mountain landscape')
  })

  // @requirement: STORY-089
  it('n\'affiche pas la zone "Prompt" quand promptText n\'est pas fourni', () => {
    const wrapper = mount(GenerationCard, { props: { gen: baseGen } })
    expect(wrapper.find('[data-testid="card-prompt-area"]').exists()).toBe(false)
  })

  // @requirement: STORY-089
  it('affiche un tiret quand promptText est une chaîne vide', () => {
    const wrapper = mount(GenerationCard, { props: { gen: baseGen, promptText: '' } })
    const area = wrapper.find('[data-testid="card-prompt-area"]')
    expect(area.exists()).toBe(true)
    expect(area.text()).toContain('—')
  })

  // @requirement: FR-059, FR-072 (STORY-107 — historyMode badges)
  it('affiche le badge phase et variant quand historyMode=true', () => {
    const gen: LiveGeneration = { ...baseGen, status: 'success', imageDataUrl: 'data:image/png;base64,x', phase: 'mood', promptVariant: 'B' }
    const wrapper = mount(GenerationCard, { props: { gen, historyMode: true } })
    expect(wrapper.find('[data-testid="phase-badge"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="phase-badge"]').text()).toBe('Mood')
    expect(wrapper.find('[data-testid="variant-badge"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="variant-badge"]').text()).toBe('B')
  })

  // @requirement: FR-059 (STORY-107 — historyMode masque les actions)
  it('masque les boutons like/details/save en historyMode', () => {
    const gen: LiveGeneration = { ...baseGen, status: 'success', imageDataUrl: 'data:image/png;base64,x' }
    const wrapper = mount(GenerationCard, { props: { gen, historyMode: true } })
    expect(wrapper.find('[data-testid="like-btn"]').exists()).toBe(false)
  })

  // @requirement: FR-072 (STORY-107 — indicateur liked en historyMode)
  it('affiche l\'indicateur ❤ quand liked=true en historyMode', () => {
    const gen: LiveGeneration = { ...baseGen, status: 'success', imageDataUrl: 'data:image/png;base64,x', liked: true }
    const wrapper = mount(GenerationCard, { props: { gen, historyMode: true } })
    expect(wrapper.find('[data-testid="liked-indicator"]').exists()).toBe(true)
  })

  // @requirement: FR-072 (STORY-107 — pas d'indicateur si non liké en historyMode)
  it('n\'affiche pas l\'indicateur liked quand liked=false en historyMode', () => {
    const gen: LiveGeneration = { ...baseGen, status: 'success', imageDataUrl: 'data:image/png;base64,x', liked: false }
    const wrapper = mount(GenerationCard, { props: { gen, historyMode: true } })
    expect(wrapper.find('[data-testid="liked-indicator"]').exists()).toBe(false)
  })
})
