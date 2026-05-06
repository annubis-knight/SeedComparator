import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createFalGenerator } from '../../../../server/providers/fal'

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47])
const JSON_HEADERS = { 'Content-Type': 'application/json' }

/**
 * STORY-104 — l'adapter Fal utilise désormais la queue async :
 *  call 1 : POST  queue.fal.run/<model>          → { status_url, response_url } status=IN_QUEUE
 *  call 2+: GET   status_url                      → { status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' }
 *  call N : GET   response_url                    → { images:[{url}], seed }
 *  call N+1: GET  image url                       → bytes
 *
 * Tous les tests utilisent vi.useFakeTimers pour skipper le sleep entre les polls.
 */
describe('fal adapter (queue async)', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  const gen = createFalGenerator({ modelId: 'flux-1.1-pro', apiModel: 'fal-ai/flux-pro', pricePerImage: 0.04, supportsSeed: true })

  function mockHappyPath() {
    fetchMock
      // 1. submit
      .mockResolvedValueOnce(new Response(JSON.stringify({
        status: 'IN_QUEUE',
        request_id: 'req-1',
        status_url: 'https://queue.fal.run/req-1/status',
        response_url: 'https://queue.fal.run/req-1',
      }), { status: 200, headers: JSON_HEADERS }))
      // 2. poll → COMPLETED dès le 1er poll
      .mockResolvedValueOnce(new Response(JSON.stringify({ status: 'COMPLETED' }), { status: 200, headers: JSON_HEADERS }))
      // 3. response
      .mockResolvedValueOnce(new Response(JSON.stringify({
        images: [{ url: 'https://cdn.fal.media/img.jpg', content_type: 'image/jpeg', width: 1024, height: 1024 }],
        seed: 99,
      }), { status: 200, headers: JSON_HEADERS }))
      // 4. download
      .mockResolvedValueOnce(new Response(PNG, { status: 200, headers: { 'Content-Type': 'image/jpeg' } }))
  }

  // @requirement: FR-009
  it('transmet le prompt utilisateur sans modification (POST submit)', async () => {
    mockHappyPath()
    await gen.generate({ prompt: 'BRUT', ratio: '1:1' }, new AbortController().signal, 'fal-test')
    const submitCall = fetchMock.mock.calls[0]!
    expect(submitCall[0]).toBe('https://queue.fal.run/fal-ai/flux-pro')
    const body = JSON.parse((submitCall[1] as RequestInit).body as string)
    expect(body.prompt).toBe('BRUT')
  })

  // @requirement: FR-034
  it('passe le seed quand supportsSeed=true et seed fourni', async () => {
    mockHappyPath()
    await gen.generate({ prompt: 'p', ratio: '1:1', seed: 12345 }, new AbortController().signal, 'fal-test')
    const body = JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string)
    expect(body.seed).toBe(12345)
  })

  // @requirement: FR-079 — params résolus injectés dans le body API
  it('transmet les params canoniques vers les noms d\'API Fal (guidance_scale, num_inference_steps...)', async () => {
    mockHappyPath()
    await gen.generate({
      prompt: 'p',
      ratio: '1:1',
      params: { guidanceScale: 7.5, numInferenceSteps: 35, outputFormat: 'jpeg', enableSafetyChecker: false },
    }, new AbortController().signal, 'fal-test')
    const body = JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string)
    expect(body.guidance_scale).toBe(7.5)
    expect(body.num_inference_steps).toBe(35)
    expect(body.output_format).toBe('jpeg')
    expect(body.enable_safety_checker).toBe(false)
  })

  // @requirement: FR-079 — anti-régression : sans params, body identique au comportement V1
  it('sans params utilisateur, body inchangé vs V1', async () => {
    mockHappyPath()
    await gen.generate({ prompt: 'BRUT', ratio: '1:1' }, new AbortController().signal, 'fal-test')
    const body = JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string)
    expect(body).toEqual({ prompt: 'BRUT', image_size: 'square_hd' })
  })

  // @requirement: FR-079 — un trait inconnu de Fal ne fuite pas dans le body
  it('ignore les params inconnus de Fal (ex: openaiQuality)', async () => {
    mockHappyPath()
    await gen.generate({
      prompt: 'p',
      ratio: '1:1',
      params: { openaiQuality: 'hd', guidanceScale: 5 },
    }, new AbortController().signal, 'fal-test')
    const body = JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string)
    expect(body.guidance_scale).toBe(5)
    expect(body).not.toHaveProperty('quality')
    expect(body).not.toHaveProperty('openaiQuality')
  })

  // @requirement: FR-104 — pattern queue
  it('poll status_url jusqu\'à COMPLETED puis fetch response_url', { timeout: 10000 }, async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({
        status: 'IN_QUEUE',
        status_url: 'https://q/status',
        response_url: 'https://q/response',
      }), { status: 200, headers: JSON_HEADERS }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ status: 'IN_QUEUE' }), { status: 200, headers: JSON_HEADERS }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ status: 'IN_PROGRESS' }), { status: 200, headers: JSON_HEADERS }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ status: 'COMPLETED' }), { status: 200, headers: JSON_HEADERS }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ images: [{ url: 'https://cdn/img.jpg' }], seed: 1 }), { status: 200, headers: JSON_HEADERS }))
      .mockResolvedValueOnce(new Response(PNG, { status: 200, headers: { 'Content-Type': 'image/jpeg' } }))

    const out = await gen.generate({ prompt: 'p', ratio: '1:1' }, new AbortController().signal, 'k')
    expect(out.modelId).toBe('flux-1.1-pro')
    // 1 submit + 3 polls + 1 response + 1 image download = 6 calls
    expect(fetchMock).toHaveBeenCalledTimes(6)
    // Verify URLs sequence
    expect(fetchMock.mock.calls[1]![0]).toBe('https://q/status')
    expect(fetchMock.mock.calls[2]![0]).toBe('https://q/status')
    expect(fetchMock.mock.calls[3]![0]).toBe('https://q/status')
    expect(fetchMock.mock.calls[4]![0]).toBe('https://q/response')
  })

  // @requirement: FR-104 — Le mime type vient du content_type Fal
  it('renvoie le mime depuis content_type de l\'image (souvent JPEG)', async () => {
    mockHappyPath()
    const out = await gen.generate({ prompt: 'p', ratio: '1:1' }, new AbortController().signal, 'k')
    expect(out.mime).toBe('image/jpeg')
    expect(Buffer.isBuffer(out.imageBuffer)).toBe(true)
    expect(out.seed).toBe(99)
    expect(out.source).toBe('fal')
    expect(out.costUsd).toBe(0.04)
  })

  // @requirement: FR-104 — gestion FAILED status
  it('throw server_error si la queue renvoie status=FAILED', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({
        status: 'IN_QUEUE',
        status_url: 'https://q/status',
        response_url: 'https://q/response',
      }), { status: 200, headers: JSON_HEADERS }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ status: 'FAILED' }), { status: 200, headers: JSON_HEADERS }))

    await expect(gen.generate({ prompt: 'p', ratio: '1:1' }, new AbortController().signal, 'k'))
      .rejects.toMatchObject({ code: 'server_error' })
  })

  // @requirement: FR-016
  it('mappe 401 sur le submit → unauthorized', async () => {
    fetchMock.mockResolvedValueOnce(new Response('no', { status: 401 }))
    await expect(gen.generate({ prompt: 'p', ratio: '1:1' }, new AbortController().signal, 'bad'))
      .rejects.toMatchObject({ code: 'unauthorized' })
  })

  // @requirement: FR-001, NFR-001
  it('throw unauthorized si clé manquante', async () => {
    await expect(gen.generate({ prompt: 'p', ratio: '1:1' }, new AbortController().signal, null))
      .rejects.toMatchObject({ code: 'unauthorized' })
  })

  // @requirement: FR-104 — Content-Type guard
  it('throw server_error si la réponse 200 est du HTML', async () => {
    fetchMock.mockResolvedValueOnce(new Response('<!DOCTYPE html>', { status: 200, headers: { 'Content-Type': 'text/html' } }))
    await expect(gen.generate({ prompt: 'p', ratio: '1:1' }, new AbortController().signal, 'k'))
      .rejects.toMatchObject({ code: 'server_error' })
  })
})
