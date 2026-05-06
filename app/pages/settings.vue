<template>
  <div class="max-w-2xl space-y-6">
    <h1 class="text-2xl font-semibold">Réglages</h1>

    <section class="glass p-5 space-y-3" data-testid="provider-mode-section">
      <h2 class="text-lg font-medium">Mode provider</h2>
      <p class="text-xs text-text-dim">
        <strong>mock</strong> : données fictives (gratuit, pas réaliste).<br />
        <strong>mock-real</strong> : rejoue les fixtures capturées depuis <em>/models/test</em> (gratuit, vraies réponses figées).<br />
        <strong>live</strong> : appels API réels (paie à chaque clic).
      </p>
      <div class="flex items-center gap-3">
        <select
          v-model="providerMode"
          class="input-glass"
          data-testid="provider-mode-select"
          :disabled="savingMode"
          @change="saveProviderMode"
        >
          <option value="mock">mock — données fictives</option>
          <option value="mock-real">mock-real — rejoue fixtures</option>
          <option value="live">live — appels réels</option>
        </select>
        <span v-if="savingMode" class="text-xs text-text-dim">Enregistrement…</span>
        <span v-else-if="modeSavedAt" class="text-xs text-success">Enregistré</span>
      </div>
    </section>

    <section class="glass p-5 space-y-4">
      <h2 class="text-lg font-medium">Passerelles</h2>
      <p class="text-xs text-text-dim">Une passerelle (gateway) est l'API technique qui relaie les requêtes vers les éditeurs de modèles. Saisis une clé par passerelle. Les clés sont chiffrées localement via le keychain de l'OS. Jamais en DB, jamais dans le bundle frontend.</p>
      <div v-for="g in gateways" :key="g.id" class="space-y-1.5">
        <div class="flex items-baseline justify-between gap-2">
          <label class="text-sm">{{ g.displayName }}</label>
          <div class="flex items-center gap-2">
            <span
              v-if="isLoadedFromEnv(g.id)"
              class="text-[10px] px-1.5 py-0.5 rounded bg-accent-subtle text-accent border border-accent"
              :title="`Clé chargée depuis .env (variable ${envVarFor(g.id)}). Saisir une nouvelle valeur pour la remplacer.`"
              :data-testid="`env-badge-${g.id}`"
            >depuis .env</span>
            <span class="text-[11px] text-text-dim">{{ g.brandsServed.join(' · ') }}</span>
          </div>
        </div>
        <div class="flex gap-2">
          <input
            v-model="keyInputs[g.id]"
            type="password"
            class="input-glass flex-1"
            :placeholder="placeholderFor(g.id)"
          />
          <AppButton variant="primary" :disabled="!keyInputs[g.id]" @click="saveKey(g.id)">Enregistrer</AppButton>
        </div>
      </div>
      <div v-if="mockMode" class="text-xs text-accent">Mode mock actif — les clés ne sont pas requises pour tester.</div>
    </section>

    <section class="glass p-5 space-y-3">
      <h2 class="text-lg font-medium">Modèles</h2>
      <div v-for="brand in modelsByBrand" :key="brand.brandId" class="space-y-1">
        <div class="text-xs uppercase tracking-wider text-text-dim pt-2">{{ brand.brandDisplayName }}</div>
        <label v-for="m in brand.models" :key="m.id" class="flex items-center gap-3 py-1">
          <input type="checkbox" class="w-4 h-4 accent-accent" :checked="m.enabled" @change="toggle(m.id, ($event.target as HTMLInputElement).checked)" />
          <span class="text-sm flex-1">{{ m.displayName }}</span>
          <span class="text-[10px] px-1.5 py-0.5 rounded border border-glass-border text-text-dim">via {{ m.providerDisplayName }}</span>
          <span class="text-xs text-text-dim font-mono">${{ m.pricePerImage.toFixed(3) }}</span>
        </label>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { ProviderMode } from '#shared/contracts'
const { models, load, toggle } = useModels()
await load()

// EPIC-14 — dropdown mode provider
const providerMode = ref<ProviderMode>('live')
const savingMode = ref(false)
const modeSavedAt = ref<number | null>(null)

async function loadProviderMode() {
  try {
    const settings = await $fetch<Record<string, string>>('/api/settings')
    const v = settings['provider.mode']
    if (v === 'mock' || v === 'mock-real' || v === 'live') {
      providerMode.value = v
    } else {
      // Pas de valeur DB → fallback sur la config publique exposée par Nuxt
      const config = useRuntimeConfig()
      const pub = (config.public.providerMode as string | undefined) ?? 'live'
      providerMode.value = (pub === 'mock' || pub === 'mock-real' || pub === 'live') ? pub : 'live'
    }
  } catch {}
}

async function saveProviderMode() {
  savingMode.value = true
  modeSavedAt.value = null
  try {
    await $fetch('/api/settings', {
      method: 'PUT',
      body: { key: 'provider.mode', value: providerMode.value },
    })
    modeSavedAt.value = Date.now()
    // Recharger les modèles : le statut hasApiKey peut avoir changé selon le mode.
    await load()
  } catch (err) {
    console.error('[settings] failed to save provider.mode', err)
  } finally {
    savingMode.value = false
  }
}

interface GatewayRow {
  id: string
  displayName: string
  brandsServed: string[]
}

const gateways = computed<GatewayRow[]>(() => {
  const map = new Map<string, GatewayRow & { brandSet: Set<string> }>()
  for (const m of models.value) {
    if (!map.has(m.providerId)) {
      map.set(m.providerId, {
        id: m.providerId,
        displayName: m.providerDisplayName,
        brandsServed: [],
        brandSet: new Set(),
      })
    }
    map.get(m.providerId)!.brandSet.add(m.brandDisplayName)
  }
  return Array.from(map.values()).map((g) => ({
    id: g.id,
    displayName: g.displayName,
    brandsServed: Array.from(g.brandSet),
  }))
})

const modelsByBrand = computed(() => {
  const map = new Map<string, { brandId: string; brandDisplayName: string; brandSortOrder: number; models: typeof models.value }>()
  for (const m of models.value) {
    if (!map.has(m.brandId)) {
      map.set(m.brandId, {
        brandId: m.brandId,
        brandDisplayName: m.brandDisplayName,
        brandSortOrder: m.brandSortOrder,
        models: [],
      })
    }
    map.get(m.brandId)!.models.push(m)
  }
  return Array.from(map.values()).sort((a, b) => a.brandSortOrder - b.brandSortOrder)
})

const keyInputs = reactive<Record<string, string>>({})
const storedKeys = ref<string[]>([])
const envLoadedKeys = ref<string[]>([])
const mockMode = ref(false)

// FR-065 — mapping providerId → nom de variable env (purement informatif côté UI)
const ENV_VAR_BY_PROVIDER: Record<string, string> = {
  openai: 'OPENAI_API_KEY',
  openrouter: 'OPENROUTER_API_KEY',
  fal: 'FAL_API_KEY',
  'google-ai': 'GOOGLE_AI_API_KEY',
}

async function loadKeys() {
  try {
    const data = await $fetch<{ providers: string[]; envLoaded: string[] }>('/api/settings/keys')
    storedKeys.value = data.providers
    envLoadedKeys.value = data.envLoaded ?? []
  } catch {}
}
onMounted(async () => {
  await Promise.all([loadKeys(), loadProviderMode()])
  mockMode.value = providerMode.value !== 'live'
})

function hasKey(providerId: string) { return storedKeys.value.includes(providerId) }
function isLoadedFromEnv(providerId: string) { return envLoadedKeys.value.includes(providerId) }
function envVarFor(providerId: string) { return ENV_VAR_BY_PROVIDER[providerId] ?? '' }
function placeholderFor(providerId: string): string {
  if (isLoadedFromEnv(providerId)) return `Chargée depuis ${envVarFor(providerId)} — saisir pour remplacer`
  if (hasKey(providerId)) return 'Clé enregistrée — saisir pour remplacer'
  return 'Saisir la clé...'
}

async function saveKey(providerId: string) {
  const apiKey = keyInputs[providerId]
  if (!apiKey) return
  await $fetch('/api/settings/keys', { method: 'PUT', body: { providerId, apiKey } })
  keyInputs[providerId] = ''
  await loadKeys()
  await load()
}
</script>
