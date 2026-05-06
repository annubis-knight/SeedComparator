import { execSync } from 'node:child_process'
import { platform } from 'node:os'

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
