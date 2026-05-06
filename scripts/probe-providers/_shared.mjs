// scripts/probe-providers/_shared.mjs
//
// Helpers communs aux scripts de test live des providers (STORY-104).
//
// Responsabilités :
//   - Charger `.env` et exposer la clé API du provider courant.
//   - Construire le plan d'exécution (modèles ciblés + coût total estimé).
//   - Demander confirmation à l'utilisateur avant toute dépense (skippable via --yes).
//   - Écrire le résultat en fixture (`tests/fixtures/providers/<source>/<modelId>/nominal.{json,png}`)
//     pour qu'il soit rejouable en mode `mock-real`.
//   - Logs colorés clairs.
//
// Usage typique depuis un script provider :
//   import { runProbes, parseCliArgs, ... } from './_shared.mjs'
//   await runProbes({
//     providerLabel: 'OpenAI',
//     models: [...],            // [{modelId, apiModel, pricePerImage, source, ...}]
//     apiKeyEnv: 'OPENAI_API_KEY',
//     callProvider: async ({ model, apiKey, prompt, signal }) => { ... },
//   })

import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'

const __dirname = dirname(fileURLToPath(import.meta.url))
export const PROJECT_ROOT = join(__dirname, '..', '..')
export const FIXTURES_ROOT = join(PROJECT_ROOT, 'tests', 'fixtures')

// ─── Couleurs ─────────────────────────────────────────────────────────────────
const c = {
  reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m',
  red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m',
  blue: '\x1b[34m', magenta: '\x1b[35m', cyan: '\x1b[36m',
}
export const color = c
export const log = {
  info:  (msg) => console.log(`${c.blue}ℹ${c.reset}  ${msg}`),
  ok:    (msg) => console.log(`${c.green}✓${c.reset}  ${msg}`),
  warn:  (msg) => console.log(`${c.yellow}⚠${c.reset}  ${msg}`),
  err:   (msg) => console.error(`${c.red}✗${c.reset}  ${msg}`),
  step:  (msg) => console.log(`${c.cyan}→${c.reset}  ${msg}`),
  hr:    ()    => console.log(c.dim + '─'.repeat(60) + c.reset),
}

// ─── .env loader (sans dépendance — Nuxt fait pareil au boot) ─────────────────
export function loadDotEnv() {
  const envPath = join(PROJECT_ROOT, '.env')
  if (!existsSync(envPath)) return
  const raw = readFileSync(envPath, 'utf-8')
  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq < 0) continue
    const key = trimmed.slice(0, eq).trim()
    let val = trimmed.slice(eq + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    if (process.env[key] === undefined) process.env[key] = val
  }
}

// ─── CLI args ─────────────────────────────────────────────────────────────────
export function parseCliArgs(argv = process.argv.slice(2)) {
  const args = {
    only: null,         // --only=modelId[,modelId,...]  → restreint la liste
    yes: false,         // --yes                         → skip confirm
    overwrite: false,   // --overwrite                   → écrase fixture existante
    dryRun: false,      // --dry-run                     → affiche plan, pas d'appel
    maxCost: Infinity,  // --max-cost=0.05               → abort si dépasse
  }
  for (const a of argv) {
    if (a === '--yes' || a === '-y') args.yes = true
    else if (a === '--overwrite') args.overwrite = true
    else if (a === '--dry-run') args.dryRun = true
    else if (a.startsWith('--only=')) args.only = a.slice(7).split(',').map((s) => s.trim()).filter(Boolean)
    else if (a.startsWith('--max-cost=')) args.maxCost = Number(a.slice(11))
  }
  return args
}

// ─── Confirmation interactive ─────────────────────────────────────────────────
export async function confirm(question) {
  const rl = createInterface({ input, output })
  try {
    const answer = await rl.question(`${c.yellow}?${c.reset}  ${question} ${c.dim}[y/N]${c.reset} `)
    return answer.trim().toLowerCase() === 'y' || answer.trim().toLowerCase() === 'yes'
  } finally {
    rl.close()
  }
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────
export function fixturePathsFor(source, modelId, scenario = 'nominal') {
  const dir = join(FIXTURES_ROOT, 'providers', source, modelId)
  return {
    dir,
    jsonPath: join(dir, `${scenario}.json`),
    pngPath: join(dir, `${scenario}.png`),
  }
}

export function fixtureExists(source, modelId, scenario = 'nominal') {
  const { jsonPath, pngPath } = fixturePathsFor(source, modelId, scenario)
  return existsSync(jsonPath) && existsSync(pngPath)
}

export function writeFixture({ source, modelId, scenario = 'nominal', input, http, expected, imageBuffer }) {
  const { dir, jsonPath, pngPath } = fixturePathsFor(source, modelId, scenario)
  mkdirSync(dir, { recursive: true })
  const sha = createHash('sha256').update(imageBuffer).digest('hex')
  const fixture = {
    modelId, source, scenario, input, http,
    expected: { ...expected, imagePngSha256: sha },
    capturedAt: new Date().toISOString(),
  }
  writeFileSync(jsonPath, JSON.stringify(fixture, null, 2), 'utf-8')
  writeFileSync(pngPath, imageBuffer)
  return { jsonPath, pngPath, sha256: sha, bytes: imageBuffer.length }
}

// ─── Prompt par défaut (pré-prompt A) ─────────────────────────────────────────
// Aligné sur shared/contracts.ts > PROMPT_PREFIX_A. Pas d'ajout : le préfixe
// instruit déjà une hero section editorial — c'est exactement ce qu'on veut tester.
export const DEFAULT_PROMPT = `A creative, art-directed hero section for the top of a modern landing page. Bold display typography with strong hierarchy. The composition feels editorial and intentional, leaving room for visual interpretation. Free creative direction.`

// ─── Orchestrateur d'un provider ──────────────────────────────────────────────
/**
 * @param {Object} opts
 * @param {string} opts.providerLabel — "OpenAI", "Google AI", "Fal.ai"…
 * @param {Array}  opts.models — [{modelId, source, pricePerImage, ...}]
 * @param {string} opts.apiKeyEnv — nom de la variable env (OPENAI_API_KEY…)
 * @param {(args: {model, apiKey, prompt, signal}) => Promise<{
 *           imageBuffer: Buffer, mime: string, rawResponse: unknown,
 *           seed: number|null, costUsd: number,
 *         }>} opts.callProvider
 */
export async function runProbes(opts) {
  loadDotEnv()
  const args = parseCliArgs()

  const apiKey = process.env[opts.apiKeyEnv]
  if (!apiKey) {
    log.err(`Environment variable ${opts.apiKeyEnv} is not set or empty.`)
    log.info('Add it to .env, then re-run.')
    process.exit(1)
  }

  // Filtrage --only
  let targets = opts.models
  if (args.only) {
    targets = targets.filter((m) => args.only.includes(m.modelId))
    if (targets.length === 0) {
      log.err(`No model matches --only=${args.only.join(',')}`)
      log.info(`Available: ${opts.models.map((m) => m.modelId).join(', ')}`)
      process.exit(1)
    }
  }

  // Tri par coût croissant (les moins chers en premier)
  targets = [...targets].sort((a, b) => a.pricePerImage - b.pricePerImage)

  // Plan
  const totalCost = targets.reduce((s, m) => s + m.pricePerImage, 0)
  log.hr()
  console.log(`${c.bold}${opts.providerLabel} — probe plan${c.reset}`)
  log.hr()
  for (const m of targets) {
    const fixtureNote = fixtureExists(m.source, m.modelId)
      ? `${c.dim}(fixture exists${args.overwrite ? ', will overwrite' : ', will SKIP without --overwrite'})${c.reset}`
      : ''
    console.log(`  ${m.modelId.padEnd(36)} ${c.dim}${('$' + m.pricePerImage.toFixed(3)).padStart(8)}${c.reset} ${fixtureNote}`)
  }
  log.hr()
  console.log(`${c.bold}Total estimated cost: $${totalCost.toFixed(3)}${c.reset}`)
  log.hr()

  if (totalCost > args.maxCost) {
    log.err(`Total cost $${totalCost.toFixed(3)} exceeds --max-cost=$${args.maxCost}. Aborting.`)
    process.exit(1)
  }

  if (args.dryRun) {
    log.warn('--dry-run set — no API call will be made. Exiting.')
    return { tested: 0, succeeded: 0, failed: 0, skipped: targets.length }
  }

  if (!args.yes) {
    const ok = await confirm(`Proceed and call ${opts.providerLabel} (real money) ?`)
    if (!ok) {
      log.warn('Aborted by user.')
      process.exit(0)
    }
  }

  // Exécution séquentielle (pas en parallèle pour rester poli avec rate limits)
  let succeeded = 0, failed = 0, skipped = 0
  for (const m of targets) {
    if (fixtureExists(m.source, m.modelId) && !args.overwrite) {
      log.warn(`${m.modelId}: fixture already exists, skip (use --overwrite to recapture)`)
      skipped++
      continue
    }

    log.step(`Probing ${c.bold}${m.modelId}${c.reset} (${m.source}, $${m.pricePerImage.toFixed(3)})…`)
    const t0 = Date.now()
    const ctrl = new AbortController()
    try {
      const out = await opts.callProvider({ model: m, apiKey, prompt: DEFAULT_PROMPT, signal: ctrl.signal })
      const elapsed = Date.now() - t0
      const w = writeFixture({
        source: m.source,
        modelId: m.modelId,
        input: { prompt: DEFAULT_PROMPT, ratio: '1:1' },
        http: { status: 200, body: out.rawResponse },
        expected: { mime: out.mime, costUsd: out.costUsd, seed: out.seed },
        imageBuffer: out.imageBuffer,
      })
      log.ok(`${m.modelId} OK in ${elapsed}ms — ${w.bytes} bytes, sha256=${w.sha256.slice(0, 12)}…`)
      log.info(`   fixture: ${w.jsonPath.replace(PROJECT_ROOT, '.')}`)
      succeeded++
    } catch (err) {
      const elapsed = Date.now() - t0
      log.err(`${m.modelId} FAILED in ${elapsed}ms — ${err?.code ?? '?'}: ${err?.message ?? err}`)
      if (err?.body) log.err(`   body: ${String(err.body).slice(0, 200)}`)
      failed++
    }
  }

  log.hr()
  console.log(`${c.bold}Summary${c.reset}: ${c.green}${succeeded} OK${c.reset} · ${c.red}${failed} failed${c.reset} · ${c.yellow}${skipped} skipped${c.reset}`)
  log.hr()
  return { tested: succeeded + failed, succeeded, failed, skipped }
}

// Erreurs typées simples (mimer ProviderError côté serveur sans importer TS)
export class ProbeError extends Error {
  constructor(code, message, status, body) {
    super(message)
    this.code = code
    this.status = status
    this.body = body
  }
}

export function isHtmlContentType(contentType) {
  const ct = (contentType ?? '').toLowerCase()
  return ct.includes('text/html') || ct.includes('application/xhtml')
}
