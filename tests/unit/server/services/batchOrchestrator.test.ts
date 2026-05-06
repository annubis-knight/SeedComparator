import { describe, it, expect, vi } from 'vitest'
import { runBatch, type BatchTask } from '../../../../server/services/batchOrchestrator'
import type { ImageGenerator, GenerateOutput } from '../../../../server/providers/types'
import { ProviderError } from '../../../../server/providers/types'

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47])

function makeGen(modelId: string, behavior: 'ok' | 'fail' | 'slow' | 'abort', latency = 50): ImageGenerator {
  return {
    modelId,
    source: 'fal',
    capabilities: { seed: true, editing: false, imageToImage: false },
    pricePerImage: 0.01,
    async generate(_input, signal): Promise<GenerateOutput> {
      await new Promise<void>((res, rej) => {
        const t = setTimeout(res, latency)
        signal.addEventListener('abort', () => { clearTimeout(t); rej(new ProviderError('aborted', 'aborted')) }, { once: true })
      })
      if (behavior === 'fail') throw new ProviderError('server_error', 'mock failure')
      if (behavior === 'slow') await new Promise((r) => setTimeout(r, latency))
      return { imageBuffer: PNG, mime: 'image/png', modelId, source: 'fal', seed: 42, costUsd: 0.01, rawResponse: {} }
    },
  }
}

function makeTask(modelId: string, gen: ImageGenerator, idx = 0): BatchTask {
  return { taskId: `${idx}-${modelId}`, promptIdx: idx, prompt: 'p', modelId, generator: gen, apiKey: null }
}

describe('batchOrchestrator', () => {
  // @requirement: FR-012
  it('exécute toutes les tâches en succès', async () => {
    const tasks = [makeTask('a', makeGen('a', 'ok')), makeTask('b', makeGen('b', 'ok'))]
    const results: any[] = []
    await runBatch(tasks, {
      ratio: 'native',
      signal: new AbortController().signal,
      onResult: (id, r) => results.push({ id, status: r.status }),
    })
    expect(results).toHaveLength(2)
    expect(results.every((r) => r.status === 'success')).toBe(true)
  })

  // @requirement: FR-016
  it('isole les échecs : un échec ne casse pas les autres', async () => {
    const tasks = [
      makeTask('ok', makeGen('ok', 'ok')),
      makeTask('fail', makeGen('fail', 'fail')),
      makeTask('ok2', makeGen('ok2', 'ok')),
    ]
    const results: Record<string, string> = {}
    await runBatch(tasks, {
      ratio: 'native',
      signal: new AbortController().signal,
      onResult: (id, r) => { results[id] = r.status },
    })
    expect(results['0-ok']).toBe('success')
    expect(results['0-fail']).toBe('failed')
    expect(results['0-ok2']).toBe('success')
  })

  // @requirement: FR-014
  it('annule les requêtes en vol via AbortController', async () => {
    const ctrl = new AbortController()
    const tasks = Array.from({ length: 5 }, (_, i) => makeTask(`m${i}`, makeGen(`m${i}`, 'slow', 200), i))
    const results: string[] = []
    setTimeout(() => ctrl.abort(), 30)
    await runBatch(tasks, {
      ratio: 'native',
      signal: ctrl.signal,
      onResult: (_id, r) => results.push(r.status),
    })
    expect(results.length).toBe(5)
    expect(results.some((s) => s === 'aborted')).toBe(true)
  })

  // @requirement: FR-012
  it('respecte la concurrence limitée', async () => {
    let active = 0
    let maxActive = 0
    const make = (id: string): ImageGenerator => ({
      modelId: id,
      source: 'fal',
      capabilities: { seed: false, editing: false, imageToImage: false },
      pricePerImage: 0.01,
      async generate() {
        active++
        maxActive = Math.max(maxActive, active)
        await new Promise((r) => setTimeout(r, 50))
        active--
        return { imageBuffer: PNG, mime: 'image/png', modelId: id, source: 'fal', seed: null, costUsd: 0.01, rawResponse: {} }
      },
    })
    const tasks = Array.from({ length: 6 }, (_, i) => makeTask(`m${i}`, make(`m${i}`), i))
    await runBatch(tasks, {
      concurrency: 2,
      ratio: 'native',
      signal: new AbortController().signal,
      onResult: () => {},
    })
    expect(maxActive).toBeLessThanOrEqual(2)
  })

  // @requirement: FR-015
  it('ne fait aucun retry automatique', async () => {
    const generate = vi.fn(async () => { throw new ProviderError('rate_limited', '429') })
    const gen: ImageGenerator = {
      modelId: 'x',
      source: 'fal',
      capabilities: { seed: false, editing: false, imageToImage: false },
      pricePerImage: 0.01,
      generate,
    }
    await runBatch([makeTask('x', gen)], {
      ratio: 'native',
      signal: new AbortController().signal,
      onResult: () => {},
    })
    expect(generate).toHaveBeenCalledTimes(1)
  })
})
