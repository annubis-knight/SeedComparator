<template>
  <select
    class="param-select"
    :value="String(currentValue)"
    :disabled="disabled"
    :aria-label="field.label"
    @change="onChange($event)"
  >
    <option v-for="opt in field.options ?? []" :key="String(opt.value)" :value="String(opt.value)">{{ opt.label }}</option>
  </select>
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

function onChange(e: Event) {
  const raw = (e.target as HTMLSelectElement).value
  // On retrouve la valeur typée d'origine (string ou number) parmi les options.
  const opts = props.field.options ?? []
  const found = opts.find((o) => String(o.value) === raw)
  emit('update:modelValue', found?.value ?? raw)
}
</script>

<style scoped>
.param-select {
  width: 100%;
  padding: 0.375rem 0.5rem;
  font-size: 0.8125rem;
  color: var(--color-text);
  background: var(--color-glass);
  border: 1px solid var(--color-glass-border);
  border-radius: 0.25rem;
  cursor: pointer;
}
.param-select:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
