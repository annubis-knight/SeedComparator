<template>
  <div class="space-y-6">
    <ModelSelector v-model="selectedModel" :models="models" />

    <div class="pt-4 border-t border-glass-border">
      <BudgetSlider
        v-model="budget"
        :models="models"
        @apply="onApply"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ModelDTO } from '#shared/contracts'

const props = defineProps<{ selected: string[]; models: ModelDTO[] }>()
const emit = defineEmits<{ (e: 'update:selected', value: string[]): void }>()

const selectedModel = computed({
  get: () => props.selected,
  set: (v: string[]) => emit('update:selected', v),
})

// Budget = état local du slider. Persiste pendant la session, ne suit pas
// les clics manuels sur les checkboxes (comportement "aide bulk", FR-055).
const budget = ref(0)

function onApply(ids: string[]) {
  emit('update:selected', ids)
}
</script>
