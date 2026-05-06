import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import CanonicalParamRow from '../../../app/components/session/CanonicalParamRow.vue'
import { useModelParams } from '../../../app/composables/useModelParams'
import {
  CANONICAL_PARAMS,
  toCanonicalParamDTO,
  type CanonicalParamDTO,
} from '../../../shared/canonicalParams'

function dto(key: keyof typeof CANONICAL_PARAMS): CanonicalParamDTO {
  return toCanonicalParamDTO(CANONICAL_PARAMS[key])
}

describe('CanonicalParamRow — démultiplexage canonique → natif', () => {
  beforeEach(() => {
    const { resetModel, allOverrides } = useModelParams()
    for (const k of Object.keys(allOverrides.value)) resetModel(k)
  })

  // @requirement: FR-082 — clic sur "hd" (4) écrit la valeur native sur tous les modèles concernés
  it('quality slider à 4 → écrit openaiQuality=hd sur DALL·E 3 et openaiQuality=high sur GPT Image', async () => {
    const param = dto('quality')
    const w = mount(CanonicalParamRow, {
      props: { param, selectedModelIds: ['dall-e-3', 'gpt-image-2'] },
    })
    await w.find('input[type="range"]').setValue('4')

    const { getParams } = useModelParams()
    expect(getParams('dall-e-3').openaiQuality).toBe('hd')
    expect(getParams('gpt-image-2').openaiQuality).toBe('high')
  })

  // @requirement: FR-082 — un modèle non concerné n'est pas touché
  it('Flux n\'est pas affecté par le slider quality', async () => {
    const param = dto('quality')
    const w = mount(CanonicalParamRow, {
      props: { param, selectedModelIds: ['dall-e-3', 'flux-1.1-pro'] },
    })
    await w.find('input[type="range"]').setValue('5')

    const { getParams } = useModelParams()
    expect(getParams('dall-e-3').openaiQuality).toBe('hd')
    expect(getParams('flux-1.1-pro').openaiQuality).toBeUndefined()
  })

  // @requirement: FR-082 — segmented outputFormat
  it('outputFormat=balanced écrit webp côté OpenAI et jpeg côté Fal', async () => {
    const param = dto('outputFormat')
    const w = mount(CanonicalParamRow, {
      props: { param, selectedModelIds: ['gpt-image-2', 'flux-1.1-pro'] },
    })
    // Clic sur "Équilibré"
    const pills = w.findAll('button[role="radio"]')
    const balanced = pills.find((p) => p.text() === 'Équilibré')!
    await balanced.trigger('click')

    const { getParams } = useModelParams()
    expect(getParams('gpt-image-2').outputFormat).toBe('webp')
    expect(getParams('flux-1.1-pro').outputFormat).toBe('jpeg')
  })

  // @requirement: FR-082 — multiplexage safetyLevel : un seul contrôle pilote 2 traits Fal Pro
  it('safetyLevel=strict écrit safetyTolerance=2 ET enableSafetyChecker=true sur Flux Pro', async () => {
    const param = dto('safetyLevel')
    const w = mount(CanonicalParamRow, {
      props: { param, selectedModelIds: ['flux-1.1-pro'] },
    })
    const pills = w.findAll('button[role="radio"]')
    const strict = pills.find((p) => p.text() === 'Strict')!
    await strict.trigger('click')

    const { getParams } = useModelParams()
    expect(getParams('flux-1.1-pro').safetyTolerance).toBe(2)
    expect(getParams('flux-1.1-pro').enableSafetyChecker).toBe(true)
  })

  // @requirement: FR-082 — creativity inversée : 0 (strict) → guidanceScale=15 sur Flux
  it('creativity=0 → guidanceScale=15 (très strict) sur Flux', async () => {
    const param = dto('creativity')
    const w = mount(CanonicalParamRow, {
      props: { param, selectedModelIds: ['flux-1.1-pro'] },
    })
    await w.find('input[type="range"]').setValue('0')

    const { getParams } = useModelParams()
    expect(getParams('flux-1.1-pro').guidanceScale).toBe(15)
  })

  // @requirement: FR-082 — creativity 5 sur Gemini → temperature=1
  it('creativity=5 → geminiTemperature=1 (équilibré) sur Gemini', async () => {
    const param = dto('creativity')
    const w = mount(CanonicalParamRow, {
      props: { param, selectedModelIds: ['gemini-3.1-flash-image-preview'] },
    })
    await w.find('input[type="range"]').setValue('5')

    const { getParams } = useModelParams()
    expect(getParams('gemini-3.1-flash-image-preview').geminiTemperature).toBe(1)
  })

  // @requirement: FR-082 — affichage du compteur "Appliqué à N modèles"
  it('affiche "Appliqué à N modèles" avec le bon nombre', () => {
    const param = dto('outputFormat')
    const w = mount(CanonicalParamRow, {
      props: { param, selectedModelIds: ['gpt-image-2', 'flux-1.1-pro', 'flux-1.1-schnell'] },
    })
    expect(w.text()).toContain('Appliqué à 3 modèles')
  })

  it('"Appliqué à 1 modèle" au singulier', () => {
    const param = dto('outputFormat')
    const w = mount(CanonicalParamRow, {
      props: { param, selectedModelIds: ['gpt-image-2'] },
    })
    expect(w.text()).toContain('Appliqué à 1 modèle')
    expect(w.text()).not.toContain('1 modèles')
  })

  // @requirement: FR-082 — textarea negativePrompt
  it('negativePrompt propage le texte vers tous les modèles concernés', async () => {
    const param = dto('negativePrompt')
    const w = mount(CanonicalParamRow, {
      props: { param, selectedModelIds: ['sd-3.5-large', 'imagen-4'] },
    })
    await w.find('textarea').setValue('low quality, blurry')

    const { getParams } = useModelParams()
    expect(getParams('sd-3.5-large').negativePrompt).toBe('low quality, blurry')
    expect(getParams('imagen-4').negativePrompt).toBe('low quality, blurry')
  })
})
