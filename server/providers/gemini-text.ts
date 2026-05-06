import { createLogger } from '../utils/logger'

const log = createLogger('gemini-text')

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta'
export const GEMINI_HELPER_MODEL = 'gemini-2.0-flash'

export class GeminiTextError extends Error {
  constructor(
    public readonly code: 'unauthorized' | 'rate_limited' | 'server_error' | 'invalid_response' | 'timeout',
    message: string,
    public readonly status?: number,
  ) {
    super(message)
    this.name = 'GeminiTextError'
  }
}

function mapHttpError(status: number, body: string): GeminiTextError {
  if (status === 401 || status === 403) return new GeminiTextError('unauthorized', `Gemini unauthorized: ${body.slice(0, 200)}`, status)
  if (status === 429) return new GeminiTextError('rate_limited', `Gemini rate limited`, status)
  if (status >= 500) return new GeminiTextError('server_error', `Gemini server error: ${body.slice(0, 200)}`, status)
  return new GeminiTextError('server_error', `Gemini ${status}: ${body.slice(0, 200)}`, status)
}

export interface GeminiMessage {
  role: 'user' | 'model'
  parts: Array<{ text: string }>
}

/**
 * Envoie une conversation multi-tour à Gemini et retourne la réponse textuelle.
 * Le `systemInstruction` est injecté comme instruction système (Gemini v1beta).
 */
export async function geminiChat(
  messages: GeminiMessage[],
  systemInstruction: string,
  apiKey: string,
  signal: AbortSignal,
  options: { maxTokens?: number; temperature?: number } = {},
): Promise<string> {
  const t0 = Date.now()
  const url = `${GEMINI_BASE}/models/${GEMINI_HELPER_MODEL}:generateContent?key=${apiKey}`

  log.debug(`geminiChat model=${GEMINI_HELPER_MODEL} turns=${messages.length}`)

  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: messages,
        generationConfig: {
          maxOutputTokens: options.maxTokens ?? 2048,
          temperature: options.temperature ?? 0.8,
        },
      }),
      signal,
    })
  } catch (err: unknown) {
    if ((err as Error).name === 'AbortError') throw new GeminiTextError('timeout', 'Aborted')
    log.error('network error', { msg: (err as Error).message })
    throw new GeminiTextError('server_error', `Network: ${(err as Error).message}`)
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    log.error(`HTTP ${res.status}`, { body: body.slice(0, 200) })
    throw mapHttpError(res.status, body)
  }

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
  }
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) {
    log.error('empty response', data)
    throw new GeminiTextError('invalid_response', 'No text in Gemini response')
  }

  log.info(`geminiChat success in ${Date.now() - t0}ms, ${text.length} chars`)
  return text
}
