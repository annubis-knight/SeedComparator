<template>
  <div class="param-row">
    <div class="param-label">
      <span>{{ field.label }}</span>
      <InfoTooltip :text="field.tooltip" placement="right" />
    </div>
    <div class="param-control">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import InfoTooltip from '../ui/InfoTooltip.vue'
import type { ParamFieldMetaDTO } from '#shared/contracts'

defineProps<{ field: ParamFieldMetaDTO }>()
</script>

<style scoped>
.param-row {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.5rem 0;
}
.param-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}
.param-control {
  width: 100%;
}
</style>
