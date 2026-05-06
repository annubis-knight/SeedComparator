#!/usr/bin/env node
// scripts/probe-providers/probe-all.mjs
//
// Orchestrateur : lance les 3 probes (Fal, OpenAI, Google AI) à la suite,
// dans l'ordre coût-croissant pour économiser le budget en cas d'arrêt mid-run.
//
// Usage : node scripts/probe-providers/probe-all.mjs [--yes] [--overwrite] [--dry-run] [--max-cost=...]
//
// Le `--max-cost` ici s'applique au TOTAL agrégé des 3 providers.

import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { color, log, parseCliArgs, loadDotEnv, confirm } from './_shared.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Coûts agrégés par provider (somme des modèles, en miroir des catalogues respectifs).
// Si un de ces nombres dérive de la vérité, le détail individuel reste correct car
// chaque sous-script affiche son propre plan avant exécution.
const PROVIDERS = [
  { id: 'fal',       label: 'Fal.ai',           script: 'probe-fal.mjs',       totalCost: 0.080 },  // 0.010 + 0.030 + 0.040
  { id: 'openai',    label: 'OpenAI Platform',  script: 'probe-openai.mjs',    totalCost: 0.205 },  // 0.011 + 0.020 + 0.030 + 0.040 + 0.040 + 0.053
  { id: 'google-ai', label: 'Google AI Studio', script: 'probe-google-ai.mjs', totalCost: 0.320 },  // 0.020 + 0.040 + 0.060 + 0.030 + 0.040 + 0.130
]

loadDotEnv()
const args = parseCliArgs()

const grandTotal = PROVIDERS.reduce((s, p) => s + p.totalCost, 0)

log.hr()
console.log(`${color.bold}probe-all — full provider sweep${color.reset}`)
log.hr()
for (const p of PROVIDERS) {
  console.log(`  ${p.label.padEnd(24)} ${color.dim}~$${p.totalCost.toFixed(3)}${color.reset}`)
}
log.hr()
console.log(`${color.bold}Grand total estimated cost: $${grandTotal.toFixed(3)}${color.reset}`)
log.hr()

if (grandTotal > args.maxCost) {
  log.err(`Total $${grandTotal.toFixed(3)} > --max-cost=$${args.maxCost}. Aborting.`)
  process.exit(1)
}

if (args.dryRun) {
  log.warn('--dry-run set — chaining sub-scripts in dry-run mode only.')
} else if (!args.yes) {
  const ok = await confirm(`Run all 3 probes (real money, ~$${grandTotal.toFixed(3)}) ?`)
  if (!ok) { log.warn('Aborted by user.'); process.exit(0) }
}

// On forwarde --yes / --overwrite / --dry-run aux sous-scripts.
// (chaque sous-script affichera son propre plan + summary).
const forwarded = []
forwarded.push('--yes') // déjà confirmé en haut
if (args.overwrite) forwarded.push('--overwrite')
if (args.dryRun) forwarded.push('--dry-run')

let exitCode = 0
for (const p of PROVIDERS) {
  log.hr()
  log.step(`Starting ${p.label} probe…`)
  log.hr()
  const child = spawn(process.execPath, [join(__dirname, p.script), ...forwarded], { stdio: 'inherit' })
  const code = await new Promise((resolve) => child.on('close', resolve))
  if (code !== 0) {
    log.err(`${p.label} probe exited with code ${code}`)
    exitCode = code
    // On continue malgré tout — l'utilisateur préfère savoir où chaque provider en est.
  } else {
    log.ok(`${p.label} probe done.`)
  }
}

log.hr()
console.log(`${color.bold}probe-all finished${color.reset} — exit code ${exitCode}`)
log.hr()
process.exit(exitCode)
