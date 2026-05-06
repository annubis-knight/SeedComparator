<template>
  <!--
    EPIC-18 / STORY-124 v3 — Une ligne factorisée par paramètre canonique.
    L'utilisateur voit UN seul contrôle. Au changement, la valeur canonique est
    démultiplexée vers les valeurs natives de chaque modèle concerné via
    `applyCanonicalToModel` puis stockée dans `useModelParams`.
  -->
  <div class="canonical-row">
    <div class="canonical-head">
      <span class="canonical-label">{{ param.label }}</span>
      <InfoTooltip :text="param.tooltip" placement="right" />
      <span class="canonical-applies" :title="appliesToTooltip">
        Appliqué à {{ activeAppliesTo.length }} {{ activeAppliesTo.length > 1 ? 'modèles' : 'modèle' }}
      </span>
    </div>

    <div class="canonical-control">
      <!-- Slider stepped (qualité 1-5, effort 1-5) -->
      <div v-if="param.kind === 'slider-stepped'" class="flex items-center gap-3 w-full">
        <input
          type="range"
          class="flex-1 accent-accent"
          :min="param.min ?? 1"
          :max="param.max ?? 5"
          step="1"
          :value="numericValue"
          :aria-label="param.label"
          @input="onNumberInput($event)"
        />
        <span class="text-xs text-text tabular-nums w-20 text-right">{{ stepLabel }}</span>
      </div>

      <!-- Slider continuous (creativity 0-10) -->
      <div v-else-if="param.kind === 'slider-continuous'" class="flex items-center gap-3 w-full">
        <input
          type="range"
          class="flex-1 accent-accent"
          :min="param.min ?? 0"
          :max="param.max ?? 10"
          :step="param.step ?? 0.5"
          :value="numericValue"
          :aria-label="param.label"
          @input="onNumberInput($event)"
        />
        <span class="text-xs text-text tabular-nums w-12 text-right">{{ formattedNum }}</span>
      </div>

      <!-- Segmented (outputFormat, safetyLevel) -->
      <div
        v-else-if="param.kind === 'segmented'"
        role="radiogroup"
        :aria-label="param.label"
        class="seg-group"
      >
        <button
          v-for="opt in param.options ?? []"
          :key="String(opt.value)"
          type="button"
          role="radio"
          :aria-checked="String(currentValue) === String(opt.value)"
          class="seg-pill"
          :class="{ 'seg-pill-active': String(currentValue) === String(opt.value) }"
          @click="onSegmentedClick(opt.value)"
        >{{ opt.label }}</button>
      </div>

      <!-- Textarea (negativePrompt) -->
      <textarea
        v-else-if="param.kind === 'textarea'"
        class="param-textarea"
        :value="String(currentValue ?? '')"
        :maxlength="param.maxLength ?? undefined"
        :aria-label="param.label"
        :placeholder="param.tooltip"
        rows="2"
        @input="onTextareaInput($event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CanonicalParamDTO } from '#shared/canonicalParams'
import {
  CANONICAL_PARAMS,
  applyCanonicalToModel,
  type CanonicalKey,
} from '#shared/canonicalParams'
import InfoTooltip from '../ui/InfoTooltip.vue'
import { useModelParams } from '../../composables/useModelParams'

const props = defineProps<{
  /** DTO sérialisable (sans fonctions de mapping). */
  param: CanonicalParamDTO
  /** Modèles actuellement sélectionnés (pour ne propager qu'aux concernés). */
  selectedModelIds: string[]
}>()

const { setParam, getParams } = useModelParams()

/**
 * Modèles à la fois sélectionnés ET dans `appliesTo` du paramètre.
 * (param.appliesTo contient TOUS les modèles supportés par le canonique,
 * pas seulement ceux que l'utilisateur a sélectionnés.)
 */
const activeAppliesTo = computed(() =>
  props.param.appliesTo.filter((id) => props.selectedModelIds.includes(id)),
)

const appliesToTooltip = computed(() => activeAppliesTo.value.join(' · '))

/**
 * Valeur canonique courante : on la déduit en regardant le premier modèle
 * concerné, et en cherchant quelle valeur canonique produit l'override
 * actuellement stocké. Si rien ne match → on retombe sur le défaut canonique.
 *
 * Heuristique simple : on teste les valeurs candidates et on prend la
 * première qui correspond (utile pour segmented/slider à crans). Pour les
 * sliders continus on stocke la valeur canonique en "ombre" via une
 * convention (cf. shadow store ci-dessous).
 */
const SHADOW_KEY = '__canonical__'

const currentValue = computed<unknown>(() => {
  const firstModel = activeAppliesTo.value[0]
  if (!firstModel) return props.param.default

  // Lecture prioritaire : la valeur canonique mémoire (shadow) — fiable pour
  // les sliders continus dont l'inversion empêche le reverse-mapping exact.
  const shadow = getShadow(firstModel, props.param.key)
  if (shadow !== undefined) return shadow
  return props.param.default
})

const numericValue = computed(() => Number(currentValue.value))
const formattedNum = computed(() => {
  const step = props.param.step ?? 0.5
  const decimals = step >= 1 ? 0 : Math.max(0, -Math.floor(Math.log10(step)))
  return numericValue.value.toFixed(decimals)
})
const stepLabel = computed(() => {
  const opts = props.param.options ?? []
  const found = opts.find((o) => Number(o.value) === numericValue.value)
  return found ? `${numericValue.value} · ${found.label}` : String(numericValue.value)
})

function onNumberInput(e: Event) {
  const v = Number((e.target as HTMLInputElement).value)
  applyCanonical(v)
}
function onSegmentedClick(v: string | number) {
  applyCanonical(v)
}
function onTextareaInput(e: Event) {
  applyCanonical((e.target as HTMLTextAreaElement).value)
}

/**
 * Démultiplexe la valeur canonique vers chaque modèle concerné :
 *  - mémorise la valeur canonique elle-même (shadow) — pour le rendu inverse
 *  - calcule les overrides natifs et les écrit dans `useModelParams`
 */
function applyCanonical(canonicalValue: unknown) {
  for (const modelId of activeAppliesTo.value) {
    setShadow(modelId, props.param.key, canonicalValue)
    const overrides = applyCanonicalToModel(props.param.key as CanonicalKey, canonicalValue, modelId)
    for (const [traitKey, nativeValue] of Object.entries(overrides)) {
      setParam(modelId, traitKey, nativeValue)
    }
  }
}

/**
 * Shadow store : on garde la valeur canonique elle-même (pour le rendu UI
 * inverse) à l'intérieur de `useModelParams`, sous une clé préfixée. Le
 * server ignore les clés inconnues (validation stricte côté Zod : il faut
 * filtrer côté envoi → voir useGenerationSession).
 *
 * Alternative : un autre composable. On préfère mutualiser pour garder un
 * seul "source of truth" par modèle, et un seul reset.
 */
function shadowKeyFor(canonicalKey: string): string {
  return `${SHADOW_KEY}${canonicalKey}`
}
function getShadow(modelId: string, canonicalKey: string): unknown {
  const params = getParams(modelId)
  return params[shadowKeyFor(canonicalKey)]
}
function setShadow(modelId: string, canonicalKey: string, value: unknown) {
  setParam(modelId, shadowKeyFor(canonicalKey), value)
}
</script>

<style scoped>
.canonical-row {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.5rem 0;
}
.canonical-head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}
.canonical-label {
  font-weight: 500;
}
.canonical-applies {
  margin-left: auto;
  font-size: 0.6875rem;
  color: var(--color-text-dim);
  cursor: help;
}
.canonical-control {
  width: 100%;
}

.seg-group {
  display: inline-flex;
  background: var(--color-glass);
  border: 1px solid var(--color-glass-border);
  border-radius: 0.375rem;
  padding: 2px;
  gap: 2px;
  flex-wrap: wrap;
}
.seg-pill {
  padding: 0.25rem 0.625rem;
  font-size: 0.75rem;
  color: var(--color-text-muted);
  background: transparent;
  border: 0;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.seg-pill:hover { color: var(--color-text); }
.seg-pill-active {
  background: var(--color-accent-subtle);
  color: var(--color-text);
}
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
</style>
