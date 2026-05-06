import { describe, it, expect } from 'vitest'
import { API_MAPPINGS, applyParams } from '../../../../server/providers/paramApiMapping'

describe('paramApiMapping', () => {
  // @requirement: FR-079 — chaque trait connu doit avoir une clé d'API mappée
  it('Fal : mappe guidanceScale → guidance_scale', () => {
    const body: Record<string, unknown> = { prompt: 'x' }
    applyParams(API_MAPPINGS.fal, body, { guidanceScale: 5, numInferenceSteps: 30 })
    expect(body.guidance_scale).toBe(5)
    expect(body.num_inference_steps).toBe(30)
  })

  // @requirement: FR-079 — pas de fuite : un trait inconnu pour la source est ignoré
  it('Fal : ignore openaiQuality (inconnu pour Fal)', () => {
    const body: Record<string, unknown> = { prompt: 'x' }
    applyParams(API_MAPPINGS.fal, body, { openaiQuality: 'hd' })
    expect(body).not.toHaveProperty('quality')
    expect(body).not.toHaveProperty('openaiQuality')
  })

  // @requirement: FR-079
  it('OpenAI : mappe outputFormat → response_format', () => {
    const body: Record<string, unknown> = { model: 'dall-e-3' }
    applyParams(API_MAPPINGS.openai, body, { outputFormat: 'jpeg', openaiQuality: 'hd' })
    expect(body.response_format).toBe('jpeg')
    expect(body.quality).toBe('hd')
  })

  // @requirement: FR-079 — Imagen utilise un mapping nested
  it('Imagen : mappe imagenPersonGeneration → parameters.personGeneration', () => {
    const body: Record<string, unknown> = { instances: [{ prompt: 'x' }], parameters: { sampleCount: 1 } }
    applyParams(API_MAPPINGS.imagen, body, { imagenPersonGeneration: 'allow_all', seed: 42 })
    expect((body.parameters as Record<string, unknown>).personGeneration).toBe('allow_all')
    expect((body.parameters as Record<string, unknown>).seed).toBe(42)
    expect((body.parameters as Record<string, unknown>).sampleCount).toBe(1) // pas écrasé
  })

  // @requirement: FR-079
  it('Gemini Image : mappe geminiTemperature → generationConfig.temperature', () => {
    const body: Record<string, unknown> = { contents: [], generationConfig: { responseModalities: ['IMAGE'] } }
    applyParams(API_MAPPINGS.geminiImage, body, { geminiTemperature: 0.5 })
    expect((body.generationConfig as Record<string, unknown>).temperature).toBe(0.5)
    expect((body.generationConfig as Record<string, unknown>).responseModalities).toEqual(['IMAGE'])
  })

  // @requirement: FR-079 — anti-régression : sans params, body inchangé
  it('sans params, body est inchangé', () => {
    const body: Record<string, unknown> = { prompt: 'x', a: 1 }
    applyParams(API_MAPPINGS.fal, body, undefined)
    expect(body).toEqual({ prompt: 'x', a: 1 })
  })

  // @requirement: FR-079
  it('valeur undefined explicite est ignorée', () => {
    const body: Record<string, unknown> = { prompt: 'x' }
    applyParams(API_MAPPINGS.fal, body, { guidanceScale: undefined })
    expect(body).not.toHaveProperty('guidance_scale')
  })
})
