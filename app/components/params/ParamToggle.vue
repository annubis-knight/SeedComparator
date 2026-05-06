<template>
  <button
    type="button"
    role="switch"
    :aria-checked="isOn"
    :aria-label="field.label"
    :disabled="disabled"
    class="toggle"
    :class="{ 'toggle-on': isOn }"
    @click="toggle"
    @keydown.space.prevent="toggle"
  >
    <span class="toggle-knob" :class="{ 'toggle-knob-on': isOn }" />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ParamFieldMetaDTO } from '#shared/contracts'

const props = defineProps<{
  field: ParamFieldMetaDTO
  modelValue: boolean | null | undefined
  disabled?: boolean
}>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>()

const isOn = computed<boolean>(() => {
  if (typeof props.modelValue === 'boolean') return props.modelValue
  return Boolean(props.field.default)
})

function toggle() {
  if (props.disabled) return
  emit('update:modelValue', !isOn.value)
}
</script>

<style scoped>
.toggle {
  position: relative;
  width: 36px;
  height: 20px;
  padding: 2px;
  border-radius: 9999px;
  background: var(--color-glass);
  border: 1px solid var(--color-glass-border);
  cursor: pointer;
  transition: background 0.15s;
}
.toggle:disabled { opacity: 0.4; cursor: not-allowed; }
.toggle-on { background: var(--color-accent-subtle); border-color: var(--color-accent); }
.toggle-knob {
  display: block;
  width: 14px;
  height: 14px;
  border-radius: 9999px;
  background: var(--color-text-muted);
  transition: transform 0.15s, background 0.15s;
  transform: translateX(0);
}
.toggle-knob-on { background: var(--color-accent); transform: translateX(16px); }
</style>
