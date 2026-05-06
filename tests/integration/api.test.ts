import { describe, it, expect } from 'vitest'
import { setup, $fetch, url } from '@nuxt/test-utils/e2e'
import { fileURLToPath } from 'node:url'
import { mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { createHash } from 'node:crypto'

await setup({
  rootDir: fileURLToPath(new URL('../..', import.meta.url)),
  server: true,
  browser: false,
})

describe('API integration (Nuxt + Nitro live)', () => {
  // @requirement: FR-031
  it('GET /api/models retourne les modèles seedés', async () => {
    const data = await $fetch<{ models: any[] }>('/api/models')
    expect(Array.isArray(data.models)).toBe(true)
    expect(data.models.length).toBeGreaterThan(0)
  })

  // @requirement: FR-064
  it('GET /api/models renvoie un champ hasFixture booléen pour chaque modèle', async () => {
    const data = await $fetch<{ models: any[] }>('/api/models')
    for (const m of data.models) {
      expect(typeof m.hasFixture).toBe('boolean')
    }
  })

  // @requirement: FR-010
  it('POST /api/estimate calcule le coût', async () => {
    const data = await $fetch<any>('/api/estimate', {
      method: 'POST',
      body: { prompts: ['p1', 'p2'], modelIds: (await $fetch<{models:any[]}>('/api/models')).models.slice(0,2).map(m=>m.id) },
    })
    expect(data.generations).toBeGreaterThan(0)
    expect(typeof data.totalUsd).toBe('number')
  })

  // @requirement: FR-024
  it('GET /api/stats/month retourne un total numérique', async () => {
    const data = await $fetch<{ totalUsd: number }>('/api/stats/month')
    expect(typeof data.totalUsd).toBe('number')
  })

  // @requirement: FR-001, NFR-001
  it('PUT /api/settings/keys accepte une clé valide', async () => {
    const data = await $fetch<any>('/api/settings/keys', {
      method: 'PUT',
      body: { providerId: 'openrouter', apiKey: 'sk-test' },
    })
    expect(data.ok).toBe(true)
  })

  // @requirement: FR-065
  it('GET /api/settings/keys expose envLoaded[] (clés chargées depuis .env au boot)', async () => {
    const data = await $fetch<{ providers: string[]; envLoaded: string[] }>('/api/settings/keys')
    expect(Array.isArray(data.envLoaded)).toBe(true)
    // Tous les éléments de envLoaded sont aussi dans providers (cohérence)
    for (const p of data.envLoaded) {
      expect(data.providers).toContain(p)
    }
  })

  // ───────────────────────────────────────────────────────────────────────────
  // EPIC-14 — endpoints test des modèles + fixture-status
  // ───────────────────────────────────────────────────────────────────────────

  // @requirement: FR-062
  it('POST /api/models/test rejette un payload invalide (400)', async () => {
    const res = await fetch(url('/api/models/test'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ modelId: '', prompt: '' }), // empty modelId/prompt
    })
    expect(res.status).toBe(400)
  })

  // @requirement: FR-062
  it('POST /api/models/test renvoie 404 si modelId inconnu', async () => {
    const res = await fetch(url('/api/models/test'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ modelId: 'does-not-exist', prompt: 'test', ratio: '1:1' }),
    })
    expect(res.status).toBe(404)
  })

  // @requirement: FR-062 — chemin "fixture déjà présente" (no API call required)
  it('POST /api/models/test renvoie 409 si fixture existe et overwrite=false', async () => {
    const models = await $fetch<{ models: any[] }>('/api/models')
    const m = models.models[0]!
    // Crée une fixture factice côté FS pour déclencher le conflit. La source
    // utilisée par fixture-status / mock-real est le providerId (cf. registry).
    const fixturesRoot = fileURLToPath(new URL('../../tests/fixtures/providers', import.meta.url))
    const dir = join(fixturesRoot, m.providerId, m.id)
    mkdirSync(dir, { recursive: true })
    const PNG = Buffer.from('89504e470d0a1a0a0000000d49484452000000040000000408060000007a01a01b0000001349444154789c62fcffff3f0306200d030000ffff03000005000186a063900000000049454e44ae426082', 'hex')
    const sha = createHash('sha256').update(PNG).digest('hex')
    writeFileSync(join(dir, 'nominal.json'), JSON.stringify({
      modelId: m.id, source: m.providerId, scenario: 'nominal',
      input: { prompt: 'old', ratio: '1:1' },
      http: { status: 200, body: {} },
      expected: { mime: 'image/png', costUsd: 0.01, seed: null, imagePngSha256: sha },
      capturedAt: new Date().toISOString(),
    }))
    writeFileSync(join(dir, 'nominal.png'), PNG)

    try {
      const res = await fetch(url('/api/models/test'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId: m.id, prompt: 'test', ratio: '1:1', overwrite: false }),
      })
      expect(res.status).toBe(409)
      const body = await res.json()
      expect(body.status).toBe('fixture_exists')
      expect(body.modelId).toBe(m.id)
    } finally {
      // Cleanup pour ne pas polluer les autres tests / le repo
      rmSync(dir, { recursive: true, force: true })
    }
  })

  // @requirement: FR-062
  it('GET /api/models/fixture-status retourne un mapping par modelId', async () => {
    const data = await $fetch<{ fixtures: Record<string, { hasFixture: boolean; source: string }> }>('/api/models/fixture-status')
    expect(typeof data.fixtures).toBe('object')
    const keys = Object.keys(data.fixtures)
    expect(keys.length).toBeGreaterThan(0)
    // Chaque entrée a la forme attendue
    const sample = data.fixtures[keys[0]!]!
    expect(typeof sample.hasFixture).toBe('boolean')
    expect(typeof sample.source).toBe('string')
  })

  // @requirement: FR-063
  it('PUT /api/settings rejette une valeur provider.mode invalide (400)', async () => {
    const res = await fetch(url('/api/settings'), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'provider.mode', value: 'banana' }),
    })
    expect(res.status).toBe(400)
  })

  // @requirement: FR-063
  it('PUT /api/settings accepte les 3 valeurs valides de provider.mode', async () => {
    for (const v of ['mock', 'mock-real', 'live']) {
      const res = await fetch(url('/api/settings'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'provider.mode', value: v }),
      })
      expect(res.ok, `value=${v} should be accepted`).toBe(true)
    }
  })

  // @requirement: FR-066 — DELETE session + cascade generations
  it('DELETE /api/sessions/[id] supprime la session (404 si inexistante)', async () => {
    // Cas 404 — id inexistant
    const res404 = await fetch(url('/api/sessions/__nope__'), { method: 'DELETE' })
    expect(res404.status).toBe(404)

    // Cas 200 — crée une session minimale via POST /api/generate puis la supprime
    const models = await $fetch<{ models: any[] }>('/api/models')
    const modelIds = models.models.slice(0, 1).map((m) => m.id)
    const genRes = await fetch(url('/api/generate'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompts: ['delete-me'], modelIds, ratio: 'native' }),
    })
    // On consomme le stream pour récupérer le sessionId
    const reader = genRes.body!.getReader()
    const decoder = new TextDecoder()
    let text = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      text += decoder.decode(value, { stream: true })
    }
    const sessionMatch = text.match(/event: session\ndata: (\{[^\n]+\})/)
    expect(sessionMatch).not.toBeNull()
    const sessionId = JSON.parse(sessionMatch![1]!).sessionId as string
    expect(typeof sessionId).toBe('string')

    const delRes = await $fetch<{ ok: boolean; id: string }>(`/api/sessions/${sessionId}`, { method: 'DELETE' })
    expect(delRes.ok).toBe(true)
    expect(delRes.id).toBe(sessionId)

    // Suppression idempotente : 2nd appel renvoie 404
    const res404b = await fetch(url(`/api/sessions/${sessionId}`), { method: 'DELETE' })
    expect(res404b.status).toBe(404)
  }, 25_000)

  // @requirement: FR-013, FR-025
  it('POST /api/generate (mock mode) crée une session et stream les résultats', async () => {
    const models = await $fetch<{ models: any[] }>('/api/models')
    const modelIds = models.models.slice(0, 2).map((m) => m.id)

    const res = await fetch(url('/api/generate'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompts: ['test prompt'], modelIds, ratio: 'native' }),
    })
    expect(res.ok).toBe(true)
    const reader = res.body!.getReader()
    const decoder = new TextDecoder()
    let text = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      text += decoder.decode(value, { stream: true })
    }
    expect(text).toContain('event: session')
    expect(text).toContain('event: result')
    expect(text).toContain('event: done')
  }, 20_000)
})
