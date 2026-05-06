<template>
  <div class="glass glass-hover" :class="padding">
    <slot />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ padding?: string }>()
const padding = computed(() => props.padding ?? 'p-4')
</script>
