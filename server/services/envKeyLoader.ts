import { setApiKey } from './apiKeys'
import { createLogger } from '../utils/logger'

const log = createLogger('envKeyLoader')

/**
 * Mapping providerId DB → nom de variable env attendue.
 *
 * Convention : `<PROVIDER_ID_SCREAMING_SNAKE>_API_KEY`. Les `-` du providerId
 * deviennent `_` (ex: `google-ai` → `GOOGLE_AI_API_KEY`).
 */
export const PROVIDER_ID_TO_ENV_VAR: Record<string, string> = {
  openai: 'OPENAI_API_KEY',
  openrouter: 'OPENROUTER_API_KEY',
  fal: 'FAL_API_KEY',
  'google-ai': 'GOOGLE_AI_API_KEY',
}

/**
 * Set des providerId dont la clé en mémoire vient du `.env` (pas de l'UI).
 * Utilisé par l'endpoint GET /api/settings/keys pour afficher un badge
 * "depuis .env" dans les Réglages, et invalider quand l'utilisateur saisit
 * une nouvelle clé via l'UI.
 */
export const ENV_LOADED_PROVIDERS = new Set<string>()

export function envVarForProvider(providerId: string): string {
  const v = PROVIDER_ID_TO_ENV_VAR[providerId]
  if (!v) throw new Error(`No env var mapping for providerId="${providerId}"`)
  return v
}

export interface LoadResult {
  loaded: string[]
  skipped: string[]
}

/**
 * Lit `env` (typiquement `process.env`) et appelle `setApiKey()` pour chaque
 * clé non vide / non whitespace. Renvoie la liste des providerId chargés et
 * ignorés.
 */
export function loadKeysFromEnv(env: Record<string, string | undefined>): LoadResult {
  const loaded: string[] = []
  const skipped: string[] = []

  for (const [providerId, varName] of Object.entries(PROVIDER_ID_TO_ENV_VAR)) {
    const raw = env[varName]
    const trimmed = (raw ?? '').trim()
    if (!trimmed) {
      skipped.push(providerId)
      continue
    }
    setApiKey(providerId, trimmed)
    ENV_LOADED_PROVIDERS.add(providerId)
    loaded.push(providerId)
    log.debug(`loaded "${varName}" → providerId="${providerId}" (len=${trimmed.length})`)
  }

  if (loaded.length > 0) {
    log.info(`loaded ${loaded.length} API key(s) from env`, { loaded, skipped })
  } else {
    log.info('no API keys found in env (skipped: ' + skipped.join(', ') + ')')
  }

  return { loaded, skipped }
}
