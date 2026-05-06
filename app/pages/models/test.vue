<template>
  <div class="max-w-3xl space-y-6">
    <header class="space-y-1">
      <h1 class="text-2xl font-semibold">Test des modèles</h1>
      <p class="text-sm text-text-dim">
        Teste un modèle isolément en mode <strong>live</strong> (paie l'API), capture sa réponse en fixture pour la rejouer ensuite en mode <em>mock-real</em> sans recoût.
      </p>
    </header>

    <!-- Sélection modèle -->
    <section class="glass p-5 space-y-3">
      <label class="text-sm font-medium" for="model-select">Modèle</label>
      <select
        id="model-select"
        v-model="selectedModelId"
        class="input-glass w-full"
        data-testid="model-select"
      >
        <option value="">— Choisir un modèle —</option>
        <optgroup
          v-for="brand in modelsByBrand"
          :key="brand.brandId"
          :label="brand.brandDisplayName"
        >
          <option v-for="m in brand.models" :key="m.id" :value="m.id">
            {{ m.displayName }} ({{ m.providerDisplayName }} · ${{ m.pricePerImage.toFixed(3) }}) {{ fixtureBadge(m.id) }}
          </option>
        </optgroup>
      </select>
      <p v-if="selectedModelId && currentFixtureStatus" class="text-xs text-text-dim">
        <span v-if="currentFixtureStatus.hasFixture">
          ✓ Fixture présente, capturée le {{ formatDate(currentFixtureStatus.capturedAt) }}
        </span>
        <span v-else class="text-warn">
          ⚠ Aucune fixture capturée pour ce modèle
        </span>
      </p>
    </section>

    <!-- Prompts A / B / C -->
    <section class="glass p-5 space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-medium">Prompts</h2>
        <button class="text-xs text-text-muted hover:text-text" type="button" @click="resetPrompts">↺ Reset aux pré-prompts</button>
      </div>

      <div class="flex gap-2">
        <button
          v-for="v in (['A','B','C'] as const)"
          :key="v"
          type="button"
          class="px-3 py-1.5 rounded-lg text-sm transition-colors"
          :class="activeVariant === v
            ? 'bg-accent text-bg'
            : 'bg-glass text-text-muted hover:text-text'"
          :data-testid="`prompt-tab-${v}`"
          @click="activeVariant = v"
        >Prompt {{ v }}</button>
      </div>

      <textarea
        v-model="prompts[activeVariant]"
        class="input-glass w-full font-mono text-xs leading-relaxed"
        rows="6"
        :placeholder="`Prompt ${activeVariant}…`"
        :data-testid="`prompt-textarea-${activeVariant}`"
      />
    </section>

    <!-- Carte test + bouton -->
    <section class="glass p-5 space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-medium">Résultat</h2>
        <button
          type="button"
          class="px-4 py-2 rounded-lg bg-accent text-bg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="!canTest"
          data-testid="test-btn"
          @click="onTest()"
        >
          {{ testing ? 'Test en cours…' : 'Tester en live (paie l’API)' }}
        </button>
      </div>

      <GenerationCard
        :gen="liveGen"
        :model-display-name="selectedModelDisplayName"
        :gateway-display-name="selectedModelGateway"
        ratio="1:1"
        :prompt-text="prompts[activeVariant]"
      />

      <div v-if="lastResult" class="text-xs space-y-1 font-mono pt-2 border-t border-glass-border">
        <div>elapsedMs: {{ lastResult.elapsedMs }}</div>
        <div v-if="lastResult.fixture">fixture: {{ lastResult.fixture.jsonPath }}</div>
        <div v-if="lastResult.errorCode" class="text-danger">error: {{ lastResult.errorCode }} — {{ lastResult.errorMsg }}</div>
      </div>
    </section>

    <!-- Modal overwrite -->
    <AppModal :open="overwriteModalOpen" @close="overwriteModalOpen = false">
      <h3 class="text-lg font-medium mb-2">Fixture déjà présente</h3>
      <p class="text-sm text-text-dim mb-4">
        Une fixture existe déjà pour <strong>{{ selectedModelDisplayName }}</strong>.
        Lancer un nouveau test va appeler l'API (paiement) et écraser la fixture précédente.
      </p>
      <div class="flex gap-2 justify-end">
        <button class="px-4 py-2 rounded-lg bg-glass text-text-muted hover:text-text" type="button" @click="overwriteModalOpen = false">Annuler</button>
        <button class="px-4 py-2 rounded-lg bg-danger text-bg" type="button" data-testid="confirm-overwrite-btn" @click="onConfirmOverwrite">Écraser et tester</button>
      </div>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { PROMPT_PREFIXES, type PromptVariant } from '#shared/contracts'
import type { LiveGeneration } from '~/composables/useGenerationSession'
import { createLogger } from '~/utils/logger'

const log = createLogger('models.test')

const { models, load } = useModels()
await load()

const selectedModelId = ref('')
const activeVariant = ref<PromptVariant>('A')
const prompts = reactive<Record<PromptVariant, string>>({
  A: PROMPT_PREFIXES.A,
  B: PROMPT_PREFIXES.B,
  C: PROMPT_PREFIXES.C,
})

const testing = ref(false)
const overwriteModalOpen = ref(false)
const lastResult = ref<{ elapsedMs?: number; fixture?: { jsonPath: string }; errorCode?: string; errorMsg?: string } | null>(null)

// Statut fixture par modèle (chargé une fois au mount)
const fixtureStatus = ref<Record<string, { hasFixture: boolean; capturedAt?: string; source: string }>>({})
async function loadFixtureStatus() {
  try {
    const data = await $fetch<{ fixtures: typeof fixtureStatus.value }>('/api/models/fixture-status')
    fixtureStatus.value = data.fixtures
    log.debug(`fixture-status loaded for ${Object.keys(data.fixtures).length} models`)
  } catch (err) {
    log.error('failed to load fixture-status', err)
  }
}
onMounted(loadFixtureStatus)

const currentFixtureStatus = computed(() => selectedModelId.value ? fixtureStatus.value[selectedModelId.value] ?? null : null)

const modelsByBrand = computed(() => {
  const map = new Map<string, { brandId: string; brandDisplayName: string; brandSortOrder: number; models: typeof models.value }>()
  for (const m of models.value) {
    if (!map.has(m.brandId)) {
      map.set(m.brandId, { brandId: m.brandId, brandDisplayName: m.brandDisplayName, brandSortOrder: m.brandSortOrder, models: [] })
    }
    map.get(m.brandId)!.models.push(m)
  }
  return Array.from(map.values()).sort((a, b) => a.brandSortOrder - b.brandSortOrder)
})

const selectedModel = computed(() => models.value.find((m) => m.id === selectedModelId.value) ?? null)
const selectedModelDisplayName = computed(() => selectedModel.value?.displayName ?? '')
const selectedModelGateway = computed(() => selectedModel.value?.providerDisplayName ?? undefined)

const liveGen = ref<LiveGeneration>({
  taskId: 'test-card',
  generationId: null,
  promptIdx: 0,
  modelId: '',
  status: 'idle',
  imageDataUrl: null,
  seed: null,
  costUsd: 0,
  errorCode: null,
  errorMsg: null,
  liked: false,
} as LiveGeneration)

watch(selectedModelId, (id) => {
  liveGen.value = { ...liveGen.value, modelId: id, status: 'idle', imageDataUrl: null, seed: null, costUsd: 0, errorCode: null, errorMsg: null }
  lastResult.value = null
})

const canTest = computed(() => !!selectedModelId.value && !!prompts[activeVariant.value]?.trim() && !testing.value)

function fixtureBadge(modelId: string): string {
  return fixtureStatus.value[modelId]?.hasFixture ? '✓' : ''
}

function formatDate(iso?: string): string {
  if (!iso) return '?'
  return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function resetPrompts() {
  prompts.A = PROMPT_PREFIXES.A
  prompts.B = PROMPT_PREFIXES.B
  prompts.C = PROMPT_PREFIXES.C
  log.info('prompts reset to defaults')
}

async function onTest(overwrite = false) {
  if (!canTest.value) return
  testing.value = true
  liveGen.value = { ...liveGen.value, status: 'pending', errorCode: null, errorMsg: null, imageDataUrl: null }
  log.info(`test → modelId=${selectedModelId.value} variant=${activeVariant.value} overwrite=${overwrite}`)

  try {
    const res = await $fetch.raw('/api/models/test', {
      method: 'POST',
      body: {
        modelId: selectedModelId.value,
        prompt: prompts[activeVariant.value],
        ratio: '1:1',
        overwrite,
      },
      ignoreResponseError: true,
    })
    log.debug(`response status=${res.status}`)

    if (res.status === 409) {
      log.warn('fixture already exists, opening overwrite modal')
      overwriteModalOpen.value = true
      liveGen.value = { ...liveGen.value, status: 'idle' }
      testing.value = false
      return
    }

    const data = res._data as {
      status: 'success' | 'failed'
      imageDataUrl?: string
      seed?: number | null
      costUsd?: number
      elapsedMs: number
      fixture?: { jsonPath: string; pngPath: string }
      errorCode?: string
      errorMsg?: string
    }

    lastResult.value = data
    if (data.status === 'success') {
      log.info(`test success in ${data.elapsedMs}ms`, { fixture: data.fixture })
      liveGen.value = {
        ...liveGen.value,
        status: 'success',
        imageDataUrl: data.imageDataUrl ?? null,
        seed: data.seed ?? null,
        costUsd: data.costUsd ?? 0,
      }
      // Refresh status pour mettre à jour les badges
      await loadFixtureStatus()
    } else {
      log.error(`test failed code=${data.errorCode} msg=${data.errorMsg}`)
      liveGen.value = {
        ...liveGen.value,
        status: 'failed',
        errorCode: data.errorCode ?? 'unknown',
        errorMsg: data.errorMsg ?? 'unknown error',
      }
    }
  } catch (err) {
    log.error('network error during /api/models/test', err)
    liveGen.value = { ...liveGen.value, status: 'failed', errorCode: 'network', errorMsg: err instanceof Error ? err.message : String(err) }
  } finally {
    testing.value = false
  }
}

async function onConfirmOverwrite() {
  overwriteModalOpen.value = false
  await onTest(true)
}
</script>
