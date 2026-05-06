import { ProviderModeSchema, type ProviderMode } from '#shared/contracts'
import { prisma } from '../db/client'
import { createLogger } from '../utils/logger'

const log = createLogger('providerMode')

export const PROVIDER_MODE_SETTING_KEY = 'provider.mode'

/**
 * Cascade de résolution du mode provider :
 *  1. Setting DB `provider.mode` si présent + valide.
 *  2. Variable d'env `PROVIDER_MODE` (lue via runtimeConfig.providersMode).
 *  3. Fallback `live`.
 *
 * Compat ascendante : la variable historique `PROVIDERS_MOCK_MODE=true` est
 * encore traitée comme `mock` si `PROVIDER_MODE` n'est pas définie.
 */
export async function getProviderMode(): Promise<ProviderMode> {
  // 1. DB
  try {
    const row = await prisma.setting.findUnique({ where: { key: PROVIDER_MODE_SETTING_KEY } })
    if (row?.value) {
      const parsed = ProviderModeSchema.safeParse(row.value)
      if (parsed.success) {
        log.debug(`mode resolved from DB: ${parsed.data}`)
        return parsed.data
      }
      log.warn(`DB setting "${PROVIDER_MODE_SETTING_KEY}" has invalid value="${row.value}", falling back to env`)
    }
  } catch (err) {
    log.warn('DB lookup for provider.mode failed, falling back to env', err)
  }

  // 2. Env / runtimeConfig
  const config = useRuntimeConfig()
  const envMode = (config.providersMode as string | undefined) ?? ''
  const parsedEnv = ProviderModeSchema.safeParse(envMode)
  if (parsedEnv.success) {
    log.debug(`mode resolved from env PROVIDER_MODE=${parsedEnv.data}`)
    return parsedEnv.data
  }

  // Compat ancienne variable
  if ((config.providersMockMode as boolean | undefined) === true) {
    log.debug('mode resolved from legacy PROVIDERS_MOCK_MODE=true → mock')
    return 'mock'
  }

  // 3. Default
  log.debug('mode resolved to default: live')
  return 'live'
}
