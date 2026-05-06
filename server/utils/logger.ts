import chalk from 'chalk'
import { logsConfig } from '../../logs.config'

const LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 } as const
type Level = keyof typeof LEVELS

function getCallerInfo(): string {
  const err = new Error()
  const stack = err.stack?.split('\n')
  if (!stack) return 'unknown'
  // [0] Error, [1] getCallerInfo, [2] formatLog, [3] log.X, [4] caller
  const line = stack[4] ?? stack[3] ?? ''
  const match = line.match(/\((.+):(\d+):\d+\)/) || line.match(/at (.+):(\d+):\d+/)
  if (!match) return 'unknown'
  const file = match[1]!.split(/[\\/]/).slice(-2).join('/')
  return `${file}:${match[2]}`
}

function formatLog(level: Level, emoji: string, color: (s: string) => string, scope: string, msg: string, data?: unknown): void {
  if (LEVELS[level] < LEVELS[logsConfig.level]) return

  const parts: string[] = []
  if (logsConfig.showTimestamp) parts.push(chalk.dim(new Date().toISOString().slice(11, 23)))
  parts.push(color(`[${level}]`))
  if (logsConfig.emoji) parts.push(emoji)
  if (logsConfig.showFilePath) parts.push(chalk.dim(getCallerInfo()))
  if (scope) parts.push(chalk.magenta(`[${scope}]`))
  parts.push(msg)

  if (data !== undefined) console.log(parts.join(' '), data)
  else console.log(parts.join(' '))
}

/**
 * Logger backend Nitro / scripts Node.
 *
 * Usage :
 *   import { createLogger } from '~/server/utils/logger'
 *   const log = createLogger('generate')
 *   log.info('batch start', { tasks: 3 })
 *
 * Le scope (ex: 'generate', 'registry', 'fal-adapter') s'affiche en magenta
 * pour repérer rapidement quel module parle.
 */
export function createLogger(scope = '') {
  return {
    debug: (msg: string, data?: unknown) => formatLog('DEBUG', '🔍', chalk.gray, scope, msg, data),
    info:  (msg: string, data?: unknown) => formatLog('INFO',  '✅', chalk.cyan, scope, msg, data),
    warn:  (msg: string, data?: unknown) => formatLog('WARN',  '⚠️ ', chalk.yellow, scope, msg, data),
    error: (msg: string, data?: unknown) => formatLog('ERROR', '❌', chalk.red.bold, scope, msg, data),
  }
}

/** Logger sans scope (raccourci pour usage rapide). */
export const log = createLogger()
