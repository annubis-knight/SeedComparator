<template>
  <div class="flex items-center gap-3 w-full">
    <input
      type="range"
      class="flex-1 accent-accent"
      :min="field.min ?? 1"
      :max="field.max ?? 50"
      step="1"
      :value="numericValue"
      :disabled="disabled"
      :aria-label="field.label"
      @input="onInput($event)"
    />
    <span class="text-xs text-text tabular-nums w-10 text-right">{{ numericValue }}</span>
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
  return props.field.min ?? 1
})

function onInput(e: Event) {
  emit('update:modelValue', parseInt((e.target as HTMLInputElement).value, 10))
}
</script>
