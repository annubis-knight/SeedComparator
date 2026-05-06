import type { GenerateInput, GenerateOutput, ImageGenerator, ProviderSource } from './types'
import { ProviderError } from './types'
import { createLogger } from '../utils/logger'

const log = createLogger('mock')

// PNG 4x4 transparent valide (signature + IHDR + IDAT + IEND minimal)
const PNG_PLACEHOLDER = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000040000000408060000007a01a01b0000001349444154789c62fcffff3f0306200d030000ffff03000005000186a063900000000049454e44ae426082',
  'hex',
)

export interface MockOptions {
  modelId: string
  source: ProviderSource
  pricePerImage: number
  supportsSeed: boolean
  latencyMs?: number
  failureRate?: number // 0..1
  failureCode?: 'unauthorized' | 'rate_limited' | 'server_error' | 'timeout'
}

export function createMockGenerator(opts: MockOptions): ImageGenerator {
  return {
    modelId: opts.modelId,
    source: opts.source,
    capabilities: { seed: opts.supportsSeed, editing: false, imageToImage: false },
    pricePerImage: opts.pricePerImage,
    async generate(input: GenerateInput, signal: AbortSignal, _apiKey: string | null): Promise<GenerateOutput> {
      const latency = opts.latencyMs ?? 200 + Math.random() * 800
      log.debug(`generate() start model="${opts.modelId}" latency=${Math.round(latency)}ms`)
      await new Promise<void>((res, rej) => {
        const t = setTimeout(res, latency)
        signal.addEventListener('abort', () => {
          clearTimeout(t)
          log.warn(`aborted model="${opts.modelId}"`)
          rej(new ProviderError('aborted', 'Generation aborted'))
        }, { once: true })
      })

      if (opts.failureRate && Math.random() < opts.failureRate) {
        log.warn(`simulated failure model="${opts.modelId}" code=${opts.failureCode ?? 'server_error'}`)
        throw new ProviderError(opts.failureCode ?? 'server_error', `Mock failure for ${opts.modelId}`)
      }

      log.info(`generate() success model="${opts.modelId}" (mock)`)
      return {
        imageBuffer: PNG_PLACEHOLDER,
        mime: 'image/png',
        modelId: opts.modelId,
        source: opts.source,
        seed: opts.supportsSeed ? (input.seed ?? Math.floor(Math.random() * 1_000_000)) : null,
        costUsd: opts.pricePerImage,
        rawResponse: { mock: true, prompt: input.prompt, ratio: input.ratio },
      }
    },
  }
}
