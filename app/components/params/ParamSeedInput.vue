<template>
  <div class="flex items-center gap-2 w-full">
    <input
      type="number"
      class="seed-input flex-1"
      :min="field.min ?? 0"
      :max="field.max ?? 2147483647"
      :placeholder="'aléatoire'"
      :value="props.modelValue ?? ''"
      :disabled="disabled"
      :aria-label="field.label"
      @input="onInput($event)"
    />
    <button
      type="button"
      class="seed-btn"
      :disabled="disabled"
      :aria-label="`${field.label} aléatoire`"
      title="Tirer une seed au hasard"
      @click="randomize"
    >🎲</button>
    <button
      type="button"
      class="seed-btn"
      :disabled="disabled || props.modelValue == null"
      :aria-label="`Effacer ${field.label}`"
      title="Effacer la seed"
      @click="clear"
    >✕</button>
  </div>
</template>

<script setup lang="ts">
import type { ParamFieldMetaDTO } from '#shared/contracts'

const props = defineProps<{
  field: ParamFieldMetaDTO
  modelValue: number | null | undefined
  disabled?: boolean
}>()
const emit = defineEmits<{ (e: 'update:modelValue', v: number | null): void }>()

function onInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value
  if (raw === '') { emit('update:modelValue', null); return }
  const n = parseInt(raw, 10)
  if (!Number.isNaN(n)) emit('update:modelValue', n)
}

function randomize() {
  const max = (props.field.max ?? 2147483647) as number
  const v = Math.floor(Math.random() * max)
  emit('update:modelValue', v)
}

function clear() {
  emit('update:modelValue', null)
}
</script>

<style scoped>
.seed-input {
  padding: 0.375rem 0.5rem;
  font-size: 0.8125rem;
  color: var(--color-text);
  background: var(--color-glass);
  border: 1px solid var(--color-glass-border);
  border-radius: 0.25rem;
  font-variant-numeric: tabular-nums;
}
.seed-input:disabled { opacity: 0.4; cursor: not-allowed; }
.seed-btn {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
  color: var(--color-text-muted);
  background: var(--color-glass);
  border: 1px solid var(--color-glass-border);
  border-radius: 0.25rem;
  cursor: pointer;
  transition: color 0.15s, background 0.15s;
}
.seed-btn:hover:not(:disabled) { color: var(--color-text); background: var(--color-accent-subtle); }
.seed-btn:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
