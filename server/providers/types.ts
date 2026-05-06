import type { Ratio } from '#shared/contracts'

export interface GenerateInput {
  prompt: string
  ratio: Ratio
  seed?: number | null
  /**
   * EPIC-18 / STORY-121 — Paramètres résolus (defaults ⊕ overrides utilisateur).
   * Map plate `{ paramKey: value }`, typée côté server par `paramResolver.ts`.
   * Inclut global ∪ per-generation ; chaque adapter ignore ce qu'il ne connaît pas.
   */
  params?: Record<string, unknown>
}

export type ProviderSource = 'openrouter' | 'fal' | 'google-ai' | 'openai'

export interface GenerateOutput {
  imageBuffer: Buffer
  mime: string
  modelId: string
  source: ProviderSource
  seed: number | null
  costUsd: number
  rawResponse: unknown
  /**
   * STORY-104 (UX honesty) — Quand le mode courant est `mock-real`, l'adapter
   * `mockReal.ts` rejoue toujours la fixture du prompt A (seul prompt capturé
   * par les scripts probe). Ce champ permet à l'UI de signaler "fixture A"
   * sur les cartes B/C pour ne pas faire croire qu'une vraie génération a eu lieu.
   */
  replayedFromVariant?: 'A'
}

export type ProviderErrorCode =
  | 'unauthorized'
  | 'rate_limited'
  | 'invalid_request'
  | 'server_error'
  | 'timeout'
  | 'aborted'
  | 'unknown'

export class ProviderError extends Error {
  constructor(
    public readonly code: ProviderErrorCode,
    message: string,
    public readonly status?: number,
    cause?: unknown,
  ) {
    super(message, cause !== undefined ? { cause } : undefined)
    this.name = 'ProviderError'
  }
}

export interface ImageGenerator {
  modelId: string
  source: ProviderSource
  capabilities: {
    seed: boolean
    editing: boolean
    imageToImage: boolean
  }
  pricePerImage: number
  generate(input: GenerateInput, signal: AbortSignal, apiKey: string | null): Promise<GenerateOutput>
}
