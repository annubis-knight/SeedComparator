<template>
  <div role="radiogroup" :aria-label="field.label" class="seg-group" @keydown="onKeydown">
    <button
      v-for="opt in field.options ?? []"
      :key="String(opt.value)"
      type="button"
      role="radio"
      :aria-checked="String(currentValue) === String(opt.value)"
      :disabled="disabled"
      class="seg-pill"
      :class="{ 'seg-pill-active': String(currentValue) === String(opt.value) }"
      @click="select(opt.value)"
    >{{ opt.label }}</button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ParamFieldMetaDTO } from '#shared/contracts'

const props = defineProps<{
  field: ParamFieldMetaDTO
  modelValue: string | number | null | undefined
  disabled?: boolean
}>()
const emit = defineEmits<{ (e: 'update:modelValue', v: string | number): void }>()

const currentValue = computed(() => props.modelValue ?? props.field.default)

function select(v: string | number) {
  if (props.disabled) return
  emit('update:modelValue', v)
}

function onKeydown(e: KeyboardEvent) {
  const opts = props.field.options ?? []
  if (opts.length === 0) return
  const i = opts.findIndex((o) => String(o.value) === String(currentValue.value))
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
    e.preventDefault()
    select(opts[(i + 1 + opts.length) % opts.length]!.value)
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
    e.preventDefault()
    select(opts[(i - 1 + opts.length) % opts.length]!.value)
  } else if (e.key === 'Home') {
    e.preventDefault()
    select(opts[0]!.value)
  } else if (e.key === 'End') {
    e.preventDefault()
    select(opts[opts.length - 1]!.value)
  }
}
</script>

<style scoped>
.seg-group {
  display: inline-flex;
  background: var(--color-glass);
  border: 1px solid var(--color-glass-border);
  border-radius: 0.375rem;
  padding: 2px;
  gap: 2px;
  flex-wrap: wrap;
}
.seg-pill {
  padding: 0.25rem 0.625rem;
  font-size: 0.75rem;
  color: var(--color-text-muted);
  background: transparent;
  border: 0;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.seg-pill:hover:not(:disabled) { color: var(--color-text); }
.seg-pill-active {
  background: var(--color-accent-subtle);
  color: var(--color-text);
}
.seg-pill:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
