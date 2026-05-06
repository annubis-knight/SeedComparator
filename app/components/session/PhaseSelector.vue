<template>
  <div class="flex items-center gap-1" role="tablist" aria-label="Phase de génération" data-testid="phase-selector">
    <button
      v-for="phase in PHASES"
      :key="phase.id"
      type="button"
      role="tab"
      :aria-selected="modelValue === phase.id"
      :data-testid="`phase-tab-${phase.id}`"
      class="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
      :class="modelValue === phase.id
        ? 'border-accent bg-accent-subtle text-text'
        : 'border-glass-border text-text-muted hover:text-text hover:border-text-dim'"
      @click="$emit('update:modelValue', phase.id)"
    >
      {{ phase.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
import type { Phase } from '#shared/contracts'
import { PHASE_LABELS } from '#shared/contracts'

defineProps<{ modelValue: Phase }>()
defineEmits<{ (e: 'update:modelValue', value: Phase): void }>()

const PHASES: Array<{ id: Phase; label: string }> = [
  { id: 'wireframe', label: PHASE_LABELS.wireframe },
  { id: 'mood', label: PHASE_LABELS.mood },
  { id: 'uiux', label: PHASE_LABELS.uiux },
]
</script>
