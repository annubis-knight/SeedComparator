import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, readFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import {
  writeFixture,
  fixtureExists,
  readFixture,
  type FixtureInput,
} from '../../../../server/services/fixtureWriter'

const PNG = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000040000000408060000007a01a01b0000001349444154789c62fcffff3f0306200d030000ffff03000005000186a063900000000049454e44ae426082',
  'hex',
)

const sha256 = (b: Buffer) => createHash('sha256').update(b).digest('hex')

const baseInput = (modelId: string): FixtureInput => ({
  modelId,
  source: 'openai',
  scenario: 'nominal',
  input: { prompt: 'a test prompt', ratio: '1:1' },
  http: { status: 200, body: { data: [{ b64_json: '<stripped>' }], created: 1234 } },
  expected: { mime: 'image/png', costUsd: 0.04, seed: null },
  imageBuffer: PNG,
})

describe('fixtureWriter', () => {
  let root: string

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'fw-'))
  })

  afterEach(() => {
    rmSync(root, { recursive: true, force: true })
  })

  // @requirement: FR-062
  it('write() crée le dossier + JSON + PNG', () => {
    const path = writeFixture(baseInput('gpt-image-1'), { fixturesRoot: root })
    expect(existsSync(path.jsonPath)).toBe(true)
    expect(existsSync(path.pngPath)).toBe(true)

    const json = JSON.parse(readFileSync(path.jsonPath, 'utf-8'))
    expect(json.modelId).toBe('gpt-image-1')
    expect(json.source).toBe('openai')
    expect(json.expected.imagePngSha256).toBe(sha256(PNG))
    expect(typeof json.capturedAt).toBe('string')

    const png = readFileSync(path.pngPath)
    expect(png.equals(PNG)).toBe(true)
  })

  // @requirement: FR-062
  it('exists() renvoie true seulement si JSON ET PNG sont présents', () => {
    expect(fixtureExists({ source: 'openai', modelId: 'gpt-image-1' }, { fixturesRoot: root })).toBe(false)
    writeFixture(baseInput('gpt-image-1'), { fixturesRoot: root })
    expect(fixtureExists({ source: 'openai', modelId: 'gpt-image-1' }, { fixturesRoot: root })).toBe(true)
  })

  // @requirement: FR-062
  it('write() écrase la fixture existante (overwrite implicite)', () => {
    writeFixture(baseInput('gpt-image-1'), { fixturesRoot: root })
    const next: FixtureInput = {
      ...baseInput('gpt-image-1'),
      input: { prompt: 'updated prompt', ratio: '16:9' },
    }
    writeFixture(next, { fixturesRoot: root })
    const fixture = readFixture({ source: 'openai', modelId: 'gpt-image-1' }, { fixturesRoot: root })!
    expect(fixture.input.prompt).toBe('updated prompt')
    expect(fixture.input.ratio).toBe('16:9')
  })

  // @requirement: FR-062
  it('readFixture() round-trip identique', () => {
    writeFixture(baseInput('gpt-image-1'), { fixturesRoot: root })
    const fixture = readFixture({ source: 'openai', modelId: 'gpt-image-1' }, { fixturesRoot: root })
    expect(fixture).not.toBeNull()
    expect(fixture!.modelId).toBe('gpt-image-1')
    expect(fixture!.expected.imagePngSha256).toBe(sha256(PNG))
  })

  // @requirement: FR-062
  it('readFixture() renvoie null si absente', () => {
    expect(readFixture({ source: 'openai', modelId: 'nope' }, { fixturesRoot: root })).toBeNull()
  })
})
