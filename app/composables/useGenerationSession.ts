import { useCostMeter } from './useCostMeter'
import type { Ratio, Quality, Phase } from '#shared/contracts'
import { createLogger } from '../utils/logger'
import { BRIEF_STORAGE_KEY } from './useBriefAssistant'
import { useActiveSession } from './useActiveSession'
import { useModelParams } from './useModelParams'
import { usePerGenerationParams } from './usePerGenerationParams'

const log = createLogger('useGenerationSession')

export interface LiveGeneration {
  taskId: string
  generationId: string | null
  promptIdx: number
  modelId: string
  status: 'idle' | 'pending' | 'success' | 'failed' | 'aborted'
  imageDataUrl: string | null
  seed: number | null
  costUsd: number
  errorCode: string | null
  errorMsg: string | null
  liked: boolean
  phase: Phase // STORY-105
  promptVariant: 'A' | 'B' | 'C' // STORY-105
  /**
   * STORY-104 — En mode mock-real, signale que cette image est un replay de
   * la fixture du prompt A (la seule capturée par les probe scripts).
   */
  replayedFromVariant?: 'A'
}

export function buildIdleCards(modelIds: string[], promptCount: number, phase: Phase = 'wireframe', promptVariant: 'A' | 'B' | 'C' = 'A'): LiveGeneration[] {
  if (modelIds.length === 0 || promptCount === 0) return []
  const cards: LiveGeneration[] = []
  for (let promptIdx = 0; promptIdx < promptCount; promptIdx++) {
    for (const modelId of modelIds) {
      cards.push({
        taskId: `${promptIdx}-${modelId}`,
        generationId: null,
        promptIdx,
        modelId,
        status: 'idle',
        imageDataUrl: null,
        seed: null,
        costUsd: 0,
        errorCode: null,
        errorMsg: null,
        liked: false,
        phase,
        promptVariant,
      })
    }
  }
  return cards
}

export const useGenerationSession = () => {
  const sessionId = useState<string | null>('gen-session-id', () => null)
  const generations = useState<LiveGeneration[]>('gen-list', () => [])
  const inProgress = useState<boolean>('gen-in-progress', () => false)
  const abortController = useState<AbortController | null>('gen-abort', () => null)
  const cost = useCostMeter()
  const activeSession = useActiveSession()

  function reset(prompts: string[], modelIds: string[], phase: Phase = 'wireframe', promptVariant: 'A' | 'B' | 'C' = 'A') {
    sessionId.value = null
    generations.value = prompts.flatMap((_, promptIdx) =>
      modelIds.map((modelId) => ({
        taskId: `${promptIdx}-${modelId}`,
        generationId: null,
        promptIdx,
        modelId,
        status: 'pending' as const,
        imageDataUrl: null,
        seed: null,
        costUsd: 0,
        errorCode: null,
        errorMsg: null,
        liked: false,
        phase,
        promptVariant,
      })),
    )
  }

  /**
   * STORY-097 : marque une generation comme likée (optimistic update local).
   * L'appel API + persistance disque est géré par le caller (pages/index.vue).
   */
  function setLiked(generationId: string, liked: boolean) {
    const idx = generations.value.findIndex((g) => g.generationId === generationId)
    if (idx === -1) return
    const next = generations.value.slice()
    next[idx] = { ...next[idx]!, liked }
    generations.value = next
  }

  async function start(payload: {
    prompts: string[]
    modelIds: string[]
    ratio: Ratio
    quality?: Quality
    nbImagesPerPrompt?: number
    seed?: number | null
    phase?: Phase
    promptVariant?: 'A' | 'B' | 'C'
  }) {
    const activePrompts = payload.prompts.filter((p) => p.trim().length > 0)
    if (activePrompts.length === 0 || payload.modelIds.length === 0) {
      log.warn('start() ignored — no active prompts or models', { prompts: activePrompts.length, models: payload.modelIds.length })
      return
    }
    log.info(`start() ${activePrompts.length} prompts × ${payload.modelIds.length} models, ratio=${payload.ratio}`)

    const phase = payload.phase ?? 'wireframe'
    const promptVariant = payload.promptVariant ?? 'A'
    reset(activePrompts, payload.modelIds, phase, promptVariant)
    inProgress.value = true
    const ctrl = new AbortController()
    abortController.value = ctrl

    // Récupérer le brief en localStorage si présent (l'attacher en DB pour la galerie)
    let brief: unknown = undefined
    if (typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem(BRIEF_STORAGE_KEY)
        if (raw) brief = JSON.parse(raw)
      } catch {}
    }

    // EPIC-18 / STORY-124 — overrides utilisateur scope=global, par modèle.
    // STORY-124 v3 : `cleanOverridesForServer` filtre le shadow store canonique.
    const { cleanOverridesForServer } = useModelParams()
    // EPIC-18 / STORY-128 — overrides scope=per-generation (seed verrouillée, image ref)
    const { allOverrides: allPerGenOverrides } = usePerGenerationParams()

    try {
      // STORY-096 : on passe le sessionId actif pour rattacher les nouvelles
      // generations à la session courante (pattern conversation ChatGPT).
      const reusedSessionId = activeSession.activeId.value ?? undefined
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          prompts: activePrompts,
          brief,
          sessionId: reusedSessionId,
          phase,
          promptVariant,
          globalParams: cleanOverridesForServer.value,
          perGenerationParams: allPerGenOverrides.value,
        }),
        signal: ctrl.signal,
      })
      if (!res.ok || !res.body) {
        log.error(`/api/generate failed status=${res.status}`)
        inProgress.value = false
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
          let data: any
          try { data = JSON.parse(dataStr) } catch { continue }

          if (eventName === 'session') {
            log.debug(`SSE event=session sessionId=${data.sessionId} name=${data.sessionName ?? '(null)'}`)
            sessionId.value = data.sessionId
            // STORY-096 : persiste l'ID + nom pour reprise au reload
            activeSession.setFromGenerate(data.sessionId, data.sessionName ?? null)
          } else if (eventName === 'result') {
            log.debug(`SSE event=result taskId=${data.taskId} status=${data.status}`)
            const idx = generations.value.findIndex((g: LiveGeneration) => g.taskId === data.taskId)
            const current = idx !== -1 ? generations.value[idx] : null
            if (!current) {
              log.warn(`SSE result with unknown taskId=${data.taskId}`)
            }
            if (current) {
              // Réassigner l'array entier (nouvelle référence) garantit que toutes
              // les `computed` consommatrices (ex: displayedCards) se ré-exécutent.
              // Une mutation par index ne déclenche pas toujours la réactivité dans Nuxt useState.
              const next = generations.value.slice()
              next[idx] = {
                ...current,
                generationId: data.generationId,
                status: data.status,
                imageDataUrl: data.imageDataUrl ?? null,
                seed: data.seed ?? null,
                costUsd: data.costUsd ?? 0,
                errorCode: data.errorCode ?? null,
                errorMsg: data.errorMsg ?? null,
                replayedFromVariant: data.replayedFromVariant,
              }
              generations.value = next
              if (data.status === 'success' && data.costUsd) {
                cost.addToSession(data.costUsd)
              }
            }
          } else if (eventName === 'done') {
            log.info('SSE event=done')
            inProgress.value = false
          }
        }
      }
    } catch (err) {
      log.error('SSE stream error', err)
    } finally {
      inProgress.value = false
      abortController.value = null
    }
  }

  function stop() {
    log.warn('stop() called by user')
    abortController.value?.abort()
    inProgress.value = false
  }

  return { sessionId, generations, inProgress, start, stop, setLiked }
}
