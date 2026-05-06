<template>
  <div class="w-full">
    <textarea
      class="param-textarea"
      :value="value"
      :disabled="disabled"
      :maxlength="field.maxLength ?? undefined"
      :aria-label="field.label"
      :placeholder="field.tooltip"
      rows="2"
      @input="onInput($event)"
    />
    <div v-if="field.maxLength" class="text-[10px] text-text-dim text-right mt-1">
      {{ value.length }} / {{ field.maxLength }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ParamFieldMetaDTO } from '#shared/contracts'

const props = defineProps<{
  field: ParamFieldMetaDTO
  modelValue: string | null | undefined
  disabled?: boolean
}>()
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()

const value = computed<string>(() => {
  if (typeof props.modelValue === 'string') return props.modelValue
  if (typeof props.field.default === 'string') return props.field.default
  return ''
})

function onInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLTextAreaElement).value)
}
</script>

<style scoped>
.param-textarea {
  width: 100%;
  min-height: 60px;
  max-height: 160px;
  padding: 0.5rem 0.625rem;
  font-size: 0.8125rem;
  color: var(--color-text);
  background: var(--color-glass);
  border: 1px solid var(--color-glass-border);
  border-radius: 0.25rem;
  resize: vertical;
}
.param-textarea:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
