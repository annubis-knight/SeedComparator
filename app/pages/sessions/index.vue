<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between gap-3 flex-wrap">
      <h1 class="text-2xl font-semibold">Galerie des sessions</h1>
      <button
        type="button"
        class="text-sm px-3 py-1.5 rounded-lg border transition-colors"
        :class="onlyLiked
          ? 'border-danger bg-danger/10 text-danger'
          : 'border-glass-border text-text-muted hover:text-text'"
        data-testid="filter-liked-toggle"
        @click="onlyLiked = !onlyLiked"
      >❤ Likées uniquement {{ onlyLiked ? '· actif' : '' }}</button>
    </div>

    <div v-if="loading" class="text-text-muted">Chargement…</div>
    <div v-else-if="filteredSessions.length === 0" class="glass p-8 text-center text-text-muted">
      <template v-if="onlyLiked">
        Aucune session avec des images likées.
      </template>
      <template v-else>
        Aucune session. Lance une première comparaison depuis l'onglet Exploration.
      </template>
    </div>
    <div v-else class="grid gap-3">
      <NuxtLink
        v-for="s in filteredSessions"
        :key="s.id"
        :to="`/sessions/${s.id}`"
        class="glass glass-hover p-4 flex items-center justify-between"
      >
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1 flex-wrap">
            <span class="text-xs text-text-dim">{{ formatDate(s.createdAt) }}</span>
            <span v-if="s.saved" class="text-xs px-1.5 py-0.5 rounded bg-success/20 text-success">sauvegardée</span>
            <span v-if="s.likedCount > 0" class="text-xs px-1.5 py-0.5 rounded bg-danger/20 text-danger" data-testid="liked-badge">❤ {{ s.likedCount }}</span>
          </div>
          <div class="text-sm truncate">{{ s.name ?? s.prompts.join(' • ') }}</div>
        </div>
        <div class="text-right text-xs">
          <div class="text-text">{{ s.successCount }}/{{ s.generationsCount }}</div>
          <div class="text-text-dim font-mono">${{ s.totalCostUsd.toFixed(3) }}</div>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
interface SessionListItem {
  id: string
  name: string | null
  createdAt: string
  prompts: string[]
  saved: boolean
  generationsCount: number
  successCount: number
  likedCount: number
  totalCostUsd: number
}

const sessions = ref<SessionListItem[]>([])
const loading = ref(true)
const onlyLiked = ref(false)

onMounted(async () => {
  try {
    const data = await $fetch<{ sessions: SessionListItem[] }>('/api/sessions')
    sessions.value = data.sessions
  } finally {
    loading.value = false
  }
})

const filteredSessions = computed(() =>
  onlyLiked.value
    ? sessions.value.filter((s) => s.likedCount > 0)
    : sessions.value,
)

function formatDate(s: string) {
  return new Date(s).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
}
</script>
