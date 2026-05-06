import { prisma } from '../../db/client'
import { SettingUpsertSchema, ProviderModeSchema } from '#shared/contracts'
import { PROVIDER_MODE_SETTING_KEY } from '../../services/providerMode'
import { createLogger } from '../../utils/logger'

const log = createLogger('settings.put')

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = SettingUpsertSchema.safeParse(body)
  if (!parsed.success) {
    log.error('invalid SettingUpsert payload', parsed.error.flatten())
    throw createError({ statusCode: 400, statusMessage: 'Invalid payload', data: parsed.error.flatten() })
  }

  // Validation spécifique pour les clés sensibles connues.
  if (parsed.data.key === PROVIDER_MODE_SETTING_KEY) {
    const valid = ProviderModeSchema.safeParse(parsed.data.value)
    if (!valid.success) {
      log.error(`rejected invalid provider.mode value="${parsed.data.value}"`)
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid provider.mode (expected mock | mock-real | live)',
      })
    }
    log.info(`provider.mode set to "${valid.data}"`)
  } else {
    log.debug(`upsert setting key="${parsed.data.key}"`)
  }

  await prisma.setting.upsert({
    where: { key: parsed.data.key },
    update: { value: parsed.data.value },
    create: { key: parsed.data.key, value: parsed.data.value },
  })
  return { ok: true }
})
