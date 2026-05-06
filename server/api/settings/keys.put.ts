import { setApiKey } from '../../services/apiKeys'
import { ENV_LOADED_PROVIDERS } from '../../services/envKeyLoader'
import { KeyUpsertSchema } from '#shared/contracts'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = KeyUpsertSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid payload', data: parsed.error.flatten() })
  }
  setApiKey(parsed.data.providerId, parsed.data.apiKey)
  // FR-065 — l'utilisateur a saisi une clé via l'UI : la clé courante n'est plus
  // celle du .env. On retire le marqueur pour que le badge "depuis .env" disparaisse.
  ENV_LOADED_PROVIDERS.delete(parsed.data.providerId)
  return { ok: true, providerId: parsed.data.providerId }
})
