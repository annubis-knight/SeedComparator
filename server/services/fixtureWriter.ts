import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { createHash } from 'node:crypto'
import type { ProviderSource } from '../providers/types'
import { createLogger } from '../utils/logger'

const log = createLogger('fixtureWriter')

export const DEFAULT_FIXTURES_ROOT = join(process.cwd(), 'tests', 'fixtures')

export interface FixtureInput {
  modelId: string
  source: ProviderSource
  scenario?: string  // défaut 'nominal'
  input: { prompt: string; ratio: string }
  http: { status: number; body: unknown }
  expected: { mime: string; costUsd: number; seed: number | null }
  imageBuffer: Buffer
}

export interface FixtureFile {
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

export interface FixtureRef {
  source: ProviderSource
  modelId: string
  scenario?: string
}

export interface FixtureOptions {
  fixturesRoot?: string
}

function resolvePaths(ref: FixtureRef, opts?: FixtureOptions) {
  const root = opts?.fixturesRoot ?? DEFAULT_FIXTURES_ROOT
  const scenario = ref.scenario ?? 'nominal'
  const dir = join(root, 'providers', ref.source, ref.modelId)
  return {
    dir,
    jsonPath: join(dir, `${scenario}.json`),
    pngPath: join(dir, `${scenario}.png`),
  }
}

function sha256(buf: Buffer): string {
  return createHash('sha256').update(buf).digest('hex')
}

export function writeFixture(
  input: FixtureInput,
  opts?: FixtureOptions,
): { jsonPath: string; pngPath: string } {
  const ref: FixtureRef = { source: input.source, modelId: input.modelId, scenario: input.scenario }
  const { dir, jsonPath, pngPath } = resolvePaths(ref, opts)

  log.debug(`writeFixture model="${input.modelId}" source=${input.source} scenario=${ref.scenario ?? 'nominal'}`)
  log.debug(`  dir="${dir}"`)

  mkdirSync(dir, { recursive: true })

  const fixture: FixtureFile = {
    modelId: input.modelId,
    source: input.source,
    scenario: input.scenario ?? 'nominal',
    input: input.input,
    http: input.http,
    expected: {
      mime: input.expected.mime,
      costUsd: input.expected.costUsd,
      seed: input.expected.seed,
      imagePngSha256: sha256(input.imageBuffer),
    },
    capturedAt: new Date().toISOString(),
  }

  writeFileSync(jsonPath, JSON.stringify(fixture, null, 2), 'utf-8')
  writeFileSync(pngPath, input.imageBuffer)

  log.info(`fixture written model="${input.modelId}" json=${jsonPath} png=${pngPath} bytes=${input.imageBuffer.length}`)
  return { jsonPath, pngPath }
}

export function fixtureExists(ref: FixtureRef, opts?: FixtureOptions): boolean {
  const { jsonPath, pngPath } = resolvePaths(ref, opts)
  const ok = existsSync(jsonPath) && existsSync(pngPath)
  log.debug(`fixtureExists model="${ref.modelId}" source=${ref.source} → ${ok}`)
  return ok
}

export function readFixture(ref: FixtureRef, opts?: FixtureOptions): FixtureFile | null {
  const { jsonPath } = resolvePaths(ref, opts)
  if (!existsSync(jsonPath)) return null
  try {
    return JSON.parse(readFileSync(jsonPath, 'utf-8')) as FixtureFile
  } catch (err) {
    log.error(`failed to parse fixture ${jsonPath}`, err)
    return null
  }
}

/**
 * Liste les modèles ayant une fixture présente, retournés sous forme `<source>/<modelId>`.
 * Utilisé par l'endpoint fixture-status pour afficher des badges.
 */
export function listFixtureRefs(opts?: FixtureOptions): FixtureRef[] {
  const root = opts?.fixturesRoot ?? DEFAULT_FIXTURES_ROOT
  const providersDir = join(root, 'providers')
  if (!existsSync(providersDir)) return []
  // lecture lazy : on délègue à readdirSync, mais sans dépendance externe.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { readdirSync } = require('node:fs') as typeof import('node:fs')
  const refs: FixtureRef[] = []
  for (const source of readdirSync(providersDir, { withFileTypes: true })) {
    if (!source.isDirectory()) continue
    const sourceDir = join(providersDir, source.name)
    for (const model of readdirSync(sourceDir, { withFileTypes: true })) {
      if (!model.isDirectory()) continue
      if (fixtureExists({ source: source.name as ProviderSource, modelId: model.name }, opts)) {
        refs.push({ source: source.name as ProviderSource, modelId: model.name })
      }
    }
  }
  // dirname pour silence du linter unused
  void dirname
  return refs
}
