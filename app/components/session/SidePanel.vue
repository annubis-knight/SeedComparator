<template>
  <aside
    class="flex flex-col self-stretch sticky top-0 h-screen border-r border-glass-border transition-[width] duration-200 ease-out z-20"
    :class="collapsed ? 'w-[56px]' : 'w-[340px]'"
    :aria-expanded="!collapsed"
    data-testid="sidepanel"
  >
    <!-- Mode collapsed : bande étroite avec icônes des tabs -->
    <template v-if="collapsed">
      <div class="flex flex-col items-center gap-1 py-3 bg-bg-elevated h-full">
        <button
          type="button"
          class="w-10 h-9 rounded-lg flex items-center justify-center text-text-muted hover:text-text hover:bg-glass transition-colors"
          title="Déployer la configuration"
          data-testid="sidepanel-toggle"
          @click="toggle"
        ><span class="text-sm">»</span></button>

        <div class="w-8 border-t border-glass-border my-1" />

        <button
          type="button"
          class="w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-colors"
          :class="activeTab === 'image'
            ? 'bg-accent-subtle text-text border border-accent'
            : 'text-text-muted hover:text-text hover:bg-glass'"
          :aria-pressed="activeTab === 'image'"
          title="Configuration de l'image"
          data-testid="tab-image-collapsed"
          @click="onTabClickCollapsed('image')"
        >🎨</button>
        <button
          type="button"
          class="w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-colors"
          :class="activeTab === 'providers'
            ? 'bg-accent-subtle text-text border border-accent'
            : 'text-text-muted hover:text-text hover:bg-glass'"
          :aria-pressed="activeTab === 'providers'"
          title="Choix du provider"
          data-testid="tab-providers-collapsed"
          @click="onTabClickCollapsed('providers')"
        >⚡</button>
      </div>
    </template>

    <!-- Mode déployé : onglets horizontaux + contenu plein largeur -->
    <template v-else>
      <!-- Barre d'onglets : tabs à gauche + bouton collapse à droite -->
      <div class="flex items-center justify-between gap-1 border-b border-glass-border bg-bg-elevated px-2 py-2">
        <div class="flex items-center gap-1" role="tablist" aria-label="Configuration">
          <button
            type="button"
            role="tab"
            :aria-selected="activeTab === 'image'"
            class="flex items-center gap-2 px-3 h-9 rounded-lg text-sm transition-colors"
            :class="activeTab === 'image'
              ? 'bg-accent-subtle text-text border border-accent'
              : 'text-text-muted hover:text-text hover:bg-glass border border-transparent'"
            data-testid="tab-image"
            @click="setActiveTab('image')"
          >
            <span>🎨</span><span>Configuration de l'image</span>
          </button>
          <button
            type="button"
            role="tab"
            :aria-selected="activeTab === 'providers'"
            class="flex items-center gap-2 px-3 h-9 rounded-lg text-sm transition-colors"
            :class="activeTab === 'providers'
              ? 'bg-accent-subtle text-text border border-accent'
              : 'text-text-muted hover:text-text hover:bg-glass border border-transparent'"
            data-testid="tab-providers"
            @click="setActiveTab('providers')"
          >
            <span>⚡</span><span>Choix du provider</span>
          </button>
        </div>

        <button
          type="button"
          class="w-9 h-9 rounded-lg flex items-center justify-center text-text-muted hover:text-text hover:bg-glass transition-colors shrink-0"
          title="Replier la configuration"
          data-testid="sidepanel-toggle"
          @click="toggle"
        ><span class="text-sm">«</span></button>
      </div>

      <!-- Contenu de l'onglet actif (plus de SessionHeader, plus de rail annexe) -->
      <div
        class="flex-1 min-h-0 glass rounded-none p-6 overflow-y-auto"
        data-testid="sidepanel-content"
      >
        <ImageConfigPanel
          v-if="activeTab === 'image'"
          :ratio="ratio"
          :selected-model-ids="selectedModelIds"
          :models="models"
          @update:ratio="$emit('update:ratio', $event)"
        />
        <ProvidersPanel
          v-if="activeTab === 'providers'"
          :selected="selectedModelIds"
          :models="models"
          @update:selected="$emit('update:selectedModelIds', $event)"
        />
      </div>
    </template>
  </aside>
</template>

<script setup lang="ts">
import type { Ratio, ModelDTO } from '#shared/contracts'
import type { SidePanelTab } from '~/composables/useSidePanel'

withDefaults(defineProps<{
  ratio?: Ratio
  selectedModelIds?: string[]
  models?: ModelDTO[]
}>(), {
  ratio: 'native',
  selectedModelIds: () => [],
  models: () => [],
})

defineEmits<{
  (e: 'update:ratio', value: Ratio): void
  (e: 'update:selectedModelIds', value: string[]): void
}>()

const { collapsed, activeTab, toggle, setActiveTab } = useSidePanel()

/**
 * En mode collapsed, cliquer sur l'icône d'un tab change l'onglet actif
 * ET déploie le panneau. `setActiveTab` gère déjà le déploiement automatique
 * quand collapsed (cf. `useSidePanel`).
 */
function onTabClickCollapsed(tab: SidePanelTab) {
  setActiveTab(tab)
}
</script>
