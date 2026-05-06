<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      data-testid="helper-modal-overlay"
      @click.self="$emit('update:modelValue', false)"
    >
      <div
        class="glass w-full max-w-2xl flex flex-col rounded-2xl overflow-hidden"
        style="max-height: 80vh"
        data-testid="helper-modal"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-glass-border shrink-0">
          <div>
            <div class="font-semibold text-sm">Assistant créatif</div>
            <div class="text-xs text-text-dim">Phase : {{ phaseLabel }}</div>
          </div>
          <button
            class="text-text-muted hover:text-text transition-colors p-1"
            data-testid="helper-modal-close"
            @click="$emit('update:modelValue', false)"
          >✕</button>
        </div>

        <!-- Messages -->
        <div
          ref="scrollEl"
          class="flex-1 overflow-y-auto p-4 space-y-3 min-h-0"
          data-testid="helper-messages"
        >
          <div
            v-if="state.messages.length === 0 && !state.loading"
            class="text-center text-text-muted text-sm py-8"
          >
            Décris ton projet, ton ambiance ou demande directement des prompts.
          </div>

          <div
            v-for="(msg, i) in state.messages"
            :key="i"
            class="flex flex-col gap-1"
            :class="msg.role === 'user' ? 'items-end' : 'items-start'"
          >
            <div
              class="max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap"
              :class="msg.role === 'user'
                ? 'bg-accent/20 text-text border border-accent/30'
                : 'bg-bg-elevated text-text border border-glass-border'"
              :data-testid="`helper-msg-${msg.role}`"
            >
              <!-- Render assistant messages with prompt block extraction -->
              <template v-if="msg.role === 'assistant'">
                <HelperMessageContent
                  :content="msg.content"
                  @insert="(prompt, idx) => $emit('insert', prompt, idx)"
                />
              </template>
              <template v-else>{{ msg.content }}</template>
            </div>
          </div>

          <!-- Loading indicator -->
          <div v-if="state.loading" class="flex items-start gap-2" data-testid="helper-loading">
            <div class="bg-bg-elevated border border-glass-border rounded-xl px-3 py-2 text-sm text-text-dim">
              <span class="animate-pulse">Réflexion en cours…</span>
            </div>
          </div>

          <!-- Error -->
          <div v-if="state.error" class="text-danger text-xs text-center" data-testid="helper-error">
            {{ state.error }}
          </div>
        </div>

        <!-- Input -->
        <div class="shrink-0 border-t border-glass-border p-3 flex gap-2">
          <textarea
            v-model="inputText"
            class="flex-1 bg-bg-elevated border border-glass-border rounded-lg px-3 py-2 text-sm resize-none text-text placeholder:text-text-muted focus:outline-none focus:border-accent/60 transition-colors"
            :placeholder="inputPlaceholder"
            rows="2"
            data-testid="helper-input"
            @keydown.enter.exact.prevent="handleSend"
          />
          <button
            class="px-4 py-2 rounded-lg bg-accent text-bg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-opacity self-end"
            :disabled="!inputText.trim() || state.loading"
            data-testid="helper-send-btn"
            @click="handleSend"
          >Envoyer</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { Phase } from '#shared/contracts'
import { PHASE_LABELS } from '#shared/contracts'
import { useHelperChat } from '~/composables/useHelperChat'

const props = defineProps<{
  modelValue: boolean
  sessionId: string | null
  phase: Phase
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'insert', prompt: string, variantIdx: number): void
}>()

const sessionIdRef = computed(() => props.sessionId)
const phaseRef = computed(() => props.phase)
const { state, send, loadHistory } = useHelperChat(sessionIdRef, phaseRef)

const inputText = ref('')
const scrollEl = ref<HTMLElement | null>(null)

const phaseLabel = computed(() => PHASE_LABELS[props.phase])

const inputPlaceholder = computed(() =>
  props.sessionId
    ? 'Décris ton projet, demande des prompts… (Entrée pour envoyer)'
    : 'Lance une session pour utiliser l\'assistant',
)

watch(() => props.modelValue, async (open) => {
  if (open) {
    await loadHistory()
    await nextTick()
    scrollToBottom()
  }
})

watch(() => state.value.messages.length, async () => {
  await nextTick()
  scrollToBottom()
})

function scrollToBottom() {
  if (scrollEl.value) scrollEl.value.scrollTop = scrollEl.value.scrollHeight
}

async function handleSend() {
  const text = inputText.value.trim()
  if (!text || state.value.loading || !props.sessionId) return
  inputText.value = ''
  await send(text)
}
</script>
