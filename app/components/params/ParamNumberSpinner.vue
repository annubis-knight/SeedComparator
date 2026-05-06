<template>
  <input
    type="number"
    class="number-spinner"
    :min="field.min"
    :max="field.max"
    :step="field.step ?? 1"
    :value="value"
    :disabled="disabled"
    :aria-label="field.label"
    @input="onInput($event)"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ParamFieldMetaDTO } from '#shared/contracts'

const props = defineProps<{
  field: ParamFieldMetaDTO
  modelValue: number | null | undefined
  disabled?: boolean
}>()
const emit = defineEmits<{ (e: 'update:modelValue', v: number): void }>()

const value = computed<number>(() => {
  if (typeof props.modelValue === 'number') return props.modelValue
  if (typeof props.field.default === 'number') return props.field.default
  return props.field.min ?? 0
})

function onInput(e: Event) {
  const n = parseInt((e.target as HTMLInputElement).value, 10)
  if (!Number.isNaN(n)) emit('update:modelValue', n)
}
</script>

<style scoped>
.number-spinner {
  width: 80px;
  padding: 0.375rem 0.5rem;
  font-size: 0.8125rem;
  color: var(--color-text);
  background: var(--color-glass);
  border: 1px solid var(--color-glass-border);
  border-radius: 0.25rem;
  font-variant-numeric: tabular-nums;
}
.number-spinner:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
