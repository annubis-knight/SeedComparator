<template>
  <div class="glass p-5 space-y-4" data-testid="crawl-progress">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-semibold text-text uppercase tracking-wider">Analyse en cours</h3>
      <AppButton variant="ghost" data-testid="cancel-btn" @click="$emit('cancel')">Annuler</AppButton>
    </div>

    <ul v-if="state.urlsState.length > 0" class="space-y-2">
      <li
        v-for="(u, i) in state.urlsState"
        :key="i"
        class="flex items-center gap-3 text-sm"
      >
        <span class="w-5 text-center" :class="iconClass(u.status)">{{ statusIcon(u.status) }}</span>
        <span class="flex-1 truncate">{{ u.url }}</span>
        <span class="text-xs text-text-dim font-mono">{{ statusLabel(u.status) }}</span>
        <span v-if="u.errorMsg" class="text-xs text-danger truncate max-w-[20ch]">{{ u.errorMsg }}</span>
      </li>
    </ul>

    <div class="text-sm flex items-center gap-3 pt-2 border-t border-glass-border">
      <span class="w-5 text-center">{{ state.llmStarted ? '⏳' : '⏸' }}</span>
      <span class="flex-1">Génération des 3 prompts (Claude Haiku 4.5)</span>
      <span class="text-xs text-text-dim font-mono">{{ state.llmStarted ? 'en cours' : 'en attente' }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { BriefStep } from '~/composables/useBriefAssistant'

defineProps<{ state: Extract<BriefStep, { kind: 'running' }> }>()
defineEmits<{ (e: 'cancel'): void }>()

function statusIcon(s: string) {
  switch (s) {
    case 'pending': return '⏸'
    case 'crawling': return '⏳'
    case 'screenshot': return '⏳'
    case 'palette': return '⏳'
    case 'vision': return '⏳'
    case 'done': return '✓'
    case 'error': return '✕'
    default: return '·'
  }
}

function statusLabel(s: string) {
  switch (s) {
    case 'pending': return 'en attente'
    case 'crawling': return 'fetch html…'
    case 'screenshot': return 'screenshot…'
    case 'palette': return 'palette…'
    case 'vision': return 'analyse vision…'
    case 'done': return 'OK'
    case 'error': return 'erreur'
    default: return ''
  }
}

function iconClass(s: string): string {
  if (s === 'done') return 'text-success'
  if (s === 'error') return 'text-danger'
  if (s === 'pending') return 'text-text-dim'
  return 'text-accent'
}
</script>
