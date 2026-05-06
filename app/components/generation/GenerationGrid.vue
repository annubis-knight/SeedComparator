<template>
  <div class="flex flex-col h-full min-h-0">
    <div class="flex items-center justify-between mb-6 gap-4 flex-wrap">
      <div class="flex gap-1">
        <button
          v-for="m in modes"
          :key="m"
          class="btn-ghost"
          :class="{ '!text-text !border-accent': mode === m }"
          @click="$emit('update:mode', m)"
        >{{ m === 'grid' ? 'Grid' : 'Flex' }}</button>
      </div>

      <PromptSwitcher
        v-if="promptCount > 1"
        :model-value="switcherValue"
        :prompt-count="promptCount"
        @update:model-value="onSwitcherChange"
      />

      <div class="text-xs text-text-dim">{{ stats }}</div>
    </div>

    <!-- Mode GRID : sections empilées par brand, très aéré (FR-047) -->
    <div v-if="mode === 'grid'" class="space-y-14 flex-1 min-h-0 overflow-y-auto" data-testid="grid-by-brand">
      <section
        v-for="group in brandGroups"
        :key="group.brandId"
        class="space-y-6"
        :data-testid="`brand-section-${group.brandId}`"
      >
        <header class="flex items-baseline gap-4 border-b border-glass-border pb-4">
          <h3 class="text-base font-semibold text-text uppercase tracking-wider">{{ group.brandDisplayName }}</h3>
          <span class="text-xs text-text-dim">{{ group.modelIds.length }} {{ group.modelIds.length > 1 ? 'modèles' : 'modèle' }}</span>
        </header>
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
          <GenerationCard
            v-for="gen in gridCardsForBrand(group.modelIds)"
            :key="gen.taskId"
            :gen="gen"
            :ratio="ratio"
            :model-display-name="displayName(gen.modelId)"
            :gateway-display-name="gatewayName(gen.modelId)"
            @open="$emit('open', $event)"
            @details="$emit('details', $event)"
            @save="$emit('save', $event)"
            @like="$emit('like', $event)"
          />
        </div>
      </section>
    </div>

    <!-- Mode FLEX : colonnes pleine hauteur, image x2, beaucoup d'espace (FR-047, FR-049, FR-052) -->
    <div v-else class="overflow-x-auto flex-1 min-h-0 pb-4" data-testid="flex-grid">
      <div class="flex gap-16 items-stretch h-full">
        <section
          v-for="group in brandGroups"
          :key="group.brandId"
          class="flex flex-col gap-4 h-full"
          :data-testid="`brand-flex-${group.brandId}`"
        >
          <header class="flex items-baseline gap-2 border-b border-glass-border pb-3 shrink-0">
            <h3 class="text-base font-semibold text-text uppercase tracking-wider">{{ group.brandDisplayName }}</h3>
          </header>
          <div class="grid gap-8" :style="flexGridStyleFor(flexColumnsForBrand(group.modelIds).length)">
            <GenerationCard
              v-for="col in flexColumnsForBrand(group.modelIds)"
              :key="col.key"
              :data-testid="`flex-col-${col.modelId}-${col.promptIdx}`"
              :gen="cardFor(col.promptIdx, col.modelId)"
              :ratio="ratio"
              :model-display-name="displayName(col.modelId)"
              :gateway-display-name="gatewayName(col.modelId)"
              :prompt-text="prompts?.[col.promptIdx] ?? ''"
              @open="$emit('open', $event)"
              @details="$emit('details', $event)"
              @save="$emit('save', $event)"
              @like="$emit('like', $event)"
            />
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { LiveGeneration } from '~/composables/useGenerationSession'
import type { ModelDTO, Ratio } from '#shared/contracts'
import type { PromptSwitcherValue } from './PromptSwitcher.vue'

const props = defineProps<{
  generations: LiveGeneration[]
  models: ModelDTO[]
  mode: 'grid' | 'flex'
  ratio?: Ratio
  activePromptIdx?: number
  /** Liste des prompts saisis (1-3) — utilisée pour afficher le prompt actif sous chaque card en flex. */
  prompts?: string[]
  /** Si true, on affiche TOUTES les variantes (équivalent à 'all' dans le PromptSwitcher). */
  showAllPrompts?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:mode', value: 'grid' | 'flex'): void
  (e: 'update:activePromptIdx', value: number): void
  (e: 'update:showAllPrompts', value: boolean): void
  (e: 'open', gen: LiveGeneration): void
  (e: 'details', gen: LiveGeneration): void
  (e: 'save', gen: LiveGeneration): void
  (e: 'like', gen: LiveGeneration): void
}>()

const modes: Array<'grid' | 'flex'> = ['grid', 'flex']

interface BrandGroup {
  brandId: string
  brandDisplayName: string
  brandSortOrder: number
  modelIds: string[]
}

interface FlexColumn {
  key: string
  modelId: string
  promptIdx: number
}

// Modèles actifs (= ceux qui apparaissent dans les générations en cours OU dans les cards idle)
const activeModelIds = computed(() => Array.from(new Set(props.generations.map((g) => g.modelId))))

const brandGroups = computed<BrandGroup[]>(() => {
  const map = new Map<string, BrandGroup>()
  for (const modelId of activeModelIds.value) {
    const meta = props.models.find((m) => m.id === modelId)
    if (!meta) continue
    if (!map.has(meta.brandId)) {
      map.set(meta.brandId, {
        brandId: meta.brandId,
        brandDisplayName: meta.brandDisplayName,
        brandSortOrder: meta.brandSortOrder,
        modelIds: [],
      })
    }
    map.get(meta.brandId)!.modelIds.push(modelId)
  }
  return Array.from(map.values()).sort((a, b) => a.brandSortOrder - b.brandSortOrder)
})

const promptCount = computed(() => Math.max(1, ...props.generations.map((g) => g.promptIdx + 1)))
const currentPromptIdx = computed(() => Math.min(promptCount.value - 1, props.activePromptIdx ?? 0))

// Synchronisation switcher ↔ props
const switcherValue = computed<PromptSwitcherValue>(() =>
  props.showAllPrompts ? 'all' : currentPromptIdx.value,
)

function onSwitcherChange(value: PromptSwitcherValue) {
  if (value === 'all') {
    emit('update:showAllPrompts', true)
  } else {
    emit('update:showAllPrompts', false)
    emit('update:activePromptIdx', value)
  }
}

function flexGridStyleFor(columnCount: number) {
  return { gridTemplateColumns: `repeat(${Math.max(1, columnCount)}, minmax(480px, 1fr))` }
}

const stats = computed(() => {
  const total = props.generations.length
  const done = props.generations.filter((g) => g.status === 'success').length
  const failed = props.generations.filter((g) => g.status === 'failed').length
  return `${done}/${total} • ${failed} échecs`
})

function displayName(modelId: string) {
  return props.models.find((m) => m.id === modelId)?.displayName ?? modelId
}

function gatewayName(modelId: string): string | undefined {
  return props.models.find((m) => m.id === modelId)?.providerDisplayName
}

// MODE GRID : filtre les cards selon le prompt actif (ou affiche toutes si 'all').
function gridCardsForBrand(modelIds: string[]): LiveGeneration[] {
  const all = props.generations.filter((g) => modelIds.includes(g.modelId))
  if (props.showAllPrompts) return all
  return all.filter((g) => g.promptIdx === currentPromptIdx.value)
}

// MODE FLEX : génère la liste des colonnes à afficher pour une brand.
// - Si "Tous" → N colonnes par modèle (1 par prompt rempli).
// - Sinon → 1 colonne par modèle (prompt actif).
function flexColumnsForBrand(modelIds: string[]): FlexColumn[] {
  const cols: FlexColumn[] = []
  if (props.showAllPrompts) {
    for (const modelId of modelIds) {
      for (let promptIdx = 0; promptIdx < promptCount.value; promptIdx++) {
        cols.push({ key: `${modelId}-${promptIdx}`, modelId, promptIdx })
      }
    }
  } else {
    for (const modelId of modelIds) {
      cols.push({ key: `${modelId}-${currentPromptIdx.value}`, modelId, promptIdx: currentPromptIdx.value })
    }
  }
  return cols
}

function cardFor(promptIdx: number, modelId: string): LiveGeneration {
  return (
    props.generations.find((g) => g.promptIdx === promptIdx && g.modelId === modelId) ??
    placeholderGen(promptIdx, modelId)
  )
}

function placeholderGen(promptIdx: number, modelId: string): LiveGeneration {
  return {
    taskId: `${promptIdx}-${modelId}`,
    generationId: null,
    promptIdx,
    modelId,
    status: 'idle',
    imageDataUrl: null,
    seed: null,
    costUsd: 0,
    errorCode: null,
    errorMsg: null,
  }
}
</script>
