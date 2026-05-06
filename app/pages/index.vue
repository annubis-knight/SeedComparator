<template>
  <div class="h-full min-h-0 flex flex-col">
  <!-- STORY-099 : si pas de session active, vue centrale neutre -->
  <div v-if="!hasActiveSession" class="flex items-center justify-center flex-1 min-h-0 px-8 py-8">
    <div class="text-center max-w-md space-y-4 py-16">
      <div class="text-6xl">🎨</div>
      <h2 class="text-xl font-semibold text-text">Aucune session active</h2>
      <p class="text-sm text-text-muted leading-relaxed">
        Sélectionne une session dans la barre de gauche, ou crée-en une nouvelle pour commencer à explorer.
      </p>
      <button
        type="button"
        class="text-sm px-4 py-2 rounded-lg border border-accent text-text bg-accent-subtle hover:bg-accent transition-colors"
        data-testid="empty-new-session"
        @click="onNewSession"
      >+ Nouvelle session</button>
    </div>
  </div>

  <!-- Workflow normal : session active — STORY-110 split-pane -->
  <SplitPane
    v-else
    ref="splitPaneEl"
    :collapsed="promptsCollapsed"
    :min-top-px="56"
    class="flex-1 min-h-0"
    data-testid="main-split-pane"
  >
    <template #top>
      <GenerationControls
        :phase="activeSession.activePhase.value"
        :prompts="activeSession.currentPrompts.value"
        :active-prompt-idx="activePromptIdx"
        :collapsed="promptsCollapsed"
        @update:phase="activeSession.setPhase($event)"
        @update:prompts="activeSession.setCurrentPrompts($event)"
        @update:active-prompt-idx="activePromptIdx = $event"
        @update:collapsed="promptsCollapsed = $event"
        @reset="activeSession.resetPhasePromptsToDefaults()"
        @open-helper="helperOpen = true"
      >
        <template #actions>
          <AppButton variant="primary" :disabled="!canGenerate" @click="onGenerate">
            {{ inProgress ? 'Génération…' : 'Générer' }}
          </AppButton>
          <AppButton v-if="inProgress" variant="ghost" @click="stop">Stop</AppButton>
        </template>
      </GenerationControls>
    </template>

    <template #bottom>
      <GenerationResults
        :generations="displayedCards"
        :models="shellState.models"
        :ratio="shellState.ratio"
        :mode="viewMode"
        :active-prompt-idx="activePromptIdx"
        :prompts="activeSession.currentPrompts.value"
        :show-all-prompts="showAllPrompts"
        @update:mode="viewMode = $event"
        @update:active-prompt-idx="activePromptIdx = $event"
        @update:show-all-prompts="showAllPrompts = $event"
        @open="openLightbox"
        @details="openDetails"
        @save="saveImage"
        @like="onLike"
      />
    </template>
  </SplitPane>

  <!-- Modales (Teleport body via composants) -->
  <HelperModal
    v-model="helperOpen"
    :session-id="activeSession.activeId.value"
    :phase="activeSession.activePhase.value"
    @insert="onHelperInsert"
  />

  <AppModal :open="estimateOpen" @close="estimateOpen = false">
    <h3 class="text-lg font-semibold mb-3">Confirmation</h3>
    <p class="text-sm text-text-muted mb-4">
      Cette opération va lancer <strong>{{ estimate?.generations ?? 0 }}</strong> générations
      pour un coût estimé de <strong>${{ (estimate?.totalUsd ?? 0).toFixed(3) }}</strong>.
    </p>
    <div class="flex gap-2 justify-end">
      <AppButton variant="ghost" @click="estimateOpen = false">Annuler</AppButton>
      <AppButton variant="primary" @click="confirmGenerate">Confirmer</AppButton>
    </div>
  </AppModal>

  <Lightbox :open="!!lightboxGen" :primary="lightboxGen" @close="lightboxGen = null" />
  </div>
</template>

<!-- end of template -->


<script setup lang="ts">
import type { CostEstimate, ModelDTO } from '#shared/contracts'
import type { LiveGeneration } from '~/composables/useGenerationSession'
import { buildIdleCards } from '~/composables/useGenerationSession'
import { createLogger } from '~/utils/logger'

const log = createLogger('pages/index')

const viewMode = ref<'grid' | 'flex'>('grid')
const activePromptIdx = ref(0)
const showAllPrompts = ref(false)
const estimateOpen = ref(false)
const estimate = ref<CostEstimate | null>(null)
const lightboxGen = ref<LiveGeneration | null>(null)
const promptsCollapsed = ref(false)
const helperOpen = ref(false)
const splitPaneEl = ref<{ splitPane: ReturnType<typeof import('~/composables/useSplitPane').useSplitPane> } | null>(null)

const COST_THRESHOLD_DEFAULT = 0.5

const shellState = useShellState()
const { models, load: loadModels } = useModels()
const { generations, inProgress, start, stop, setLiked } = useGenerationSession()
const router = useRouter()
const activeSession = useActiveSession()

const hasActiveSession = computed(() => activeSession.hasActive.value)

function onNewSession() {
  log.info('onNewSession from empty state — start draft')
  activeSession.startDraft()
}

await loadModels()
shellState.models = models.value as ModelDTO[]
shellState.selectedModelIds = (models.value as ModelDTO[])
  .filter((m) => m.enabled && m.hasApiKey && m.hasFixture)
  .map((m) => m.id)

// Si on arrive depuis /home avec des prompts générés, les injecter dans la phase active
const generatedPrompts = useState<string[]>('prompts-generated', () => ['', '', ''])
if (generatedPrompts.value.some((p) => p.trim().length > 0)) {
  log.info('injecting generated prompts from /home')
  activeSession.setCurrentPrompts([
    generatedPrompts.value[0] ?? '',
    generatedPrompts.value[1] ?? '',
    generatedPrompts.value[2] ?? '',
  ])
  generatedPrompts.value = ['', '', '']
}

watch(models, (next) => {
  shellState.models = next as ModelDTO[]
})

// FR-046 + FR-076 : collapse prompts + déplace séparateur au démarrage génération
// À la fin, restaure la position mémorisée par l'utilisateur
watch(inProgress, (now, prev) => {
  if (now && !prev) {
    promptsCollapsed.value = true
    splitPaneEl.value?.splitPane.setAutoCollapse(true)
  } else if (!now && prev) {
    splitPaneEl.value?.splitPane.setAutoCollapse(false)
  }
})

const canGenerate = computed(() => {
  if (inProgress.value) return false
  const activePrompts = activeSession.currentPrompts.value.filter((p) => p.trim().length > 0)
  return activePrompts.length > 0 && shellState.selectedModelIds.length > 0
})

const displayedCards = computed<LiveGeneration[]>(() => {
  if (generations.value.length > 0) return generations.value
  const promptCount = Math.max(1, activeSession.currentPrompts.value.filter((p) => p.trim().length > 0).length)
  return buildIdleCards(shellState.selectedModelIds, promptCount)
})

async function onGenerate() {
  const activePrompts = activeSession.currentPrompts.value.filter((p) => p.trim().length > 0)
  log.info('onGenerate clicked', { prompts: activePrompts.length, models: shellState.selectedModelIds.length })
  // EPIC-18 / STORY-125 — propagation des overrides utilisateur pour calcul réactif
  // STORY-124 v3 — version filtrée (sans le shadow store canonique).
  const { cleanOverridesForServer } = useModelParams()
  estimate.value = await $fetch<CostEstimate>('/api/estimate', {
    method: 'POST',
    body: {
      prompts: activePrompts,
      modelIds: shellState.selectedModelIds,
      globalParams: cleanOverridesForServer.value,
    },
  })
  log.debug('estimate response', estimate.value)
  if (estimate.value.totalUsd >= COST_THRESHOLD_DEFAULT) {
    log.warn(`cost threshold exceeded: $${estimate.value.totalUsd.toFixed(3)} >= $${COST_THRESHOLD_DEFAULT}`)
    estimateOpen.value = true
  } else {
    runGenerate()
  }
}

async function confirmGenerate() {
  estimateOpen.value = false
  runGenerate()
}

function runGenerate() {
  const phase = activeSession.activePhase.value
  const variant = (['A', 'B', 'C'] as const)[activePromptIdx.value] ?? 'A'
  log.info('runGenerate', {
    prompts: activeSession.currentPrompts.value.filter((p) => p.trim().length > 0).length,
    modelIds: shellState.selectedModelIds,
    ratio: shellState.ratio,
    phase,
    variant,
  })
  start({
    prompts: activeSession.currentPrompts.value.filter((p) => p.trim().length > 0),
    modelIds: shellState.selectedModelIds,
    ratio: shellState.ratio,
    phase,
    promptVariant: variant,
  })
}

// @requirement: FR-074 (STORY-109) — insère un prompt issu de l'assistant dans le slot A/B/C correspondant
function onHelperInsert(prompt: string, variantIdx: number) {
  const current = [...activeSession.currentPrompts.value]
  if (variantIdx < 3) current[variantIdx] = prompt
  activeSession.setCurrentPrompts(current)
  helperOpen.value = false
}

function openLightbox(gen: LiveGeneration) { lightboxGen.value = gen }

function openDetails(gen: LiveGeneration) {
  if (gen.generationId) router.push(`/sessions/${gen.generationId}`)
}

async function saveImage(gen: LiveGeneration) {
  if (!gen.generationId) return
  const folder = await window.seedApi?.dialog.selectFolder()
  if (!folder) return
  await $fetch('/api/save/image', { method: 'POST', body: { generationId: gen.generationId, folder } })
}

/**
 * STORY-097 : toggle like + persistance disque automatique.
 * - Récupère ou demande le `save_folder` (Setting global, persisté en DB).
 * - Optimistic update du flag local, rollback si erreur API.
 */
async function onLike(gen: LiveGeneration) {
  if (!gen.generationId) return
  const wasLiked = gen.liked
  const willBeLiked = !wasLiked
  log.info(`onLike gen=${gen.generationId} ${wasLiked} → ${willBeLiked}`)

  // 1. Récupérer le save_folder courant
  let folder = ''
  try {
    const settings = await $fetch<Record<string, string>>('/api/settings')
    folder = (settings.save_folder ?? '').trim()
  } catch {}

  // 2. Si pas configuré, demander à l'utilisateur via dialog Electron + persister
  if (!folder) {
    const picked = await window.seedApi?.dialog.selectFolder()
    if (!picked) {
      log.warn('like cancelled — no folder selected')
      return
    }
    folder = picked
    await $fetch('/api/settings', { method: 'PUT', body: { key: 'save_folder', value: folder } }).catch(() => {})
  }

  // 3. Optimistic update local
  setLiked(gen.generationId, willBeLiked)

  // 4. Appel API
  try {
    await $fetch(`/api/generations/${gen.generationId}/like`, {
      method: 'PATCH',
      body: { liked: willBeLiked, folder },
    })
  } catch (err) {
    log.error('like API failed, rollback', err)
    setLiked(gen.generationId, wasLiked)
  }
}

</script>
