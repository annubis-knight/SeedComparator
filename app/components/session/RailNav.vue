<template>
  <aside
    class="flex flex-col self-stretch sticky top-0 h-screen border-r border-glass-border bg-bg-elevated transition-[width] duration-200 ease-out z-30"
    :class="collapsed ? 'w-[64px]' : 'w-[260px]'"
    :aria-expanded="!collapsed"
    data-testid="railnav"
  >
    <!-- Toggle collapse RailNav (toujours visible, en haut) -->
    <div class="flex items-center justify-between gap-2 px-2 py-3 border-b border-glass-border">
      <span v-if="!collapsed" class="text-[10px] uppercase tracking-wider text-text-dim font-mono pl-1">SeedComparator</span>
      <button
        type="button"
        class="w-9 h-9 rounded-lg flex items-center justify-center text-text-muted hover:text-text hover:bg-glass transition-colors ml-auto"
        :title="collapsed ? 'Déployer' : 'Replier'"
        data-testid="railnav-toggle"
        @click="toggle"
      ><span class="text-sm">{{ collapsed ? '›' : '‹' }}</span></button>
    </div>

    <!-- Section NAV (haut) — visible UNIQUEMENT si session active (FR-060) -->
    <nav v-if="hasActiveSession" class="px-2 py-3 border-b border-glass-border space-y-1" aria-label="Navigation principale">
      <NuxtLink
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="flex items-center gap-3 px-2 h-10 rounded-lg transition-colors"
        :class="isActiveRoute(item.path)
          ? 'bg-accent-subtle text-text border border-accent'
          : 'text-text-muted hover:text-text hover:bg-glass border border-transparent'"
        :title="item.label"
        :data-testid="`railnav-${item.id}`"
      >
        <span class="text-base shrink-0">{{ item.icon }}</span>
        <span v-if="!collapsed" class="text-sm truncate">{{ item.label }}</span>
      </NuxtLink>
    </nav>

    <!-- Section SESSIONS — toujours visible -->
    <div class="flex-1 min-h-0 overflow-y-auto px-2 py-3 space-y-2" data-testid="railnav-sessions">
      <div v-if="!collapsed" class="text-[10px] uppercase tracking-wider text-text-dim font-mono px-2">Sessions</div>

      <!-- + Nouvelle session -->
      <button
        type="button"
        class="w-full flex items-center gap-3 px-2 h-10 rounded-lg border border-dashed border-glass-border hover:border-accent hover:text-text text-text-muted transition-colors"
        :title="collapsed ? '+ Nouvelle session' : ''"
        data-testid="new-session-btn"
        @click="onNewSession"
      >
        <span class="text-base shrink-0">＋</span>
        <span v-if="!collapsed" class="text-sm">Nouvelle session</span>
      </button>

      <!-- Liste des sessions (draft virtuel + 5 dernières DB) -->
      <ul v-if="!collapsed" class="space-y-1 pt-2">
        <!-- Entrée DRAFT virtuelle : visible dès qu'on clique "+ Nouvelle session"
             pour donner un feedback immédiat (pattern ChatGPT). Au 1er batch, le
             setFromGenerate la remplacera par la vraie session via loadRecent. -->
        <li v-if="isDraftActive" data-testid="railnav-session-draft">
          <button
            type="button"
            class="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left bg-accent-subtle text-text border border-accent border-dashed"
            disabled
          >
            <div class="flex-1 min-w-0">
              <div class="text-sm truncate italic">Nouvelle session</div>
              <div class="text-[10px] text-text-dim font-mono">en attente du 1er batch</div>
            </div>
          </button>
        </li>
        <li v-for="s in recent" :key="s.id" class="relative group">
          <button
            type="button"
            class="w-full flex items-center gap-2 px-2 py-2 pr-8 rounded-lg text-left transition-colors"
            :class="activeId === s.id
              ? 'bg-accent-subtle text-text border border-accent'
              : 'text-text-muted hover:text-text hover:bg-glass border border-transparent'"
            :data-testid="`railnav-session-${s.id}`"
            @click="onActivateSession(s.id, s.name)"
          >
            <div class="flex-1 min-w-0">
              <div class="text-sm truncate">{{ s.name ?? formatDate(s.createdAt) }}</div>
              <div class="text-[10px] text-text-dim font-mono">{{ s.generationsCount }} gen</div>
            </div>
          </button>

          <!-- Menu "..." (visible au hover ou quand ouvert) -->
          <button
            type="button"
            class="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded flex items-center justify-center text-text-muted hover:text-text hover:bg-glass-strong transition-opacity"
            :class="openMenuId === s.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus:opacity-100'"
            :title="`Actions sur ${s.name ?? 'la session'}`"
            :data-testid="`railnav-session-menu-btn-${s.id}`"
            @click.stop="toggleMenu(s.id)"
          >⋯</button>

          <div
            v-if="openMenuId === s.id"
            class="absolute right-1 top-[calc(100%-4px)] z-40 min-w-[140px] rounded-lg border border-glass-border bg-bg-elevated shadow-lg py-1"
            :data-testid="`railnav-session-menu-${s.id}`"
            @click.stop
          >
            <button
              type="button"
              class="w-full text-left px-3 py-1.5 text-xs text-text-muted hover:text-text hover:bg-glass"
              :data-testid="`railnav-session-rename-${s.id}`"
              @click="onRenameSession(s.id, s.name)"
            >Renommer</button>
            <button
              type="button"
              class="w-full text-left px-3 py-1.5 text-xs text-danger hover:bg-danger-subtle"
              :data-testid="`railnav-session-delete-${s.id}`"
              @click="onDeleteSession(s.id, s.name)"
            >Supprimer</button>
          </div>
        </li>
      </ul>

      <!-- Lien CTA "Voir toutes" -->
      <NuxtLink
        v-if="!collapsed && recent.length > 0"
        to="/sessions"
        class="block text-xs text-accent hover:text-accent-hover px-2 pt-2"
        data-testid="railnav-see-all"
      >→ Voir toutes les sessions</NuxtLink>

      <p v-if="!collapsed && recent.length === 0 && !isDraftActive" class="text-xs text-text-dim px-2 pt-2">
        Aucune session pour l'instant. Crée-en une avec le bouton ci-dessus.
      </p>
    </div>

    <!-- Section NAV (bas) — toujours visible (Réglages à la ChatGPT) -->
    <nav class="px-2 py-3 border-t border-glass-border space-y-1" aria-label="Navigation secondaire">
      <NuxtLink
        v-for="item in bottomNavItems"
        :key="item.path"
        :to="item.path"
        class="flex items-center gap-3 px-2 h-10 rounded-lg transition-colors"
        :class="isActiveRoute(item.path)
          ? 'bg-accent-subtle text-text border border-accent'
          : 'text-text-muted hover:text-text hover:bg-glass border border-transparent'"
        :title="item.label"
        :data-testid="`railnav-${item.id}`"
      >
        <span class="text-base shrink-0">{{ item.icon }}</span>
        <span v-if="!collapsed" class="text-sm truncate">{{ item.label }}</span>
      </NuxtLink>
    </nav>

    <!-- Footer : CostMeter compact -->
    <div class="border-t border-glass-border" data-testid="railnav-cost-footer">
      <div v-if="!collapsed" class="px-3 py-2">
        <CostMeter compact />
      </div>
      <div v-else class="px-2 py-2 text-[9px] text-center text-text-dim font-mono">$</div>
    </div>
  </aside>
</template>

<script setup lang="ts">
const router = useRouter()
const route = useRoute()
const { collapsed, toggle } = useRailNav()
const activeSession = useActiveSession()

const recent = computed(() => activeSession.recent.value)
const activeId = computed(() => activeSession.activeId.value)
// hasActiveSession inclut le mode draft (workflow génération démarré sans id DB)
const hasActiveSession = computed(() => activeSession.hasActive.value)
// Draft = "+ Nouvelle session" cliqué, pas encore de batch lancé. On affiche
// une entrée fantôme dans la liste pour donner un feedback immédiat.
const isDraftActive = computed(() => activeSession.draftMode.value)

// Section haute — nécessite une session active
const navItems = [
  { id: 'accueil', label: 'Brief', icon: '🏠', path: '/home' },
  { id: 'generation', label: 'Génération', icon: '🎨', path: '/' },
]

// Section basse — toujours visible (pattern ChatGPT : settings near footer)
const bottomNavItems = [
  { id: 'models-test', label: 'Test modèles', icon: '🧪', path: '/models/test' },
  { id: 'reglages', label: 'Réglages', icon: '⚙', path: '/settings' },
]

function isActiveRoute(path: string): boolean {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

function onNewSession() {
  // STORY-099 : démarre une session "draft" pour afficher le workflow génération vide.
  // Au 1er batch, le serveur créera la Session DB et `setFromGenerate` sortira du draft.
  activeSession.startDraft()
  router.push('/')
}

function onActivateSession(id: string, name: string | null) {
  activeSession.activate(id, name)
  router.push('/')
}

// ─── Menu actions "..." sur chaque session (Renommer / Supprimer) ────────────
const openMenuId = ref<string | null>(null)
function toggleMenu(id: string) {
  openMenuId.value = openMenuId.value === id ? null : id
}
function closeMenu() { openMenuId.value = null }

async function onRenameSession(id: string, currentName: string | null) {
  closeMenu()
  if (typeof window === 'undefined') return
  const input = window.prompt('Nouveau nom pour la session :', currentName ?? '')
  if (!input) return
  const trimmed = input.trim()
  if (!trimmed) return
  try {
    await $fetch(`/api/sessions/${id}`, { method: 'PATCH', body: { name: trimmed } })
    if (activeSession.activeId.value === id) activeSession.setName(trimmed)
    await activeSession.loadRecent(5)
  } catch {}
}

async function onDeleteSession(id: string, name: string | null) {
  closeMenu()
  if (typeof window === 'undefined') return
  const ok = window.confirm(`Supprimer la session "${name ?? 'sans nom'}" et toutes ses générations ?`)
  if (!ok) return
  try {
    await activeSession.remove(id)
  } catch {}
}

// Close menu on outside click / Escape
function onDocClick(e: MouseEvent) {
  if (!openMenuId.value) return
  const target = e.target as HTMLElement | null
  if (target?.closest('[data-testid^="railnav-session-menu"]')) return
  closeMenu()
}
function onDocKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') closeMenu()
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

// Charge la liste au mount
onMounted(() => {
  activeSession.loadRecent(5)
  if (typeof document !== 'undefined') {
    document.addEventListener('click', onDocClick)
    document.addEventListener('keydown', onDocKeydown)
  }
})
onBeforeUnmount(() => {
  if (typeof document !== 'undefined') {
    document.removeEventListener('click', onDocClick)
    document.removeEventListener('keydown', onDocKeydown)
  }
})
</script>
