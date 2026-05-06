<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-8" @click.self="$emit('close')">
      <button class="absolute top-4 right-4 text-white text-2xl" @click="$emit('close')">✕</button>
      <div class="flex gap-4 max-h-full max-w-full items-center">
        <img v-if="primary?.imageDataUrl" :src="primary.imageDataUrl" class="max-h-[85vh] max-w-[45vw] object-contain rounded-lg" />
        <img v-if="secondary?.imageDataUrl" :src="secondary.imageDataUrl" class="max-h-[85vh] max-w-[45vw] object-contain rounded-lg" />
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { LiveGeneration } from '~/composables/useGenerationSession'

defineProps<{
  open: boolean
  primary: LiveGeneration | null
  secondary?: LiveGeneration | null
}>()
defineEmits<{ (e: 'close'): void }>()
</script>
