<template>
  <div role="radiogroup" :aria-label="field.label" class="flex gap-3">
    <label v-for="opt in field.options ?? []" :key="String(opt.value)" class="radio-item">
      <input
        type="radio"
        class="accent-accent"
        :name="groupName"
        :value="String(opt.value)"
        :checked="String(currentValue) === String(opt.value)"
        :disabled="disabled"
        @change="emit('update:modelValue', opt.value)"
      />
      <span>{{ opt.label }}</span>
    </label>
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
const groupName = `radio-${props.field.key}-${Math.random().toString(36).slice(2, 7)}`
</script>

<style scoped>
.radio-item {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  cursor: pointer;
}
.radio-item:hover { color: var(--color-text); }
</style>
