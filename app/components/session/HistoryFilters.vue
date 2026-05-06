<template>
  <div class="flex items-center gap-2 flex-wrap" data-testid="history-filters">
    <!-- Toggle likées uniquement -->
    <button
      type="button"
      class="text-xs px-3 py-1.5 rounded-lg border transition-colors"
      :class="filters.likedOnly
        ? 'border-danger bg-danger/10 text-danger'
        : 'border-glass-border text-text-muted hover:text-text'"
      data-testid="filter-liked-toggle"
      @click="filters.likedOnly = !filters.likedOnly"
    >❤ Likées {{ filters.likedOnly ? '· actif' : '' }}</button>

    <!-- Filtre phase -->
    <select
      v-model="filters.phase"
      class="text-xs bg-bg-elevated border border-glass-border rounded-lg px-2 py-1.5 text-text-muted"
      data-testid="filter-phase-select"
    >
      <option value="all">Toutes phases</option>
      <option value="wireframe">Wireframe</option>
      <option value="mood">Mood</option>
      <option value="uiux">UI/UX Design</option>
    </select>

    <!-- Filtre variant -->
    <select
      v-model="filters.variant"
      class="text-xs bg-bg-elevated border border-glass-border rounded-lg px-2 py-1.5 text-text-muted"
      data-testid="filter-variant-select"
    >
      <option value="all">Tous variants</option>
      <option value="A">Variant A</option>
      <option value="B">Variant B</option>
      <option value="C">Variant C</option>
    </select>

    <!-- Reset -->
    <button
      v-if="hasActiveFilters"
      type="button"
      class="text-xs text-text-muted hover:text-text px-2"
      data-testid="filter-reset"
      @click="$emit('reset')"
    >✕ Réinitialiser</button>
  </div>
</template>

<script setup lang="ts">
import type { HistoryFilters } from '~/composables/useHistoryFilters'

const props = defineProps<{ filters: HistoryFilters }>()
defineEmits<{ (e: 'reset'): void }>()

const hasActiveFilters = computed(() =>
  props.filters.likedOnly ||
  props.filters.phase !== 'all' ||
  props.filters.variant !== 'all' ||
  props.filters.modelIds.length > 0,
)
</script>
