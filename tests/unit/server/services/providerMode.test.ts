import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock prisma client AVANT d'importer le service
const findUniqueMock = vi.fn()
vi.mock('../../../../server/db/client', () => ({
  prisma: {
    setting: { findUnique: (...args: unknown[]) => findUniqueMock(...args) },
  },
}))

// Mock useRuntimeConfig (auto-importé par Nuxt). Le default global est dans setup,
// on l'override par test.
let mockedConfig: { providersMode?: string; providersMockMode?: boolean } = {}
// @ts-expect-error
globalThis.useRuntimeConfig = () => mockedConfig

import { getProviderMode } from '../../../../server/services/providerMode'

describe('getProviderMode (cascade DB > env > live)', () => {
  beforeEach(() => {
    findUniqueMock.mockReset()
    mockedConfig = {}
  })

  // @requirement: FR-063
  it('renvoie la valeur DB si setting valide présent', async () => {
    findUniqueMock.mockResolvedValueOnce({ key: 'provider.mode', value: 'mock-real' })
    mockedConfig = { providersMode: 'live' }
    expect(await getProviderMode()).toBe('mock-real')
  })

  // @requirement: FR-063
  it('ignore une valeur DB invalide et tombe sur env', async () => {
    findUniqueMock.mockResolvedValueOnce({ key: 'provider.mode', value: 'banana' })
    mockedConfig = { providersMode: 'mock' }
    expect(await getProviderMode()).toBe('mock')
  })

  // @requirement: FR-063
  it("renvoie 'live' par défaut si ni DB ni env définis", async () => {
    findUniqueMock.mockResolvedValueOnce(null)
    mockedConfig = {}
    expect(await getProviderMode()).toBe('live')
  })

  // @requirement: FR-063
  it("traite la legacy PROVIDERS_MOCK_MODE=true comme 'mock'", async () => {
    findUniqueMock.mockResolvedValueOnce(null)
    mockedConfig = { providersMode: '', providersMockMode: true }
    expect(await getProviderMode()).toBe('mock')
  })

  // @requirement: FR-063
  it('résiste à une erreur DB (timeout) et tombe sur env', async () => {
    findUniqueMock.mockRejectedValueOnce(new Error('connection refused'))
    mockedConfig = { providersMode: 'mock-real' }
    expect(await getProviderMode()).toBe('mock-real')
  })
})
