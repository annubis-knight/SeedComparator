import type { ModelDTO } from '#shared/contracts'
import { createLogger } from '../utils/logger'

const log = createLogger('useModels')

export const useModels = () => {
  const models = useState<ModelDTO[]>('models', () => [])
  const loading = useState<boolean>('models-loading', () => false)

  async function load() {
    loading.value = true
    try {
      const data = await $fetch<{ models: ModelDTO[] }>('/api/models')
      log.info(`load() got ${data.models.length} models`)
      models.value = data.models
    } catch (err) {
      log.error('load() failed', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function toggle(modelId: string, enabled: boolean) {
    log.info(`toggle modelId="${modelId}" enabled=${enabled}`)
    await $fetch('/api/models', { method: 'PATCH', body: { modelId, enabled } })
    await load()
  }

  return { models, loading, load, toggle }
}
