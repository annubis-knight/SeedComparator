<template>
  <div class="glass p-4 space-y-2">
    <div class="flex items-center justify-between gap-3">
      <span class="text-[10px] uppercase tracking-wider text-text-dim font-mono">{{ label }}</span>
      <button
        type="button"
        class="text-xs text-text-muted hover:text-text"
        :title="copied ? 'Copié !' : 'Copier'"
        @click="copy"
      >{{ copied ? '✓ copié' : 'copier' }}</button>
    </div>
    <pre class="text-xs text-text whitespace-pre-wrap break-words font-sans leading-relaxed">{{ text }}</pre>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ label: string; text: string }>()

const copied = ref(false)

async function copy() {
  try {
    await navigator.clipboard.writeText(props.text)
    copied.value = true
    setTimeout(() => { copied.value = false }, 1500)
  } catch {}
}
</script>
