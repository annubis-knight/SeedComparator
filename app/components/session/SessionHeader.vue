<template>
  <div class="space-y-2" data-testid="session-header">
    <div class="flex items-center gap-2">
      <span class="text-[10px] uppercase tracking-wider text-text-dim font-mono shrink-0">Session</span>
      <input
        v-if="editing"
        ref="inputRef"
        v-model="draft"
        type="text"
        class="input-glass flex-1 text-sm"
        data-testid="session-name-input"
        @keydown.enter="saveName"
        @keydown.escape="cancelEdit"
        @blur="saveName"
      />
      <button
        v-else
        type="button"
        class="text-sm text-text truncate text-left hover:text-accent transition-colors flex-1"
        :title="displayName"
        data-testid="session-name-display"
        @click="startEdit"
      >{{ displayName }}</button>
    </div>

    <div class="flex gap-2">
      <button
        type="button"
        class="btn-ghost text-xs flex-1"
        title="Démarrer une nouvelle session"
        data-testid="new-session-btn"
        @click="$emit('new-session')"
      >+ Nouvelle session</button>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  /** Nom de la session active (ou null si pas encore de session). */
  name: string | null
}>()

const emit = defineEmits<{
  (e: 'new-session'): void
  (e: 'rename', newName: string): void
}>()

const editing = ref(false)
const draft = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

const displayName = computed(() => props.name ?? 'Nouvelle session')

function startEdit() {
  draft.value = props.name ?? ''
  editing.value = true
  nextTick(() => inputRef.value?.focus())
}

function saveName() {
  if (!editing.value) return
  const trimmed = draft.value.trim()
  editing.value = false
  if (trimmed && trimmed !== props.name) {
    emit('rename', trimmed)
  }
}

function cancelEdit() {
  editing.value = false
  draft.value = ''
}
</script>
