<template>
  <details class="glass p-4 space-y-4" data-testid="context-panel">
    <summary class="cursor-pointer text-sm font-semibold text-text uppercase tracking-wider">
      Contexte extrait ({{ result.contexts.length }} {{ result.contexts.length > 1 ? 'pages' : 'page' }})
    </summary>

    <div v-if="result.contexts.length === 0" class="text-xs text-text-dim">
      Aucune URL fournie — les prompts ont été générés à partir du brief seul.
    </div>

    <div v-for="(ctx, i) in result.contexts" :key="i" class="space-y-2 pt-3 border-t border-glass-border">
      <div class="flex items-start gap-4">
        <img
          :src="ctx.miniDataUrl"
          :alt="`Capture ${ctx.url}`"
          class="w-[200px] h-auto rounded-lg border border-glass-border shrink-0 cursor-zoom-in"
          @click="zoomed = ctx.miniDataUrl"
        />
        <div class="flex-1 min-w-0 space-y-1.5">
          <a :href="ctx.url" target="_blank" rel="noopener" class="text-sm text-accent hover:underline truncate block">
            {{ ctx.url }}
          </a>
          <div v-if="ctx.title" class="text-sm">{{ ctx.title }}</div>
          <div v-if="ctx.metaDescription" class="text-xs text-text-muted">{{ ctx.metaDescription }}</div>

          <div v-if="ctx.palette.length > 0" class="flex gap-1 flex-wrap pt-1">
            <span
              v-for="(p, j) in ctx.palette"
              :key="j"
              class="inline-block w-6 h-6 rounded border border-glass-border"
              :style="{ background: p.hex }"
              :title="`${p.hex} (${p.role})`"
            />
          </div>

          <div v-if="ctx.visualDescription" class="text-xs text-text-muted italic pt-1">
            {{ ctx.visualDescription }}
          </div>
        </div>
      </div>
      <div v-if="ctx.textExcerpt" class="text-xs text-text-dim line-clamp-4 pt-2">
        {{ ctx.textExcerpt }}
      </div>
    </div>

    <!-- Modal zoom -->
    <div
      v-if="zoomed"
      class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-8 cursor-zoom-out"
      @click="zoomed = null"
    >
      <img :src="zoomed" alt="Capture en plein écran" class="max-w-full max-h-full rounded-lg" />
    </div>
  </details>
</template>

<script setup lang="ts">
import type { BriefResult } from '#shared/contracts'

defineProps<{ result: BriefResult }>()

const zoomed = ref<string | null>(null)
</script>
