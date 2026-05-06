/**
 * Configuration du système de logs (backend Nitro + scripts Node).
 *
 * Ce fichier contrôle le comportement des logs côté serveur.
 * Modifie-le pour ajuster la verbosité sans toucher au code source.
 * Pour le frontend (navigateur), voir `app/utils/logger.ts` (config inline).
 */
export const logsConfig = {
  /**
   * Niveau minimum de logs affiché.
   *
   * Niveaux disponibles (du plus verbeux au plus silencieux) :
   *   "DEBUG" → Tout afficher. Valeurs de variables, flux de données,
   *             utile pendant le développement et le debug actif.
   *   "INFO"  → Étapes clés (boot, requêtes API, batch, fin de tâche).
   *             Bon réglage par défaut.
   *   "WARN"  → Situations inhabituelles (fallbacks, retries, missing).
   *   "ERROR" → Uniquement les erreurs. Production.
   */
  level: 'DEBUG' as 'DEBUG' | 'INFO' | 'WARN' | 'ERROR',

  /** Affiche l'heure HH:MM:SS.mmm dans chaque log. */
  showTimestamp: true,

  /** Affiche le fichier:ligne d'origine du log. */
  showFilePath: true,

  /** Emojis devant chaque log (🔍 / ✅ / ⚠️ / ❌). */
  emoji: true,
}
