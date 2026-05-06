import { chromium, type Browser } from 'playwright'
import { createLogger } from '../utils/logger'
import { validateUrl } from './crawler'

const log = createLogger('screenshot')

let _browser: Browser | null = null

async function getBrowser(): Promise<Browser> {
  if (_browser && _browser.isConnected()) return _browser
  log.info('launching Chromium headless')
  _browser = await chromium.launch({ headless: true })
  return _browser
}

export interface ScreenshotResult {
  /** Screenshot full PNG (1280×800) — pour analyse vision LLM, jamais persisté. */
  fullBuffer: Buffer
  /** Screenshot mini JPEG (400×250) base64 — pour affichage UI + persistance localStorage. */
  miniDataUrl: string
}

export class ScreenshotError extends Error {
  constructor(public readonly code: 'timeout' | 'launch_failed' | 'navigation_error', message: string) {
    super(message)
    this.name = 'ScreenshotError'
  }
}

/**
 * Prend un screenshot d'une URL en mode headless.
 * Renvoie 2 versions : full (pour LLM vision) et mini (pour UI).
 */
export async function captureScreenshot(rawUrl: string, timeoutMs = 8000): Promise<ScreenshotResult> {
  const url = validateUrl(rawUrl)
  log.debug(`captureScreenshot start url=${url.href}`)

  let browser: Browser
  try {
    browser = await getBrowser()
  } catch (err) {
    log.error('Chromium launch failed', { msg: (err as Error).message })
    throw new ScreenshotError('launch_failed', `Could not launch headless browser: ${(err as Error).message}`)
  }

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent: 'Mozilla/5.0 (compatible; SeedComparator/1.0; +brief-assistant)',
  })
  const page = await context.newPage()

  try {
    await page.goto(url.href, { waitUntil: 'networkidle', timeout: timeoutMs })
  } catch (err) {
    await context.close().catch(() => {})
    log.warn(`navigation error url=${url.href}`, { msg: (err as Error).message })
    throw new ScreenshotError('navigation_error', `Navigation failed: ${(err as Error).message}`)
  }

  const fullBuffer = await page.screenshot({ type: 'png', fullPage: false })
  const miniBuffer = await page.screenshot({ type: 'jpeg', quality: 70, fullPage: false, clip: { x: 0, y: 0, width: 1280, height: 800 } })

  await context.close().catch(() => {})

  // Resize mini : Playwright ne fait pas de resize natif, on garde le full size jpeg compressé.
  // Pour vraie miniature on pourrait passer par sharp, mais quality:70 + jpeg suffit (~30-60KB).
  const miniDataUrl = `data:image/jpeg;base64,${miniBuffer.toString('base64')}`

  log.info(`captureScreenshot success url=${url.href} fullBytes=${fullBuffer.length} miniBytes=${miniBuffer.length}`)

  return {
    fullBuffer,
    miniDataUrl,
  }
}

/**
 * Ferme le navigateur global (à appeler à l'arrêt du serveur).
 */
export async function closeBrowser(): Promise<void> {
  if (_browser) {
    log.info('closing Chromium')
    await _browser.close().catch(() => {})
    _browser = null
  }
}
