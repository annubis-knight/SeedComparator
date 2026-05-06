import type { BriefRequest, BriefResult } from '#shared/contracts'
import { createLogger } from '../utils/logger'

const log = createLogger('useBriefAssistant')

export const BRIEF_STORAGE_KEY = 'seedcomparator.brief.v1'

export type BriefStep =
  | { kind: 'idle' }
  | { kind: 'running'; urlsTotal: number; urlsState: Array<{ url: string; status: 'pending' | 'crawling' | 'screenshot' | 'palette' | 'vision' | 'done' | 'error'; errorMsg?: string }>; llmStarted: boolean }
  | { kind: 'success'; result: BriefResult }
  | { kind: 'error'; code: string; msg: string }

function readPersisted(): BriefResult | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(BRIEF_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as BriefResult
  } catch {
    return null
  }
}

function persist(result: BriefResult) {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(BRIEF_STORAGE_KEY, JSON.stringify(result))
  } catch (err) {
    log.warn('localStorage persist failed (quota?)', { msg: (err as Error).message })
  }
}

export const useBriefAssistant = () => {
  const lastBrief = useState<BriefResult | null>('brief-last', () => readPersisted())
  const step = useState<BriefStep>('brief-step', () => ({ kind: 'idle' }))
  const abortController = useState<AbortController | null>('brief-abort', () => null)

  async function submit(req: BriefRequest) {
    log.info('submit start', { urls: req.urls.length })
    step.value = {
      kind: 'running',
      urlsTotal: req.urls.length,
      urlsState: req.urls.map((u) => ({ url: u, status: 'pending' as const })),
      llmStarted: false,
    }

    const ctrl = new AbortController()
    abortController.value = ctrl

    try {
      const res = await fetch('/api/brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
        signal: ctrl.signal,
      })
      if (!res.ok || !res.body) {
        const txt = await res.text().catch(() => '')
        log.error(`/api/brief failed status=${res.status}`, txt)
        step.value = { kind: 'error', code: `http_${res.status}`, msg: txt || `HTTP ${res.status}` }
        return
      }
      log.debug('SSE stream open')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const events = buffer.split('\n\n')
        buffer = events.pop() ?? ''
        for (const evt of events) {
          const lines = evt.split('\n')
          let eventName = 'message'
          let dataStr = ''
          for (const line of lines) {
            if (line.startsWith('event:')) eventName = line.slice(6).trim()
            else if (line.startsWith('data:')) dataStr += line.slice(5).trim()
          }
          if (!dataStr) continue
          let data: unknown
          try { data = JSON.parse(dataStr) } catch { continue }
          handleEvent(eventName, data)
        }
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        log.warn('brief aborted by user')
        step.value = { kind: 'error', code: 'aborted', msg: 'Annulé par l\'utilisateur' }
      } else {
        log.error('SSE stream error', err)
        step.value = { kind: 'error', code: 'stream_error', msg: (err as Error).message }
      }
    } finally {
      abortController.value = null
    }

    function handleEvent(name: string, data: unknown) {
      const d = data as Record<string, unknown>
      if (step.value.kind !== 'running') return

      if (name === 'url-start') {
        const idx = d.idx as number
        step.value.urlsState[idx]!.status = 'crawling'
      } else if (name === 'url-progress') {
        const idx = d.idx as number
        const stepName = d.step as string
        if (stepName === 'crawl-done') step.value.urlsState[idx]!.status = 'screenshot'
        else if (stepName === 'screenshot-done') step.value.urlsState[idx]!.status = 'palette'
        else if (stepName === 'palette-done') step.value.urlsState[idx]!.status = 'vision'
      } else if (name === 'url-done') {
        const idx = d.idx as number
        step.value.urlsState[idx]!.status = 'done'
      } else if (name === 'url-error') {
        const idx = d.idx as number
        step.value.urlsState[idx]!.status = 'error'
        step.value.urlsState[idx]!.errorMsg = (d.msg as string) ?? (d.code as string)
      } else if (name === 'llm-start' || name === 'llm-progress') {
        step.value.llmStarted = true
      } else if (name === 'done') {
        const result = d as unknown as BriefResult
        log.info('brief done')
        persist(result)
        lastBrief.value = result
        step.value = { kind: 'success', result }
      } else if (name === 'error') {
        const code = (d.code as string) ?? 'unknown'
        const msg = (d.msg as string) ?? 'Unknown error'
        log.error(`brief error code=${code}`, msg)
        step.value = { kind: 'error', code, msg }
      }
    }
  }

  function cancel() {
    log.warn('cancel() called')
    abortController.value?.abort()
  }

  function reset() {
    step.value = { kind: 'idle' }
  }

  function clearPersisted() {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(BRIEF_STORAGE_KEY)
    lastBrief.value = null
    step.value = { kind: 'idle' }
  }

  return { lastBrief, step, submit, cancel, reset, clearPersisted }
}
