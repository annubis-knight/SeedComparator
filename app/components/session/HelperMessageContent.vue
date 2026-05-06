<template>
  <div class="space-y-2" data-testid="helper-message-content">
    <template v-for="(part, i) in parts" :key="i">
      <!-- Plain text segment -->
      <p v-if="part.type === 'text'" class="whitespace-pre-wrap">{{ part.text }}</p>

      <!-- Prompt block with Insert button -->
      <div
        v-else
        class="rounded-lg border border-accent/30 bg-accent/5 p-2 space-y-1"
        :data-testid="`prompt-block-${part.variantIdx}`"
      >
        <div class="flex items-center justify-between gap-2 flex-wrap">
          <span class="text-[10px] uppercase tracking-wider text-accent font-medium">
            Prompt {{ VARIANT_LABELS[part.variantIdx] ?? part.variantIdx + 1 }}
          </span>
          <button
            class="text-[11px] px-2 py-0.5 rounded border border-accent/40 text-accent hover:bg-accent/10 transition-colors shrink-0"
            :data-testid="`insert-btn-${part.variantIdx}`"
            @click="$emit('insert', part.prompt, part.variantIdx)"
          >↳ Insérer en {{ VARIANT_LABELS[part.variantIdx] ?? '?' }}</button>
        </div>
        <p class="text-xs text-text-muted font-mono leading-relaxed whitespace-pre-wrap">{{ part.prompt }}</p>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { parsePromptBlocks, VARIANT_LABELS } from '~/utils/promptBlockParser'

const props = defineProps<{ content: string }>()
defineEmits<{ (e: 'insert', prompt: string, idx: number): void }>()

interface TextPart { type: 'text'; text: string }
interface PromptPart { type: 'prompt'; prompt: string; variantIdx: number }
type Part = TextPart | PromptPart

const parts = computed<Part[]>(() => {
  const blocks = parsePromptBlocks(props.content)
  if (blocks.length === 0) return [{ type: 'text', text: props.content }]

  const result: Part[] = []
  let remaining = props.content
  let variantIdx = 0

  for (const block of blocks) {
    // Find the full fence (```prompt...```) in the remaining text
    const fenceStart = remaining.indexOf('```prompt')
    if (fenceStart === -1) break
    const fenceEnd = remaining.indexOf('```', fenceStart + 3)
    if (fenceEnd === -1) break

    const before = remaining.slice(0, fenceStart).trim()
    if (before) result.push({ type: 'text', text: before })

    result.push({ type: 'prompt', prompt: block, variantIdx })
    variantIdx++
    remaining = remaining.slice(fenceEnd + 3).trim()
  }

  if (remaining) result.push({ type: 'text', text: remaining })
  return result
})
</script>
