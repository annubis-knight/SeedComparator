<template>
  <div v-if="!session" class="text-text-muted">Chargement…</div>
  <div v-else class="space-y-6">
    <div class="flex items-center justify-between gap-3 flex-wrap">
      <div>
        <h1 class="text-2xl font-semibold">{{ session.name ?? 'Session' }}</h1>
        <div class="text-xs text-text-dim mt-1">{{ formatDate(session.createdAt) }}</div>
      </div>
      <div class="flex items-center gap-2">
        <AppButton variant="primary" @click="saveSession">Sauvegarder la session</AppButton>
      </div>
    </div>

    <!-- Méta session -->
    <div class="glass p-4 space-y-2">
      <div class="text-xs text-text-dim uppercase tracking-wider">Info session</div>
      <div class="text-xs text-text-dim">
        Phase active : <span class="text-text">{{ PHASE_LABELS[session.activePhase] ?? session.activePhase }}</span>
        · Total: ${{ session.totalCostUsd.toFixed(3) }} · Ratio: {{ session.ratio ?? 'native' }}
        <span v-if="likedCount > 0" class="text-danger ml-2">· {{ likedCount }} likée{{ likedCount > 1 ? 's' : '' }}</span>
      </div>
    </div>

    <!-- STORY-107 — Filtres -->
    <HistoryFilters :filters="filters" @reset="resetFilters()" />

    <!-- Grille -->
    <div v-if="filteredGenerations.length === 0" class="glass p-8 text-center text-text-muted">
      <template v-if="filters.likedOnly">Aucune image likée avec ces filtres.</template>
      <template v-else>Aucune génération dans cette session.</template>
    </div>
    <div v-else class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <GenerationCard
        v-for="g in filteredGenerations"
        :key="g.taskId"
        :gen="g"
        :history-mode="true"
        :ratio="session.ratio as Ratio ?? '1:1'"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SessionDTO, Ratio } from '#shared/contracts'
import { PHASE_LABELS } from '#shared/contracts'
import { useHistoryFilters } from '~/composables/useHistoryFilters'
import { dtoToLive } from '~/utils/generationDtoToLive'

const route = useRoute()
const session = ref<SessionDTO | null>(null)
const { filters, applyFilters, resetFilters } = useHistoryFilters()

const likedCount = computed(() => session.value?.generations.filter((g) => g.liked).length ?? 0)

const allGenerations = computed(() =>
  (session.value?.generations ?? []).map(dtoToLive),
)

// @requirement: FR-059, FR-072
const filteredGenerations = computed(() => applyFilters(allGenerations.value))

async function load() {
  try {
    session.value = await $fetch<SessionDTO>(`/api/sessions/${route.params.id}`)
  } catch (e) {
    console.error(e)
  }
}
onMounted(load)

function formatDate(s: string) {
  return new Date(s).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })
}

async function saveSession() {
  if (!session.value) return
  const folder = await window.seedApi?.dialog.selectFolder()
  if (!folder) return
  await $fetch('/api/save/session', { method: 'POST', body: { sessionId: session.value.id, folder } })
  await load()
}
</script>
