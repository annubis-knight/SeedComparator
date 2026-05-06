import type { Phase } from '#shared/contracts'
import type { HelperMessage } from '#shared/contracts'
import { createLogger } from '../utils/logger'

const log = createLogger('useHelperChat')

export interface HelperChatState {
  messages: HelperMessage[]
  loading: boolean
  error: string | null
}

// @requirement: FR-073, FR-074 (STORY-108/109)
export function useHelperChat(sessionIdRef: Ref<string | null>, phaseRef: Ref<Phase>) {
  const state = ref<HelperChatState>({ messages: [], loading: false, error: null })

  async function loadHistory() {
    const sessionId = sessionIdRef.value
    if (!sessionId) return
    try {
      const res = await $fetch<{ messages: HelperMessage[] }>('/api/helper/conversation', {
        query: { sessionId, phase: phaseRef.value },
      })
      state.value.messages = res.messages
    } catch (err) {
      log.error('loadHistory failed', { msg: (err as Error).message })
    }
  }

  async function send(content: string) {
    const sessionId = sessionIdRef.value
    if (!sessionId || !content.trim()) return

    const userMsg: HelperMessage = { role: 'user', content: content.trim() }
    state.value.messages = [...state.value.messages, userMsg]
    state.value.loading = true
    state.value.error = null

    try {
      const res = await $fetch<{ reply: string }>('/api/helper/chat', {
        method: 'POST',
        body: {
          sessionId,
          phase: phaseRef.value,
          messages: state.value.messages,
        },
      })
      state.value.messages = [...state.value.messages, { role: 'assistant', content: res.reply }]
    } catch (err) {
      log.error('send failed', { msg: (err as Error).message })
      state.value.error = 'Une erreur est survenue. Réessaie.'
      // revert optimistic user message
      state.value.messages = state.value.messages.slice(0, -1)
    } finally {
      state.value.loading = false
    }
  }

  function reset() {
    state.value = { messages: [], loading: false, error: null }
  }

  watch(phaseRef, () => {
    reset()
    void loadHistory()
  })

  return { state, send, loadHistory, reset }
}
