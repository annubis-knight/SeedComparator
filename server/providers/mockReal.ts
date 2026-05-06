import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import type { GenerateInput, GenerateOutput, ImageGenerator, ProviderSource } from './types'
import { ProviderError } from './types'
import { createLogger } from '../utils/logger'

const log = createLogger('mock-real')

export interface MockRealOptions {
  modelId: string
  source: ProviderSource
  pricePerImage: number
  supportsSeed: boolean
  /**
   * Racine des fixtures. En runtime Nitro, c'est `<projectRoot>/tests/fixtures`.
   * Surchargeable pour les tests unitaires.
   */
  fixturesRoot: string
  /** Scénario à charger. V1 : `nominal` uniquement. */
  scenario?: string
}

interface FixtureFile {
  modelId: string
  source: ProviderSource
  scenario: string
  input: { prompt: string; ratio: string }
  http: { status: number; body: unknown }
  expected: {
    mime: string
    costUsd: number
    seed: number | null
    imagePngSha256: string
  }
  capturedAt: string
}

function resolveFixturePath(opts: MockRealOptions): { jsonPath: string; pngPath: string } {
  const scenario = opts.scenario ?? 'nominal'
  const dir = join(opts.fixturesRoot, 'providers', opts.source, opts.modelId)
  return {
    jsonPath: join(dir, `${scenario}.json`),
    pngPath: join(dir, `${scenario}.png`),
  }
}

function sha256(buf: Buffer): string {
  return createHash('sha256').update(buf).digest('hex')
}

export function createMockRealGenerator(opts: MockRealOptions): ImageGenerator {
  return {
    modelId: opts.modelId,
    source: opts.source,
    capabilities: { seed: opts.supportsSeed, editing: false, imageToImage: false },
    pricePerImage: opts.pricePerImage,
    async generate(input: GenerateInput, signal: AbortSignal, _apiKey: string | null): Promise<GenerateOutput> {
      const { jsonPath, pngPath } = resolveFixturePath(opts)
      log.debug(`generate() start model="${opts.modelId}" source=${opts.source} scenario=${opts.scenario ?? 'nominal'}`)
      log.debug(`  resolve json="${jsonPath}"`)
      log.debug(`  resolve png="${pngPath}"`)

      if (signal.aborted) {
        log.warn(`aborted before fixture load model="${opts.modelId}"`)
        throw new ProviderError('aborted', 'Generation aborted')
      }

      if (!existsSync(jsonPath)) {
        log.error(`fixture json missing path="${jsonPath}"`)
        throw new ProviderError(
          'invalid_request',
          `mock-real: fixture not found for model="${opts.modelId}" source=${opts.source}. Capture-la d'abord depuis /models/test (mode live).`,
        )
      }

      let parsed: FixtureFile
      try {
        const raw = readFileSync(jsonPath, 'utf-8')
        parsed = JSON.parse(raw) as FixtureFile
      } catch (err) {
        log.error(`fixture json parse error path="${jsonPath}"`, err)
        throw new ProviderError('invalid_request', `mock-real: failed to parse fixture json at ${jsonPath}`, undefined, err)
      }

      if (!existsSync(pngPath)) {
        log.error(`fixture png missing path="${pngPath}"`)
        throw new ProviderError('invalid_request', `mock-real: png missing alongside json at ${pngPath}`)
      }

      const png = readFileSync(pngPath)
      const actualSha = sha256(png)
      if (actualSha !== parsed.expected.imagePngSha256) {
        log.error(`fixture png sha256 mismatch model="${opts.modelId}" expected=${parsed.expected.imagePngSha256.slice(0, 12)}… actual=${actualSha.slice(0, 12)}…`)
        throw new ProviderError(
          'invalid_request',
          `mock-real: png sha256 mismatch for model="${opts.modelId}". Re-capture la fixture.`,
        )
      }

      log.info(`generate() success (replay) model="${opts.modelId}" bytes=${png.length} sha256=${actualSha.slice(0, 12)}…`)

      return {
        imageBuffer: png,
        mime: parsed.expected.mime,
        modelId: opts.modelId,
        source: opts.source,
        seed: parsed.expected.seed,
        costUsd: parsed.expected.costUsd,
        rawResponse: parsed.http.body,
        // STORY-104 — fixture toujours capturée sur prompt A (cf. probe scripts).
        // L'UI affiche un badge "fixture A" pour signaler le replay.
        replayedFromVariant: 'A',
      }
    },
  }
}
