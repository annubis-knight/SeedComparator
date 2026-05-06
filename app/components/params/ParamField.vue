<template>
  <ParamRow :field="field">
    <component
      :is="component"
      :field="field"
      :model-value="modelValue"
      :disabled="disabled"
      @update:model-value="emit('update:modelValue', $event)"
    />
  </ParamRow>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ParamFieldMetaDTO } from '#shared/contracts'
import ParamRow from './ParamRow.vue'
import ParamSliderContinuous from './ParamSliderContinuous.vue'
import ParamSliderStepped from './ParamSliderStepped.vue'
import ParamSegmented from './ParamSegmented.vue'
import ParamSelect from './ParamSelect.vue'
import ParamRadio from './ParamRadio.vue'
import ParamToggle from './ParamToggle.vue'
import ParamSeedInput from './ParamSeedInput.vue'
import ParamTextarea from './ParamTextarea.vue'
import ParamNumberSpinner from './ParamNumberSpinner.vue'

const props = defineProps<{
  field: ParamFieldMetaDTO
  modelValue: unknown
  disabled?: boolean
}>()
const emit = defineEmits<{ (e: 'update:modelValue', v: unknown): void }>()

const component = computed(() => {
  switch (props.field.kind) {
    case 'slider-continuous': return ParamSliderContinuous
    case 'slider-stepped': return ParamSliderStepped
    case 'segmented': return ParamSegmented
    case 'select': return ParamSelect
    case 'radio': return ParamRadio
    case 'toggle': return ParamToggle
    case 'number-with-random': return ParamSeedInput
    case 'textarea': return ParamTextarea
    case 'number': return ParamNumberSpinner
    default: return ParamSegmented
  }
})
</script>
