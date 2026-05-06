<template>
  <div class="space-y-3" data-testid="budget-slider">
    <div class="flex items-baseline justify-between gap-3">
      <label class="text-xs uppercase tracking-wider text-text-dim font-mono">Budget max par image</label>
      <div class="flex items-center gap-2">
        <span class="text-text-dim text-sm">$</span>
        <input
          type="number"
          :min="MIN"
          :max="MAX"
          :step="STEP"
          :value="value.toFixed(3)"
          class="input-glass w-20 text-sm font-mono py-1 px-2 text-right"
          data-testid="budget-input"
          @input="onInputChange(($event.target as HTMLInputElement).value)"
        />
      </div>
    </div>

    <div class="px-1">
      <input
        type="range"
        :min="MIN"
        :max="MAX"
        :step="STEP"
        :value="value"
        class="budget-range w-full"
        data-testid="budget-range"
        @input="onRangeChange(($event.target as HTMLInputElement).value)"
      />
    </div>

    <div class="flex items-center justify-between text-[10px] text-text-dim font-mono">
      <span>$0.000</span>
      <span data-testid="budget-summary">{{ filteredCount }} / {{ models.length }} modèle{{ models.length > 1 ? 's' : '' }}</span>
      <span>${{ MAX.toFixed(3) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ModelDTO } from '#shared/contracts'

const MIN = 0
const MAX = 0.15
const STEP = 0.005

const props = withDefaults(defineProps<{
  models: ModelDTO[]
  /** Valeur actuelle du slider en USD. */
  modelValue?: number
}>(), { modelValue: 0 })

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
  /** Émet la liste des IDs des modèles dont prix ≤ valeur du slider. */
  (e: 'apply', selectedIds: string[]): void
}>()

const value = computed(() => props.modelValue)

const filteredIds = computed(() =>
  props.models
    .filter((m) => m.pricePerImage <= value.value)
    .map((m) => m.id),
)

const filteredCount = computed(() => filteredIds.value.length)

function applyValue(raw: number) {
  // Clamp + arrondi au STEP le plus proche pour cohérence affichage
  const clamped = Math.max(MIN, Math.min(MAX, raw))
  const rounded = Math.round(clamped / STEP) * STEP
  // Évite les artefacts flottants type 0.030000001
  const fixed = Number(rounded.toFixed(3))
  emit('update:modelValue', fixed)
  emit('apply', props.models.filter((m) => m.pricePerImage <= fixed).map((m) => m.id))
}

function onRangeChange(raw: string) {
  const n = Number.parseFloat(raw)
  if (Number.isFinite(n)) applyValue(n)
}

function onInputChange(raw: string) {
  const n = Number.parseFloat(raw)
  if (Number.isFinite(n)) applyValue(n)
}
</script>

<style scoped>
/* Style cohérent avec design slate doux du projet (FR-050) */
.budget-range {
  -webkit-appearance: none;
  appearance: none;
  height: 4px;
  background: var(--color-glass-border);
  border-radius: 9999px;
  outline: none;
  cursor: pointer;
}

.budget-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--color-accent);
  cursor: grab;
  border: 2px solid var(--color-bg);
  box-shadow: 0 2px 6px rgba(139, 127, 255, 0.3);
  transition: transform 120ms ease;
}

.budget-range::-webkit-slider-thumb:hover {
  transform: scale(1.15);
}

.budget-range::-webkit-slider-thumb:active {
  cursor: grabbing;
  transform: scale(1.05);
  box-shadow: 0 2px 10px rgba(139, 127, 255, 0.5);
}

.budget-range::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--color-accent);
  cursor: grab;
  border: 2px solid var(--color-bg);
  box-shadow: 0 2px 6px rgba(139, 127, 255, 0.3);
}
</style>
