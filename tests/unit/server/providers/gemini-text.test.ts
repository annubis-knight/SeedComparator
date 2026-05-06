import { describe, it, expect, vi, beforeEach } from 'vitest'
import { geminiChat, GeminiTextError } from '../../../../server/providers/gemini-text'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

function ok(text: string): Response {
  return {
    ok: true,
    json: async () => ({
      candidates: [{ content: { parts: [{ text }] } }],
    }),
  } as unknown as Response
}

function err(status: number, body: string): Response {
  return {
    ok: false,
    status,
    text: async () => body,
  } as unknown as Response
}

describe('gemini-text adapter', () => {
  beforeEach(() => mockFetch.mockReset())

  const messages = [{ role: 'user' as const, parts: [{ text: 'Aide-moi avec un prompt wireframe' }] }]
  const system = 'Tu es un assistant créatif.'
  const apiKey = 'TEST_KEY'
  const signal = new AbortController().signal

  // @requirement: FR-073 (STORY-108)
  it('retourne le texte de la réponse Gemini', async () => {
    mockFetch.mockResolvedValue(ok('Voici une suggestion de prompt.'))
    const result = await geminiChat(messages, system, apiKey, signal)
    expect(result).toBe('Voici une suggestion de prompt.')
  })

  // @requirement: FR-073 (STORY-108)
  it('transmet l\'instruction système et les messages', async () => {
    mockFetch.mockResolvedValue(ok('OK'))
    await geminiChat(messages, system, apiKey, signal)
    const call = mockFetch.mock.calls[0]
    const body = JSON.parse(call[1].body as string)
    expect(body.systemInstruction.parts[0].text).toBe(system)
    expect(body.contents[0].parts[0].text).toBe('Aide-moi avec un prompt wireframe')
    expect(body.contents[0].role).toBe('user')
  })

  // @requirement: FR-073 (STORY-108)
  it('inclut la clé API dans l\'URL', async () => {
    mockFetch.mockResolvedValue(ok('OK'))
    await geminiChat(messages, system, apiKey, signal)
    const url = mockFetch.mock.calls[0][0] as string
    expect(url).toContain(`key=${apiKey}`)
  })

  // @requirement: FR-073 (STORY-108)
  it('lance GeminiTextError unauthorized sur 403', async () => {
    mockFetch.mockResolvedValue(err(403, 'Forbidden'))
    await expect(geminiChat(messages, system, apiKey, signal)).rejects.toMatchObject({
      code: 'unauthorized',
      name: 'GeminiTextError',
    })
  })

  // @requirement: FR-073 (STORY-108)
  it('lance GeminiTextError rate_limited sur 429', async () => {
    mockFetch.mockResolvedValue(err(429, 'Too many requests'))
    await expect(geminiChat(messages, system, apiKey, signal)).rejects.toMatchObject({
      code: 'rate_limited',
    })
  })

  // @requirement: FR-073 (STORY-108)
  it('lance GeminiTextError invalid_response si la réponse est vide', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ candidates: [] }) } as unknown as Response)
    await expect(geminiChat(messages, system, apiKey, signal)).rejects.toMatchObject({
      code: 'invalid_response',
    })
  })
})
