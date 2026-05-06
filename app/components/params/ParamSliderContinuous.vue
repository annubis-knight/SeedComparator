<template>
  <div class="flex items-center gap-3 w-full">
    <input
      type="range"
      class="flex-1 accent-accent"
      :min="field.min ?? 0"
      :max="field.max ?? 100"
      :step="field.step ?? 0.1"
      :value="numericValue"
      :disabled="disabled"
      :aria-label="field.label"
      @input="onInput($event)"
    />
    <span class="text-xs text-text tabular-nums w-12 text-right">{{ formatted }}</span>
  </div>
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

const numericValue = computed<number>(() => {
  if (typeof props.modelValue === 'number') return props.modelValue
  if (typeof props.field.default === 'number') return props.field.default
  return props.field.min ?? 0
})

const formatted = computed(() => {
  const step = props.field.step ?? 0.1
  const decimals = step >= 1 ? 0 : Math.max(0, -Math.floor(Math.log10(step)))
  return numericValue.value.toFixed(decimals)
})

function onInput(e: Event) {
  const v = parseFloat((e.target as HTMLInputElement).value)
  emit('update:modelValue', v)
}
</script>
