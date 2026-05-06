<template>
  <div class="space-y-5">
    <RatioSelector v-model="ratioModel" />

    <!--
      EPIC-18 / STORY-124 v4 — Liste plate de paramètres avancés, intégralement
      factorisée. Aucune duplication : pour chaque trait `scope: global` exposé
      par au moins un modèle sélectionné, UN seul contrôle est rendu et
      s'applique à tous les modèles concernés.

      Deux types de contrôles cohabitent dans la liste :
       - `CanonicalParamRow` : pour les concepts dont la sémantique diverge
         entre modèles (ex: `quality` = standard|hd côté DALL·E mais
         low|medium|high côté GPT Image). Le canonique unifie via une échelle
         homogène 1-5 et démultiplexe vers les valeurs natives par modèle.
       - `FactorizedTraitRow` : pour les traits dont la signature est
         identique entre tous les modèles qui l'exposent (ex: `outputCompression`
         0-100, `openaiBackground` auto|transparent|opaque). Pas besoin de
         canonique — on rend directement le trait, propagé à tous les modèles.
    -->
    <div class="space-y-3">
      <div class="flex items-center gap-2">
        <label class="block text-sm font-medium text-text-muted">Paramètres avancés</label>
        <InfoTooltip
          text="Réglages mutualisés entre les modèles sélectionnés. Chaque paramètre s'applique à tous les modèles qui le supportent."
          placement="right"
        />
      </div>

      <div v-if="selectedModelIds.length === 0" class="text-xs text-text-dim">
        Sélectionne un modèle pour afficher ses paramètres avancés.
      </div>

      <template v-else>
        <div v-if="canonicalRows.length === 0 && factorizedTraitRows.length === 0" class="text-xs text-text-dim">
          Aucun paramètre avancé pour les modèles sélectionnés.
        </div>

        <div v-else class="space-y-1">
          <!-- Canoniques (échelles homogènes qui démultiplexent) -->
          <CanonicalParamRow
            v-for="cp in canonicalRows"
            :key="`canonical-${cp.key}`"
            :param="cp"
            :selected-model-ids="selectedModelIds"
          />
          <!-- Traits directs factorisés (signature identique entre modèles) -->
          <FactorizedTraitRow
            v-for="row in factorizedTraitRows"
            :key="`trait-${row.field.key}`"
            :field="row.field"
            :model-ids="row.modelIds"
            :models="models"
          />
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Ratio, ModelDTO, ParamFieldMetaDTO } from '#shared/contracts'
import { listApplicableCanonicalParams } from '#shared/canonicalParams'
import CanonicalParamRow from './CanonicalParamRow.vue'
import FactorizedTraitRow from './FactorizedTraitRow.vue'
import InfoTooltip from '../ui/InfoTooltip.vue'

const props = withDefaults(defineProps<{
  ratio: Ratio
  selectedModelIds?: string[]
  models?: ModelDTO[]
}>(), {
  selectedModelIds: () => [],
  models: () => [],
})

const emit = defineEmits<{ (e: 'update:ratio', value: Ratio): void }>()

const ratioModel = computed({
  get: () => props.ratio,
  set: (v: Ratio) => emit('update:ratio', v),
})

/**
 * Clés des traits backend déjà couverts par un paramètre canonique.
 * Source de vérité couplée à `shared/canonicalParams.ts` — à maintenir en
 * phase si on ajoute/retire un canonique.
 */
const TRAITS_COVERED_BY_CANONICAL: Record<string, string[]> = {
  quality: ['openaiQuality'],
  outputFormat: ['outputFormat'],
  creativity: ['geminiTemperature', 'guidanceScale'],
  inferenceEffort: ['numInferenceSteps'],
  safetyLevel: ['safetyTolerance', 'enableSafetyChecker', 'openaiModeration'],
  negativePrompt: ['negativePrompt'],
}

// Lignes "canoniques" applicables (au moins 1 modèle sélectionné dans appliesTo)
const canonicalRows = computed(() => listApplicableCanonicalParams(props.selectedModelIds))

// Set des traits backend déjà rendus via un canonique → à exclure du rendu direct
const traitsCoveredByCanonical = computed<Set<string>>(() => {
  const set = new Set<string>()
  for (const cp of canonicalRows.value) {
    const traits = TRAITS_COVERED_BY_CANONICAL[cp.key] ?? []
    for (const t of traits) set.add(t)
  }
  return set
})

interface FactorizedRow {
  field: ParamFieldMetaDTO
  modelIds: string[]
}

/**
 * Lignes "factorisées directes" : un objet par trait `scope: global` exposé
 * par au moins un modèle sélectionné, dédupliqué par `field.key`. Pour
 * chaque clé, on agrège la liste des modèles concernés (pour le badge
 * "Appliqué à N modèles") et on retient la définition du trait du premier
 * modèle (les définitions doivent être identiques entre modèles — c'est
 * vérifié implicitement parce que `paramTraits.ts` est la source unique).
 *
 * Ordre : par ordre d'apparition dans le premier modèle sélectionné qui
 * expose le trait. Plus stable que par fréquence, plus naturel à lire.
 */
const factorizedTraitRows = computed<FactorizedRow[]>(() => {
  const covered = traitsCoveredByCanonical.value
  const seen = new Map<string, FactorizedRow>()
  const order: string[] = []

  for (const id of props.selectedModelIds) {
    const m = props.models.find((mm) => mm.id === id)
    if (!m) continue
    for (const f of m.paramFields) {
      if (f.scope !== 'global') continue
      if (covered.has(f.key)) continue
      const existing = seen.get(f.key)
      if (existing) {
        existing.modelIds.push(id)
      } else {
        seen.set(f.key, { field: f, modelIds: [id] })
        order.push(f.key)
      }
    }
  }
  return order.map((k) => seen.get(k)!)
})
</script>
