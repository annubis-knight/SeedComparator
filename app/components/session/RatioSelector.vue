<template>
  <div class="space-y-2">
    <label class="block text-sm font-medium text-text-muted">Ratio</label>
    <div class="flex flex-wrap gap-2">
      <button
        v-for="r in options"
        :key="r"
        type="button"
        class="px-3 py-1.5 rounded-lg text-sm border transition-all"
        :class="modelValue === r
          ? 'border-accent bg-accent-subtle text-text'
          : 'border-glass-border text-text-muted hover:text-text'"
        @click="$emit('update:modelValue', r)"
      >
        {{ r }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Ratio } from '#shared/contracts'

defineProps<{ modelValue: Ratio }>()
defineEmits<{ (e: 'update:modelValue', value: Ratio): void }>()

const options: Ratio[] = ['native', '1:1', '4:5', '2:3', '3:4', '16:9', '21:9']
</script>
