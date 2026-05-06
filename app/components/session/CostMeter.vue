<template>
  <div v-if="compact" class="flex flex-col gap-0.5 text-[11px] leading-tight" data-testid="cost-meter-compact">
    <div class="flex items-center justify-between gap-2">
      <span class="text-text-dim uppercase tracking-wider text-[9px]">Session</span>
      <span class="font-mono text-text">${{ sessionCost.toFixed(2) }}</span>
    </div>
    <div class="flex items-center justify-between gap-2">
      <span class="text-text-dim uppercase tracking-wider text-[9px]">Mois</span>
      <span class="font-mono text-text">${{ monthlyCost.toFixed(2) }}</span>
    </div>
  </div>
  <div v-else class="glass px-4 py-2 flex items-center gap-4 text-sm">
    <div>
      <div class="text-xs text-text-dim">Session</div>
      <div class="font-mono text-text">${{ sessionCost.toFixed(3) }}</div>
    </div>
    <div class="w-px h-8 bg-glass-border" />
    <div>
      <div class="text-xs text-text-dim">Mois en cours</div>
      <div class="font-mono text-text">${{ monthlyCost.toFixed(3) }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ compact?: boolean }>(), { compact: false })
const { sessionCost, monthlyCost, loadMonthly } = useCostMeter()
onMounted(loadMonthly)
</script>
