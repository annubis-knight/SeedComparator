import { execSync } from 'node:child_process'
import { platform } from 'node:os'
import { readdirSync, unlinkSync } from 'node:fs'
import { resolve } from 'node:path'

const ports = process.argv.slice(2).map(Number).filter((p) => !Number.isNaN(p))

if (ports.length === 0) {
  console.log('[kill-ports] aucun port fourni')
  process.exit(0)
}

const isWindows = platform() === 'win32'

for (const port of ports) {
  try {
    if (isWindows) {
      const out = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' })
      const pids = new Set()
      for (const line of out.split('\n')) {
        const match = line.trim().match(/\s(\d+)$/)
        if (match) pids.add(match[1])
      }
      for (const pid of pids) {
        try {
          execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' })
          console.log(`[kill-ports] tué PID ${pid} sur port ${port}`)
        } catch {}
      }
      if (pids.size === 0) console.log(`[kill-ports] port ${port} libre`)
    } else {
      try {
        execSync(`lsof -ti:${port} | xargs -r kill -9`, { stdio: 'ignore' })
        console.log(`[kill-ports] port ${port} nettoyé`)
      } catch {
        console.log(`[kill-ports] port ${port} libre`)
      }
    }
  } catch {
    console.log(`[kill-ports] port ${port} libre`)
  }
}

// Cleanup des snapshots de config orphelins.
// Vite/electron-vite recompile les fichiers `.config.ts` en `.mjs` horodatés
// à chaque run et devrait les supprimer à la sortie. Quand on force-kill
// (taskkill /F, kill -9), Node n'a pas le temps de cleanup → les fichiers
// s'accumulent à la racine. On les nettoie systématiquement après les kills.
const ROOT = resolve(process.cwd())
const ORPHAN_PATTERNS = [
  /^electron\.vite\.config\.\d+\.mjs$/,
  /^electron\.vite\.config\.\d+\.cjs$/,
  /\.timestamp-\d+.*\.mjs$/,
  /\.timestamp-\d+.*\.cjs$/,
]

let removed = 0
try {
  for (const entry of readdirSync(ROOT)) {
    if (ORPHAN_PATTERNS.some((re) => re.test(entry))) {
      try {
        unlinkSync(resolve(ROOT, entry))
        removed++
      } catch {}
    }
  }
} catch {}

if (removed > 0) {
  console.log(`[kill-ports] ${removed} snapshot(s) de config orphelin(s) supprimé(s)`)
}
