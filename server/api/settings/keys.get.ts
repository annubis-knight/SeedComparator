import { listProviderIdsWithKeys } from '../../services/apiKeys'
import { ENV_LOADED_PROVIDERS } from '../../services/envKeyLoader'

export default defineEventHandler(() => {
  return {
    providers: listProviderIdsWithKeys(),
    // EPIC-14 / FR-065 — providerIds dont la clé en mémoire vient du .env
    envLoaded: Array.from(ENV_LOADED_PROVIDERS),
  }
})
