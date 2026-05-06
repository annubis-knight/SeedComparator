// Stockage en mémoire des clés API côté serveur Nitro.
// En production avec Electron, le main process passe les clés via une route initiale
// (POST /api/internal/keys), elles ne sont JAMAIS persistées dans la DB.
// En mode mock, les clés ne sont pas requises.

import { createLogger } from '../utils/logger'

const log = createLogger('apiKeys')

const keys = new Map<string, string>()

export function setApiKey(providerId: string, apiKey: string) {
  log.info(`setApiKey provider="${providerId}" len=${apiKey.length}`)
  keys.set(providerId, apiKey)
}

export function getApiKey(providerId: string): string | null {
  const v = keys.get(providerId) ?? null
  log.debug(`getApiKey provider="${providerId}" found=${!!v}`)
  return v
}

export function listProviderIdsWithKeys(): string[] {
  return Array.from(keys.keys())
}

export function deleteApiKey(providerId: string) {
  log.info(`deleteApiKey provider="${providerId}"`)
  keys.delete(providerId)
}
