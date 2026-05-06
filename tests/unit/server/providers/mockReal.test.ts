import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import { createMockRealGenerator } from '../../../../server/providers/mockReal'
import { ProviderError } from '../../../../server/providers/types'

// PNG 4x4 transparent valide
const PNG = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000040000000408060000007a01a01b0000001349444154789c62fcffff3f0306200d030000ffff03000005000186a063900000000049454e44ae426082',
  'hex',
)

function sha256(buf: Buffer): string {
  return createHash('sha256').update(buf).digest('hex')
}

describe('mockReal generator', () => {
  let rootDir: string
  let modelDir: string

  beforeEach(() => {
    rootDir = mkdtempSync(join(tmpdir(), 'fixtures-'))
    modelDir = join(rootDir, 'providers', 'openai', 'gpt-image-1')
    mkdirSync(modelDir, { recursive: true })
  })

  afterEach(() => {
    rmSync(rootDir, { recursive: true, force: true })
  })

  // @requirement: FR-061
  it('rejoue une fixture présente avec le rawResponse intact', async () => {
    const rawResponse = { data: [{ b64_json: '<stripped>' }], created: 1234, model: 'gpt-image-1' }
    writeFileSync(join(modelDir, 'nominal.json'), JSON.stringify({
      modelId: 'gpt-image-1',
      source: 'openai',
      scenario: 'nominal',
      input: { prompt: 'test', ratio: '1:1' },
      http: { status: 200, body: rawResponse },
      expected: {
        mime: 'image/png',
        costUsd: 0.04,
        seed: null,
        imagePngSha256: sha256(PNG),
      },
      capturedAt: '2026-05-02T10:00:00.000Z',
    }))
    writeFileSync(join(modelDir, 'nominal.png'), PNG)

    const g = createMockRealGenerator({
      modelId: 'gpt-image-1',
      source: 'openai',
      pricePerImage: 0.04,
      supportsSeed: false,
      fixturesRoot: rootDir,
    })

    const out = await g.generate({ prompt: 'anything', ratio: '1:1' }, new AbortController().signal, null)

    expect(out.modelId).toBe('gpt-image-1')
    expect(out.source).toBe('openai')
    expect(out.mime).toBe('image/png')
    expect(out.costUsd).toBe(0.04)
    expect(out.seed).toBe(null)
    expect(out.imageBuffer.equals(PNG)).toBe(true)
    expect(out.rawResponse).toEqual(rawResponse)
  })

  // @requirement: FR-061
  it('renvoie une ProviderError invalid_request si la fixture est absente', async () => {
    const g = createMockRealGenerator({
      modelId: 'gpt-image-1',
      source: 'openai',
      pricePerImage: 0.04,
      supportsSeed: false,
      fixturesRoot: rootDir,
    })

    await expect(
      g.generate({ prompt: 'p', ratio: '1:1' }, new AbortController().signal, null),
    ).rejects.toMatchObject({ code: 'invalid_request' })
  })

  // @requirement: FR-061
  it('renvoie une ProviderError si le PNG voisin est absent', async () => {
    writeFileSync(join(modelDir, 'nominal.json'), JSON.stringify({
      modelId: 'gpt-image-1',
      source: 'openai',
      scenario: 'nominal',
      input: { prompt: 'test', ratio: '1:1' },
      http: { status: 200, body: {} },
      expected: { mime: 'image/png', costUsd: 0.04, seed: null, imagePngSha256: sha256(PNG) },
      capturedAt: '2026-05-02T10:00:00.000Z',
    }))

    const g = createMockRealGenerator({
      modelId: 'gpt-image-1',
      source: 'openai',
      pricePerImage: 0.04,
      supportsSeed: false,
      fixturesRoot: rootDir,
    })

    await expect(
      g.generate({ prompt: 'p', ratio: '1:1' }, new AbortController().signal, null),
    ).rejects.toBeInstanceOf(ProviderError)
  })

  // @requirement: FR-061
  it('renvoie une ProviderError si le sha256 du PNG ne correspond pas à la fixture', async () => {
    writeFileSync(join(modelDir, 'nominal.json'), JSON.stringify({
      modelId: 'gpt-image-1',
      source: 'openai',
      scenario: 'nominal',
      input: { prompt: 'test', ratio: '1:1' },
      http: { status: 200, body: {} },
      expected: {
        mime: 'image/png',
        costUsd: 0.04,
        seed: null,
        imagePngSha256: 'deadbeef'.repeat(8), // mauvais hash
      },
      capturedAt: '2026-05-02T10:00:00.000Z',
    }))
    writeFileSync(join(modelDir, 'nominal.png'), PNG)

    const g = createMockRealGenerator({
      modelId: 'gpt-image-1',
      source: 'openai',
      pricePerImage: 0.04,
      supportsSeed: false,
      fixturesRoot: rootDir,
    })

    await expect(
      g.generate({ prompt: 'p', ratio: '1:1' }, new AbortController().signal, null),
    ).rejects.toMatchObject({ code: 'invalid_request' })
  })

  // @requirement: FR-061
  it('ne lit jamais la clé API (apiKey ignoré)', async () => {
    const rawResponse = { foo: 'bar' }
    writeFileSync(join(modelDir, 'nominal.json'), JSON.stringify({
      modelId: 'gpt-image-1',
      source: 'openai',
      scenario: 'nominal',
      input: { prompt: 'test', ratio: '1:1' },
      http: { status: 200, body: rawResponse },
      expected: { mime: 'image/png', costUsd: 0.04, seed: null, imagePngSha256: sha256(PNG) },
      capturedAt: '2026-05-02T10:00:00.000Z',
    }))
    writeFileSync(join(modelDir, 'nominal.png'), PNG)

    const g = createMockRealGenerator({
      modelId: 'gpt-image-1',
      source: 'openai',
      pricePerImage: 0.04,
      supportsSeed: false,
      fixturesRoot: rootDir,
    })

    // apiKey null doit fonctionner sans erreur, comme avec une vraie clé
    const out = await g.generate({ prompt: 'p', ratio: '1:1' }, new AbortController().signal, null)
    expect(out.rawResponse).toEqual(rawResponse)
  })
})
