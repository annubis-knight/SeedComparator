import { readdirSync, readFileSync, statSync } from 'node:fs'
import { resolve, join } from 'node:path'

const ROOT = resolve(process.cwd(), '.output/public')

const PATTERNS = [
  /sk-[a-zA-Z0-9]{20,}/, // OpenAI / OpenRouter
  /\bfal_[a-zA-Z0-9_-]{16,}/,
  /Bearer\s+[a-zA-Z0-9_-]{20,}/,
]

let found = 0

function walk(dir) {
  let entries
  try { entries = readdirSync(dir) } catch { return }
  for (const e of entries) {
    const full = join(dir, e)
    const s = statSync(full)
    if (s.isDirectory()) walk(full)
    else if (/\.(js|mjs|json|html|css|map)$/.test(e)) {
      const content = readFileSync(full, 'utf8')
      for (const re of PATTERNS) {
        if (re.test(content)) {
          console.error(`[check:secrets] match in ${full}: ${re}`)
          found++
        }
      }
    }
  }
}

try {
  statSync(ROOT)
} catch {
  console.warn('[check:secrets] .output/public not found — run `npm run build` first')
  process.exit(0)
}

walk(ROOT)

if (found > 0) {
  console.error(`[check:secrets] FAIL: ${found} match(es)`)
  process.exit(1)
}
console.log('[check:secrets] OK — no API key patterns found in frontend bundle')
