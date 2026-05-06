import * as cheerio from 'cheerio'
import { createLogger } from '../utils/logger'

const log = createLogger('crawler')

export interface CrawlResult {
  url: string
  title: string
  metaDescription: string
  textExcerpt: string
  rawHtmlBytes: number
}

export class CrawlError extends Error {
  constructor(
    public readonly code: 'invalid_url' | 'timeout' | 'http_error' | 'empty_content' | 'network_error',
    message: string,
    public readonly status?: number,
  ) {
    super(message)
    this.name = 'CrawlError'
  }
}

/**
 * Validate l'URL et bloque les schemes non-http(s) + IPs privées (SSRF).
 */
export function validateUrl(rawUrl: string): URL {
  let parsed: URL
  try {
    parsed = new URL(rawUrl)
  } catch {
    throw new CrawlError('invalid_url', `Invalid URL: ${rawUrl}`)
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new CrawlError('invalid_url', `Only http/https schemes allowed, got: ${parsed.protocol}`)
  }
  const host = parsed.hostname.toLowerCase()
  if (
    host === 'localhost' ||
    host === '0.0.0.0' ||
    host === '::1' ||
    host.startsWith('127.') ||
    host.startsWith('10.') ||
    host.startsWith('192.168.') ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host)
  ) {
    throw new CrawlError('invalid_url', `Private/local addresses are not allowed: ${host}`)
  }
  return parsed
}

/**
 * Fetch une URL HTML et extrait : title, meta description, h1/h2, premiers paragraphes.
 * Limite à 2000 caractères de texte significatif.
 */
export async function crawlPage(rawUrl: string, timeoutMs = 8000): Promise<CrawlResult> {
  const url = validateUrl(rawUrl)
  log.debug(`crawlPage start url=${url.href}`)

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  let res: Response
  try {
    res = await fetch(url.href, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SeedComparator/1.0; +brief-assistant)',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: controller.signal,
      redirect: 'follow',
    })
  } catch (err: unknown) {
    clearTimeout(timer)
    if ((err as Error).name === 'AbortError') {
      log.warn(`crawlPage timeout url=${url.href}`)
      throw new CrawlError('timeout', `Timeout after ${timeoutMs}ms`)
    }
    log.error(`crawlPage network error url=${url.href}`, { msg: (err as Error).message })
    throw new CrawlError('network_error', `Network: ${(err as Error).message}`)
  }
  clearTimeout(timer)

  if (!res.ok) {
    log.warn(`crawlPage HTTP ${res.status} url=${url.href}`)
    throw new CrawlError('http_error', `HTTP ${res.status}`, res.status)
  }

  const html = await res.text()
  const $ = cheerio.load(html)

  const title = ($('title').first().text() || '').trim().slice(0, 200)
  const metaDescription = ($('meta[name="description"]').attr('content') || '').trim().slice(0, 300)

  // Extraction texte significatif : h1, h2, premiers paragraphes
  const parts: string[] = []
  $('h1, h2').each((_, el) => { parts.push($(el).text().trim()) })
  $('p').slice(0, 12).each((_, el) => { parts.push($(el).text().trim()) })
  const textExcerpt = parts
    .filter((s) => s.length > 0)
    .join('\n\n')
    .replace(/\s+/g, ' ')
    .slice(0, 2000)

  if (!title && !textExcerpt) {
    log.warn(`crawlPage empty content url=${url.href}`)
    throw new CrawlError('empty_content', 'No exploitable text content found')
  }

  log.info(`crawlPage success url=${url.href} bytes=${html.length} excerpt=${textExcerpt.length}`)
  return {
    url: url.href,
    title,
    metaDescription,
    textExcerpt,
    rawHtmlBytes: html.length,
  }
}
