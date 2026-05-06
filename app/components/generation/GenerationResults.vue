<template>
  <div class="h-full min-h-0 overflow-hidden flex flex-col pt-8">
    <GenerationGrid
      class="flex-1 min-h-0 px-8 pb-8"
      :generations="generations"
      :models="models"
      :ratio="ratio"
      :mode="mode"
      :active-prompt-idx="activePromptIdx"
      :prompts="prompts"
      :show-all-prompts="showAllPrompts"
      @update:mode="$emit('update:mode', $event)"
      @update:active-prompt-idx="$emit('update:activePromptIdx', $event)"
      @update:show-all-prompts="$emit('update:showAllPrompts', $event)"
      @open="$emit('open', $event)"
      @details="$emit('details', $event)"
      @save="$emit('save', $event)"
      @like="$emit('like', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import type { Ratio, ModelDTO } from '#shared/contracts'
import type { LiveGeneration } from '~/composables/useGenerationSession'

defineProps<{
  generations: LiveGeneration[]
  models: ModelDTO[]
  ratio: Ratio
  mode: 'grid' | 'flex'
  activePromptIdx: number
  prompts: string[]
  showAllPrompts: boolean
}>()

defineEmits<{
  (e: 'update:mode', v: 'grid' | 'flex'): void
  (e: 'update:activePromptIdx', v: number): void
  (e: 'update:showAllPrompts', v: boolean): void
  (e: 'open', gen: LiveGeneration): void
  (e: 'details', gen: LiveGeneration): void
  (e: 'save', gen: LiveGeneration): void
  (e: 'like', gen: LiveGeneration): void
}>()
</script>
