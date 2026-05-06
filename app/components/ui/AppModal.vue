<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center p-4" @click.self="$emit('close')">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div class="glass relative w-full max-w-lg p-6">
        <button class="absolute top-3 right-3 text-text-muted hover:text-text" @click="$emit('close')">✕</button>
        <slot />
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
defineProps<{ open: boolean }>()
defineEmits<{ (e: 'close'): void }>()
</script>
