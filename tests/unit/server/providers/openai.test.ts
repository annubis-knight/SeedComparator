import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createOpenAIGenerator } from '../../../../server/providers/openai'

const PNG_B64 = Buffer.from([0x89, 0x50, 0x4e, 0x47]).toString('base64')

describe('openai adapter (direct)', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  // Famille gpt-image (gpt-image-2 est le flagship 2026-04-21)
  const gptImage2 = createOpenAIGenerator({
    modelId: 'gpt-image-2',
    apiModel: 'gpt-image-2',
    pricePerImage: 0.053,
    family: 'gpt-image',
    supportsQualityParam: true,
  })

  // Famille dall-e
  const dalle3 = createOpenAIGenerator({
    modelId: 'dall-e-3',
    apiModel: 'dall-e-3',
    pricePerImage: 0.040,
    family: 'dall-e',
    supportsQualityParam: true,
  })

  // DALL-E 2 ne supporte pas le paramètre quality
  const dalle2 = createOpenAIGenerator({
    modelId: 'dall-e-2',
    apiModel: 'dall-e-2',
    pricePerImage: 0.020,
    family: 'dall-e',
    supportsQualityParam: false,
  })

  // @requirement: FR-009, FR-056
  it('transmet le prompt utilisateur sans modification', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ data: [{ b64_json: PNG_B64 }] }), { status: 200 }))
    await gptImage2.generate({ prompt: 'TEST PROMPT EXACT', ratio: '1:1' }, new AbortController().signal, 'sk-test')
    const body = JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string)
    expect(body.prompt).toBe('TEST PROMPT EXACT')
    expect(body.model).toBe('gpt-image-2')
  })

  // @requirement: FR-056
  it('utilise l\'endpoint /v1/images/generations avec Bearer auth', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ data: [{ b64_json: PNG_B64 }] }), { status: 200 }))
    await gptImage2.generate({ prompt: 'p', ratio: '1:1' }, new AbortController().signal, 'sk-mykey')
    const url = fetchMock.mock.calls[0]![0] as string
    const headers = (fetchMock.mock.calls[0]![1] as RequestInit).headers as Record<string, string>
    expect(url).toBe('https://api.openai.com/v1/images/generations')
    expect(headers.Authorization).toBe('Bearer sk-mykey')
  })

  // @requirement: FR-056
  it('famille dall-e : ajoute response_format=b64_json', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ data: [{ b64_json: PNG_B64 }] }), { status: 200 }))
    await dalle3.generate({ prompt: 'p', ratio: '1:1' }, new AbortController().signal, 'sk-x')
    const body = JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string)
    expect(body.response_format).toBe('b64_json')
  })

  // @requirement: FR-056
  it('famille gpt-image : pas de response_format (b64 par défaut)', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ data: [{ b64_json: PNG_B64 }] }), { status: 200 }))
    await gptImage2.generate({ prompt: 'p', ratio: '1:1' }, new AbortController().signal, 'sk-x')
    const body = JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string)
    expect(body.response_format).toBeUndefined()
  })

  // @requirement: FR-056
  it('DALL-E 2 ne reçoit pas le paramètre quality', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ data: [{ b64_json: PNG_B64 }] }), { status: 200 }))
    await dalle2.generate({ prompt: 'p', ratio: '1:1' }, new AbortController().signal, 'sk-x')
    const body = JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string)
    expect(body.quality).toBeUndefined()
  })

  // @requirement: FR-056
  it('DALL-E 3 reçoit quality=standard, gpt-image reçoit quality=auto', async () => {
    // Une nouvelle Response par appel (un body Response ne peut être lu qu'une fois)
    fetchMock.mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify({ data: [{ b64_json: PNG_B64 }] }), { status: 200 })),
    )
    await dalle3.generate({ prompt: 'p', ratio: '1:1' }, new AbortController().signal, 'sk-x')
    const body3 = JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string)
    expect(body3.quality).toBe('standard')

    fetchMock.mockClear()
    await gptImage2.generate({ prompt: 'p', ratio: '1:1' }, new AbortController().signal, 'sk-x')
    const bodyGpt = JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string)
    expect(bodyGpt.quality).toBe('auto')
  })

  // @requirement: FR-001, NFR-001, FR-056
  it('throw unauthorized si pas de clé API', async () => {
    await expect(gptImage2.generate({ prompt: 'p', ratio: '1:1' }, new AbortController().signal, null))
      .rejects.toMatchObject({ code: 'unauthorized' })
  })

  // @requirement: FR-016, FR-056
  it('mappe 401 → ProviderError unauthorized', async () => {
    fetchMock.mockResolvedValue(new Response('nope', { status: 401 }))
    await expect(gptImage2.generate({ prompt: 'p', ratio: '1:1' }, new AbortController().signal, 'sk-bad'))
      .rejects.toMatchObject({ code: 'unauthorized' })
  })

  // @requirement: FR-016, FR-056
  it('mappe 429 → rate_limited', async () => {
    fetchMock.mockResolvedValue(new Response('slow down', { status: 429 }))
    await expect(gptImage2.generate({ prompt: 'p', ratio: '1:1' }, new AbortController().signal, 'sk-x'))
      .rejects.toMatchObject({ code: 'rate_limited' })
  })

  // @requirement: FR-016, FR-056
  it('mappe 500 → server_error', async () => {
    fetchMock.mockResolvedValue(new Response('boom', { status: 500 }))
    await expect(gptImage2.generate({ prompt: 'p', ratio: '1:1' }, new AbortController().signal, 'sk-x'))
      .rejects.toMatchObject({ code: 'server_error' })
  })

  // @requirement: FR-014, FR-056
  it('propage AbortError → ProviderError aborted', async () => {
    const err = new Error('abort'); err.name = 'AbortError'
    fetchMock.mockRejectedValue(err)
    await expect(gptImage2.generate({ prompt: 'p', ratio: '1:1' }, new AbortController().signal, 'sk-x'))
      .rejects.toMatchObject({ code: 'aborted' })
  })

  // @requirement: FR-056
  it('décode b64_json et retourne un Buffer + source=openai', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ data: [{ b64_json: PNG_B64 }] }), { status: 200 }))
    const out = await gptImage2.generate({ prompt: 'p', ratio: '16:9' }, new AbortController().signal, 'sk-x')
    expect(Buffer.isBuffer(out.imageBuffer)).toBe(true)
    expect(out.modelId).toBe('gpt-image-2')
    expect(out.source).toBe('openai')
    expect(out.mime).toBe('image/png')
    expect(out.seed).toBeNull()
    expect(out.costUsd).toBe(0.053)
  })

  // @requirement: FR-056
  it('throw server_error quand data vide', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ data: [] }), { status: 200 }))
    await expect(gptImage2.generate({ prompt: 'p', ratio: '1:1' }, new AbortController().signal, 'sk-x'))
      .rejects.toMatchObject({ code: 'server_error' })
  })

  // @requirement: FR-008, FR-056
  it('mappe ratio=16:9 → size=1536x1024', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ data: [{ b64_json: PNG_B64 }] }), { status: 200 }))
    await gptImage2.generate({ prompt: 'p', ratio: '16:9' }, new AbortController().signal, 'sk-x')
    const body = JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string)
    expect(body.size).toBe('1536x1024')
  })

  // @requirement: FR-079 — overrides utilisateur appliqués
  it('DALL·E 3 : openaiQuality=hd écrase le défaut "standard"', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ data: [{ b64_json: PNG_B64 }] }), { status: 200 }))
    await dalle3.generate({
      prompt: 'p',
      ratio: '1:1',
      params: { openaiQuality: 'hd', openaiStyle: 'natural' },
    }, new AbortController().signal, 'sk-x')
    const body = JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string)
    expect(body.quality).toBe('hd')
    expect(body.style).toBe('natural')
  })

  // @requirement: FR-079 — anti-régression : sans params, body identique au comportement V1
  it('DALL·E 3 : sans params utilisateur, quality reste à "standard"', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ data: [{ b64_json: PNG_B64 }] }), { status: 200 }))
    await dalle3.generate({ prompt: 'p', ratio: '1:1' }, new AbortController().signal, 'sk-x')
    const body = JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string)
    expect(body.quality).toBe('standard')
    expect(body.response_format).toBe('b64_json')
  })

  // @requirement: FR-079 — params Fal ne fuitent pas dans body OpenAI
  it('ignore les params inconnus d\'OpenAI (guidanceScale)', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ data: [{ b64_json: PNG_B64 }] }), { status: 200 }))
    await gptImage2.generate({
      prompt: 'p',
      ratio: '1:1',
      params: { guidanceScale: 5, openaiQuality: 'high' },
    }, new AbortController().signal, 'sk-x')
    const body = JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string)
    expect(body.quality).toBe('high')
    expect(body).not.toHaveProperty('guidance_scale')
  })
})
