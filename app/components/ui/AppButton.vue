<template>
  <button
    :class="[variant === 'primary' ? 'btn-primary' : 'btn-ghost', extraClass]"
    :disabled="disabled"
    @click="$emit('click', $event)"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
defineProps<{
  variant?: 'primary' | 'ghost'
  disabled?: boolean
  extraClass?: string
}>()
defineEmits<{ (e: 'click', ev: MouseEvent): void }>()
</script>
