<template>
  <div class="h-screen flex overflow-hidden">
    <!-- 1. RailNav (Sessions + nav globale conditionnelle) — toujours visible -->
    <RailNav />

    <!-- 2. SidePanel (Image/Providers) — visible uniquement sur la page Génération avec session active -->
    <SidePanel
      v-if="showSidePanel"
      :ratio="shellState.ratio"
      :selected-model-ids="shellState.selectedModelIds"
      :models="shellState.models"
      @update:ratio="shellState.ratio = $event"
      @update:selected-model-ids="shellState.selectedModelIds = $event"
    />

    <!-- 3. Vue centrale -->
    <!-- Sur la page génération (/) le layout est fullheight (overflow-hidden).
         Sur les autres pages le scroll est géré par chaque page elle-même. -->
    <main
      class="flex-1 min-w-0 flex flex-col"
      :class="isGeneratePage ? 'overflow-hidden' : 'overflow-y-auto px-8 py-8'"
    >
      <NuxtPage class="flex-1 min-h-0 min-w-0" />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useShellState } from '~/composables/useShellState'

const route = useRoute()
const shellState = useShellState()
const activeSession = useActiveSession()

const isGeneratePage = computed(() => route.path === '/')
const showSidePanel = computed(() => isGeneratePage.value && activeSession.hasActive.value)
</script>
