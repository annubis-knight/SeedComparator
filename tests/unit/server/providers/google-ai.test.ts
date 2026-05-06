import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createGoogleAIGenerator } from '../../../../server/providers/google-ai'

const PNG_B64 = Buffer.from([0x89, 0x50, 0x4e, 0x47]).toString('base64')
const JSON_HEADERS = { 'Content-Type': 'application/json' }

describe('google-ai adapter — Imagen family (predict)', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const gen = createGoogleAIGenerator({
    modelId: 'imagen-4',
    apiModel: 'imagen-4.0-generate-001',
    family: 'imagen',
    pricePerImage: 0.04,
  })

  // @requirement: FR-009, FR-051
  it('transmet le prompt utilisateur sans modification', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ predictions: [{ bytesBase64Encoded: PNG_B64, mimeType: 'image/png' }] }), { status: 200, headers: JSON_HEADERS }))
    await gen.generate({ prompt: 'TEST PROMPT EXACT', ratio: '1:1' }, new AbortController().signal, 'test-key')
    const body = JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string)
    expect(body.instances[0].prompt).toBe('TEST PROMPT EXACT')
  })

  // @requirement: FR-051
  it('utilise l\'endpoint :predict + personGeneration=ALLOW_ADULT', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ predictions: [{ bytesBase64Encoded: PNG_B64 }] }), { status: 200, headers: JSON_HEADERS }))
    await gen.generate({ prompt: 'p', ratio: '16:9' }, new AbortController().signal, 'k')
    const url = fetchMock.mock.calls[0]![0] as string
    expect(url).toContain(':predict')
    const body = JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string)
    expect(body.parameters.personGeneration).toBe('ALLOW_ADULT')
    expect(body.parameters.aspectRatio).toBe('16:9')
  })

  // @requirement: FR-051
  it('utilise le header x-goog-api-key (pas de query param)', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ predictions: [{ bytesBase64Encoded: PNG_B64 }] }), { status: 200, headers: JSON_HEADERS }))
    await gen.generate({ prompt: 'p', ratio: '1:1' }, new AbortController().signal, 'my-key')
    const url = fetchMock.mock.calls[0]![0] as string
    const headers = (fetchMock.mock.calls[0]![1] as RequestInit).headers as Record<string, string>
    expect(url).not.toContain('?key=')
    expect(headers['x-goog-api-key']).toBe('my-key')
  })

  // @requirement: FR-001, NFR-001, FR-051
  it('throw unauthorized si pas de clé API', async () => {
    await expect(gen.generate({ prompt: 'p', ratio: '1:1' }, new AbortController().signal, null))
      .rejects.toMatchObject({ code: 'unauthorized' })
  })

  // @requirement: FR-016, FR-051
  it('mappe 401 → unauthorized', async () => {
    fetchMock.mockResolvedValue(new Response('nope', { status: 401 }))
    await expect(gen.generate({ prompt: 'p', ratio: '1:1' }, new AbortController().signal, 'k'))
      .rejects.toMatchObject({ code: 'unauthorized' })
  })

  // @requirement: FR-016, FR-051
  it('mappe 429 → rate_limited', async () => {
    fetchMock.mockResolvedValue(new Response('slow down', { status: 429 }))
    await expect(gen.generate({ prompt: 'p', ratio: '1:1' }, new AbortController().signal, 'k'))
      .rejects.toMatchObject({ code: 'rate_limited' })
  })

  // @requirement: FR-016, FR-051
  it('mappe 500 → server_error', async () => {
    fetchMock.mockResolvedValue(new Response('boom', { status: 500 }))
    await expect(gen.generate({ prompt: 'p', ratio: '1:1' }, new AbortController().signal, 'k'))
      .rejects.toMatchObject({ code: 'server_error' })
  })

  // @requirement: FR-014, FR-051
  it('propage AbortError → aborted', async () => {
    const err = new Error('abort'); err.name = 'AbortError'
    fetchMock.mockRejectedValue(err)
    await expect(gen.generate({ prompt: 'p', ratio: '1:1' }, new AbortController().signal, 'k'))
      .rejects.toMatchObject({ code: 'aborted' })
  })

  // @requirement: FR-051
  it('décode bytesBase64Encoded et retourne un Buffer + source=google-ai', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ predictions: [{ bytesBase64Encoded: PNG_B64, mimeType: 'image/png' }] }), { status: 200, headers: JSON_HEADERS }))
    const out = await gen.generate({ prompt: 'p', ratio: '16:9' }, new AbortController().signal, 'k')
    expect(Buffer.isBuffer(out.imageBuffer)).toBe(true)
    expect(out.modelId).toBe('imagen-4')
    expect(out.source).toBe('google-ai')
    expect(out.mime).toBe('image/png')
    expect(out.seed).toBeNull()
    expect(out.costUsd).toBe(0.04)
  })

  // @requirement: FR-051
  it('throw server_error quand predictions vide', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ predictions: [] }), { status: 200, headers: JSON_HEADERS }))
    await expect(gen.generate({ prompt: 'p', ratio: '1:1' }, new AbortController().signal, 'k'))
      .rejects.toMatchObject({ code: 'server_error' })
  })

  // @requirement: FR-051 — STORY-104 Content-Type guard
  it('throw server_error si la réponse 200 n\'est pas du JSON', async () => {
    fetchMock.mockResolvedValue(new Response('<!DOCTYPE html><html>...', { status: 200, headers: { 'Content-Type': 'text/html' } }))
    await expect(gen.generate({ prompt: 'p', ratio: '1:1' }, new AbortController().signal, 'k'))
      .rejects.toMatchObject({ code: 'server_error' })
  })

  // @requirement: FR-079 — overrides Imagen via parameters.* (mapping nested)
  it('Imagen : params imagenPersonGeneration et seed atterrissent dans parameters.*', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ predictions: [{ bytesBase64Encoded: PNG_B64 }] }), { status: 200, headers: JSON_HEADERS }))
    await gen.generate({
      prompt: 'p', ratio: '1:1',
      params: { imagenPersonGeneration: 'allow_all', seed: 42, imagenAddWatermark: false },
    }, new AbortController().signal, 'k')
    const body = JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string)
    expect(body.parameters.personGeneration).toBe('allow_all')
    expect(body.parameters.seed).toBe(42)
    expect(body.parameters.addWatermark).toBe(false)
    // Les défauts hardcodés non écrasés restent en place
    expect(body.parameters.sampleCount).toBe(1)
    expect(body.parameters.aspectRatio).toBe('1:1')
  })

  // @requirement: FR-079 — anti-régression
  it('Imagen : sans params, body identique au comportement V1', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ predictions: [{ bytesBase64Encoded: PNG_B64 }] }), { status: 200, headers: JSON_HEADERS }))
    await gen.generate({ prompt: 'p', ratio: '1:1' }, new AbortController().signal, 'k')
    const body = JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string)
    expect(body.parameters.personGeneration).toBe('ALLOW_ADULT')
    expect(body.parameters).not.toHaveProperty('seed')
    expect(body.parameters).not.toHaveProperty('addWatermark')
  })
})

describe('google-ai adapter — Gemini Image family (generateContent)', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const gen = createGoogleAIGenerator({
    modelId: 'gemini-2.5-flash-image',
    apiModel: 'gemini-2.5-flash-image',
    family: 'gemini-image',
    pricePerImage: 0.030,
  })

  // @requirement: FR-104, FR-051
  it('utilise l\'endpoint :generateContent (pas :predict)', async () => {
    const body = { candidates: [{ content: { parts: [{ inlineData: { data: PNG_B64, mimeType: 'image/png' } }] } }] }
    fetchMock.mockResolvedValue(new Response(JSON.stringify(body), { status: 200, headers: JSON_HEADERS }))
    await gen.generate({ prompt: 'p', ratio: '1:1' }, new AbortController().signal, 'k')
    const url = fetchMock.mock.calls[0]![0] as string
    expect(url).toContain(':generateContent')
    expect(url).not.toContain(':predict')
  })

  // @requirement: FR-104
  it('demande responseModalities=[IMAGE] dans generationConfig', async () => {
    const body = { candidates: [{ content: { parts: [{ inlineData: { data: PNG_B64 } }] } }] }
    fetchMock.mockResolvedValue(new Response(JSON.stringify(body), { status: 200, headers: JSON_HEADERS }))
    await gen.generate({ prompt: 'p', ratio: '1:1' }, new AbortController().signal, 'k')
    const reqBody = JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string)
    expect(reqBody.generationConfig.responseModalities).toEqual(['IMAGE'])
  })

  // @requirement: FR-104
  it('extrait l\'image depuis candidates[0].content.parts[].inlineData', async () => {
    const body = {
      candidates: [{
        content: { parts: [{ text: 'here is your image' }, { inlineData: { data: PNG_B64, mimeType: 'image/png' } }] },
      }],
    }
    fetchMock.mockResolvedValue(new Response(JSON.stringify(body), { status: 200, headers: JSON_HEADERS }))
    const out = await gen.generate({ prompt: 'p', ratio: '1:1' }, new AbortController().signal, 'k')
    expect(Buffer.isBuffer(out.imageBuffer)).toBe(true)
    expect(out.imageBuffer.length).toBeGreaterThan(0)
    expect(out.mime).toBe('image/png')
  })

  // @requirement: FR-104 — texte ignoré (seule l'image nous intéresse)
  it('ignore les parties texte et ne renvoie que l\'image', async () => {
    const body = {
      candidates: [{
        content: { parts: [{ text: 'caption' }, { inlineData: { data: PNG_B64 } }, { text: 'more text' }] },
      }],
    }
    fetchMock.mockResolvedValue(new Response(JSON.stringify(body), { status: 200, headers: JSON_HEADERS }))
    const out = await gen.generate({ prompt: 'p', ratio: '1:1' }, new AbortController().signal, 'k')
    expect(Buffer.isBuffer(out.imageBuffer)).toBe(true)
    // rawResponse contient TOUT (utile pour debug), mais imageBuffer n'a que l'image
    expect((out.rawResponse as { candidates: unknown[] }).candidates).toBeDefined()
  })

  // @requirement: FR-104
  it('throw server_error si pas d\'inlineData dans la réponse', async () => {
    const body = { candidates: [{ content: { parts: [{ text: 'no image here' }] }, finishReason: 'SAFETY' }] }
    fetchMock.mockResolvedValue(new Response(JSON.stringify(body), { status: 200, headers: JSON_HEADERS }))
    await expect(gen.generate({ prompt: 'p', ratio: '1:1' }, new AbortController().signal, 'k'))
      .rejects.toMatchObject({ code: 'server_error' })
  })

  // @requirement: FR-104, FR-016
  it('mappe 401 → unauthorized (gemini-image)', async () => {
    fetchMock.mockResolvedValue(new Response('nope', { status: 401 }))
    await expect(gen.generate({ prompt: 'p', ratio: '1:1' }, new AbortController().signal, 'k'))
      .rejects.toMatchObject({ code: 'unauthorized' })
  })

  // @requirement: FR-104 — Content-Type guard
  it('throw server_error si la réponse 200 n\'est pas du JSON (gemini-image)', async () => {
    fetchMock.mockResolvedValue(new Response('<!DOCTYPE html>', { status: 200, headers: { 'Content-Type': 'text/html' } }))
    await expect(gen.generate({ prompt: 'p', ratio: '1:1' }, new AbortController().signal, 'k'))
      .rejects.toMatchObject({ code: 'server_error' })
  })
})
