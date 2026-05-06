<template>
  <!--
    EPIC-18 / STORY-124 v4 — Une ligne factorisée par TRAIT (pas par modèle).
    Si N modèles sélectionnés exposent le trait `outputCompression`, l'utilisateur
    voit UN slider qui pilote les N modèles d'un coup. Le badge indique la
    portée ("Appliqué à N modèles").
  -->
  <div class="factorized-row">
    <div class="factorized-head">
      <span class="factorized-label">{{ field.label }}</span>
      <InfoTooltip :text="field.tooltip" placement="right" />
      <span class="factorized-applies" :title="appliesToTooltip">
        Appliqué à {{ modelIds.length }} {{ modelIds.length > 1 ? 'modèles' : 'modèle' }}
      </span>
    </div>
    <div class="factorized-control">
      <ParamControl
        :field="field"
        :model-value="currentValue"
        @update:model-value="onUpdate"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ModelDTO, ParamFieldMetaDTO } from '#shared/contracts'
import ParamControl from '../params/ParamControl.vue'
import InfoTooltip from '../ui/InfoTooltip.vue'
import { useModelParams } from '../../composables/useModelParams'

const props = defineProps<{
  /** Définition du trait (lue depuis l'un des modèles concernés — ils ont
   *  tous la même signature pour ce trait). */
  field: ParamFieldMetaDTO
  /** Modèles sélectionnés qui exposent ce trait. Au moins 1. */
  modelIds: string[]
  /** Liste pour l'affichage tooltip "modèle1 · modèle2 · ...". */
  models: ModelDTO[]
}>()

const { setParam, getParams } = useModelParams()

const appliesToTooltip = computed(() =>
  props.modelIds
    .map((id) => props.models.find((m) => m.id === id)?.displayName ?? id)
    .join(' · '),
)

/**
 * Valeur affichée : on lit la valeur du premier modèle concerné. Si aucun
 * modèle n'a de surcharge, on retombe sur le défaut. (Tous les modèles ont
 * normalement la même valeur puisque ce contrôle écrit partout en parallèle.)
 */
const currentValue = computed(() => {
  const firstModel = props.modelIds[0]
  if (!firstModel) return props.field.default
  const v = getParams(firstModel)[props.field.key]
  return v !== undefined ? v : props.field.default
})

function onUpdate(value: unknown) {
  // Propage vers tous les modèles concernés simultanément.
  for (const id of props.modelIds) {
    setParam(id, props.field.key, value)
  }
}
</script>

<style scoped>
.factorized-row {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.5rem 0;
}
.factorized-head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}
.factorized-label {
  font-weight: 500;
}
.factorized-applies {
  margin-left: auto;
  font-size: 0.6875rem;
  color: var(--color-text-dim);
  cursor: help;
}
.factorized-control {
  width: 100%;
}
</style>
