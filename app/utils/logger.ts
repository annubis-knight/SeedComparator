/**
 * Logger frontend (navigateur, sans dépendance externe).
 *
 * Utilise `console.log('%c...')` pour les couleurs CSS dans la console du navigateur.
 * Le niveau peut être ajusté via :
 *   - `log.setLevel('DEBUG')` au runtime depuis la console DevTools
 *   - la variable Vite `import.meta.env.VITE_LOG_LEVEL` (ex: VITE_LOG_LEVEL=DEBUG npm run dev)
 *
 * Pour le backend Nitro / scripts Node, voir `server/utils/logger.ts`.
 */

type Level = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'

const LEVELS: Record<Level, number> = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 }

const STYLES: Record<Level, string> = {
  DEBUG: 'color: #888; font-weight: normal',
  INFO:  'color: #0ea5e9; font-weight: bold',
  WARN:  'color: #f59e0b; font-weight: bold',
  ERROR: 'color: #ef4444; font-weight: bold',
}

const SCOPE_STYLE = 'color: #c084fc; font-weight: bold'

const EMOJIS: Record<Level, string> = { DEBUG: '🔍', INFO: '✅', WARN: '⚠️', ERROR: '❌' }

const initialLevel = (() => {
  try {
    const envLevel = (import.meta as { env?: Record<string, string> }).env?.VITE_LOG_LEVEL
    if (envLevel && envLevel in LEVELS) return envLevel as Level
  } catch {}
  return 'DEBUG' as Level
})()

const config: { level: Level; emoji: boolean } = {
  level: initialLevel,
  emoji: true,
}

function formatLog(level: Level, scope: string, msg: string, data?: unknown): void {
  if (LEVELS[level] < LEVELS[config.level]) return

  const prefix = config.emoji ? `${EMOJIS[level]} [${level}]` : `[${level}]`
  const scopeLabel = scope ? `[${scope}]` : ''

  if (data !== undefined) {
    if (scope) {
      console.log(`%c${prefix}%c %c${scopeLabel}%c ${msg}`, STYLES[level], '', SCOPE_STYLE, '', data)
    } else {
      console.log(`%c${prefix}%c ${msg}`, STYLES[level], '', data)
    }
  } else {
    if (scope) {
      console.log(`%c${prefix}%c %c${scopeLabel}%c ${msg}`, STYLES[level], '', SCOPE_STYLE, '')
    } else {
      console.log(`%c${prefix}%c ${msg}`, STYLES[level], '')
    }
  }
}

/**
 * Crée un logger avec un scope (ex: 'useGenerationSession', 'sidepanel').
 * Le scope s'affiche en violet pour repérer rapidement quel module parle.
 */
export function createLogger(scope = '') {
  return {
    debug: (msg: string, data?: unknown) => formatLog('DEBUG', scope, msg, data),
    info:  (msg: string, data?: unknown) => formatLog('INFO', scope, msg, data),
    warn:  (msg: string, data?: unknown) => formatLog('WARN', scope, msg, data),
    error: (msg: string, data?: unknown) => formatLog('ERROR', scope, msg, data),
    setLevel: (level: Level) => { config.level = level },
  }
}

export const log = createLogger()
