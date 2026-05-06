<template>
  <div class="flex items-center gap-2" role="tablist" aria-label="Sélection du prompt actif">
    <span class="text-xs text-text-dim uppercase tracking-wider">Prompt</span>
    <div class="flex gap-1">
      <button
        type="button"
        role="tab"
        :aria-selected="modelValue === 'all'"
        data-testid="switch-prompt-all"
        class="px-3 py-1 rounded-md text-sm border transition-colors"
        :class="modelValue === 'all'
          ? 'border-accent bg-accent-subtle text-text'
          : 'border-glass-border text-text-muted hover:text-text'"
        @click="$emit('update:modelValue', 'all')"
      >Tous</button>
      <button
        v-for="(label, i) in availableLabels"
        :key="label"
        type="button"
        role="tab"
        :aria-selected="modelValue === i"
        :data-testid="`switch-prompt-${label}`"
        class="px-3 py-1 rounded-md text-sm border transition-colors"
        :class="modelValue === i
          ? 'border-accent bg-accent-subtle text-text'
          : 'border-glass-border text-text-muted hover:text-text'"
        @click="$emit('update:modelValue', i)"
      >{{ label }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
const TAB_LABELS = ['A', 'B', 'C'] as const

export type PromptSwitcherValue = number | 'all'

const props = defineProps<{ modelValue: PromptSwitcherValue; promptCount: number }>()
defineEmits<{ (e: 'update:modelValue', value: PromptSwitcherValue): void }>()

const availableLabels = computed(() => TAB_LABELS.slice(0, Math.max(1, Math.min(3, props.promptCount))))
</script>
