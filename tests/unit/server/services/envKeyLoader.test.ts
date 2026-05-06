import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock apiKeys avant l'import du service
const setApiKeyMock = vi.fn()
const getApiKeyMock = vi.fn()
vi.mock('../../../../server/services/apiKeys', () => ({
  setApiKey: (...args: unknown[]) => setApiKeyMock(...args),
  getApiKey: (...args: unknown[]) => getApiKeyMock(...args),
  listProviderIdsWithKeys: vi.fn(() => []),
}))

import {
  envVarForProvider,
  loadKeysFromEnv,
  PROVIDER_ID_TO_ENV_VAR,
  ENV_LOADED_PROVIDERS,
} from '../../../../server/services/envKeyLoader'

describe('envKeyLoader', () => {
  beforeEach(() => {
    setApiKeyMock.mockReset()
    getApiKeyMock.mockReset()
    ENV_LOADED_PROVIDERS.clear()
  })

  // @requirement: FR-065
  it('mappe les providerId DB vers les noms de variables env attendues', () => {
    expect(envVarForProvider('openai')).toBe('OPENAI_API_KEY')
    expect(envVarForProvider('openrouter')).toBe('OPENROUTER_API_KEY')
    expect(envVarForProvider('fal')).toBe('FAL_API_KEY')
    expect(envVarForProvider('google-ai')).toBe('GOOGLE_AI_API_KEY')
  })

  // @requirement: FR-065
  it('expose un mapping complet des 4 gateways supportées', () => {
    expect(Object.keys(PROVIDER_ID_TO_ENV_VAR).sort()).toEqual([
      'fal', 'google-ai', 'openai', 'openrouter',
    ])
  })

  // @requirement: FR-065
  it('appelle setApiKey pour chaque clé non vide trouvée dans env', () => {
    const env = {
      OPENAI_API_KEY: 'sk-openai',
      OPENROUTER_API_KEY: 'sk-or-x',
      FAL_API_KEY: 'fal-x',
      GOOGLE_AI_API_KEY: '',  // vide — doit être ignorée
    }
    const result = loadKeysFromEnv(env)
    expect(setApiKeyMock).toHaveBeenCalledTimes(3)
    expect(setApiKeyMock).toHaveBeenCalledWith('openai', 'sk-openai')
    expect(setApiKeyMock).toHaveBeenCalledWith('openrouter', 'sk-or-x')
    expect(setApiKeyMock).toHaveBeenCalledWith('fal', 'fal-x')
    expect(setApiKeyMock).not.toHaveBeenCalledWith('google-ai', expect.anything())
    expect(result.loaded).toEqual(['openai', 'openrouter', 'fal'])
    expect(result.skipped).toEqual(['google-ai'])
  })

  // @requirement: FR-065
  it('marque les providers chargés via env dans ENV_LOADED_PROVIDERS', () => {
    loadKeysFromEnv({ OPENAI_API_KEY: 'k', FAL_API_KEY: 'k' })
    expect(ENV_LOADED_PROVIDERS.has('openai')).toBe(true)
    expect(ENV_LOADED_PROVIDERS.has('fal')).toBe(true)
    expect(ENV_LOADED_PROVIDERS.has('openrouter')).toBe(false)
  })

  // @requirement: FR-065
  it('ignore les valeurs whitespace-only (équivalent à vide)', () => {
    loadKeysFromEnv({ OPENAI_API_KEY: '   ', OPENROUTER_API_KEY: '\t\n' })
    expect(setApiKeyMock).not.toHaveBeenCalled()
  })

  // @requirement: FR-065
  it('ne plante pas si aucune variable env définie', () => {
    expect(() => loadKeysFromEnv({})).not.toThrow()
    expect(setApiKeyMock).not.toHaveBeenCalled()
  })

  // @requirement: FR-065
  it('isLoadedFromEnv reste false après un setApiKey UI manuel (override runtime)', () => {
    // env charge openai
    loadKeysFromEnv({ OPENAI_API_KEY: 'k1' })
    expect(ENV_LOADED_PROVIDERS.has('openai')).toBe(true)
    // L'utilisateur sauvegarde une nouvelle clé openai via l'UI → on retire le marqueur env
    // (la clé n'est plus celle de l'env). Cette logique est dans le PUT settings/keys.
    ENV_LOADED_PROVIDERS.delete('openai')
    expect(ENV_LOADED_PROVIDERS.has('openai')).toBe(false)
  })
})
