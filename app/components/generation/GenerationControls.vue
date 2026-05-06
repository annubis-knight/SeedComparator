<template>
  <div class="flex flex-col">
    <!-- Barre de contrôle : toujours visible -->
    <div
      class="flex items-center gap-3 px-8 py-3 shrink-0 min-w-0"
    >
      <!-- Toggle collapse -->
      <button
        type="button"
        class="w-6 h-6 rounded flex items-center justify-center text-text-muted hover:text-text hover:bg-glass transition-colors shrink-0"
        :title="collapsed ? 'Déployer les prompts' : 'Replier les prompts'"
        data-testid="controls-collapse-toggle"
        @click="$emit('update:collapsed', !collapsed)"
      >
        <span class="text-xs leading-none transition-transform duration-200" :style="{ transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }">▾</span>
      </button>

      <span class="text-xs text-text-muted font-medium shrink-0">Phase :</span>
      <PhaseSelector
        :model-value="phase"
        @update:model-value="$emit('update:phase', $event)"
      />

      <!-- Aperçu du prompt actif quand collapsé -->
      <span
        v-if="collapsed && activePromptPreview"
        class="text-xs text-text-dim truncate flex-1 min-w-0"
        data-testid="controls-prompt-preview"
      >· {{ activePromptPreview }}</span>

      <!-- Bouton assistant — toujours à droite, devient le seul CTA en mode collapsé -->
      <button
        type="button"
        class="ml-auto text-xs px-3 py-1.5 rounded-lg border border-glass-border text-text-muted hover:text-text hover:border-accent/60 transition-colors flex items-center gap-1.5 shrink-0"
        data-testid="helper-open-btn"
        @click="$emit('openHelper')"
      >✨ Assistant</button>
    </div>

    <!-- Corps : animé à l'ouverture/fermeture -->
    <Transition name="collapse">
      <div v-if="!collapsed" class="flex flex-col gap-4 py-4 overflow-hidden">
        <PromptInputs
          class="px-8"
          :model-value="prompts"
          :active-tab="activePromptIdx"
          @update:model-value="$emit('update:prompts', $event)"
          @update:active-tab="$emit('update:activePromptIdx', $event)"
          @reset="$emit('reset')"
        >
          <template #actions>
            <slot name="actions" />
          </template>
        </PromptInputs>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import type { Phase } from '#shared/contracts'

const props = defineProps<{
  phase: Phase
  prompts: string[]
  activePromptIdx: number
  collapsed: boolean
}>()

defineEmits<{
  (e: 'update:phase', v: Phase): void
  (e: 'update:prompts', v: string[]): void
  (e: 'update:activePromptIdx', v: number): void
  (e: 'update:collapsed', v: boolean): void
  (e: 'reset'): void
  (e: 'openHelper'): void
}>()

const activePromptPreview = computed(() =>
  (props.prompts[props.activePromptIdx] ?? '').trim().slice(0, 80),
)
</script>

<style scoped>
/* Collapse du corps : glissement vertical + fondu */
.collapse-enter-active,
.collapse-leave-active {
  transition: max-height 0.28s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.22s ease;
  max-height: 400px;
  opacity: 1;
  overflow: hidden;
}
.collapse-enter-from,
.collapse-leave-to {
  max-height: 0;
  opacity: 0;
}

</style>
