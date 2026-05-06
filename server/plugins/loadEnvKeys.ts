import { loadKeysFromEnv } from '../services/envKeyLoader'
import { createLogger } from '../utils/logger'

const log = createLogger('plugin.loadEnvKeys')

/**
 * Plugin Nitro — exécuté une fois au boot du serveur.
 * Charge en mémoire les clés API trouvées dans les variables d'environnement
 * (`OPENAI_API_KEY`, `OPENROUTER_API_KEY`, `FAL_API_KEY`, `GOOGLE_AI_API_KEY`).
 *
 * Cascade : env au boot → l'UI Réglages peut écraser runtime via PUT /api/settings/keys.
 */
export default defineNitroPlugin(() => {
  log.info('boot — loading API keys from process.env')
  loadKeysFromEnv(process.env)
})
