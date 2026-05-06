import { describe, it, expect } from 'vitest'
import { createMockGenerator } from '../../../../server/providers/mock'

describe('mock generator', () => {
  // @requirement: FR-013
  it('retourne un Buffer PNG valide', async () => {
    const g = createMockGenerator({ modelId: 'm', source: 'fal', pricePerImage: 0.01, supportsSeed: true, latencyMs: 10 })
    const out = await g.generate({ prompt: 'p', ratio: '1:1' }, new AbortController().signal, null)
    expect(Buffer.isBuffer(out.imageBuffer)).toBe(true)
    expect(out.imageBuffer.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a')
  })

  // @requirement: FR-014
  it('respecte le signal abort', async () => {
    const g = createMockGenerator({ modelId: 'm', source: 'fal', pricePerImage: 0.01, supportsSeed: false, latencyMs: 200 })
    const ctrl = new AbortController()
    const p = g.generate({ prompt: 'p', ratio: '1:1' }, ctrl.signal, null)
    setTimeout(() => ctrl.abort(), 20)
    await expect(p).rejects.toMatchObject({ code: 'aborted' })
  })
})
