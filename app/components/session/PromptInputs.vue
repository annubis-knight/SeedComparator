<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between gap-3 flex-wrap">
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="w-7 h-7 rounded-md flex items-center justify-center text-text-muted hover:text-text hover:bg-glass transition-colors"
          title="Réinitialiser aux pré-prompts par défaut"
          data-testid="prompt-reset"
          @click="$emit('reset')"
        >
          <span class="text-sm">↺</span>
        </button>
        <label class="block text-sm font-medium text-text-muted">Prompt</label>
      </div>

      <div class="flex items-center gap-3 flex-wrap">
        <div class="flex gap-1" role="tablist" aria-label="Variantes de prompt">
          <button
            v-for="(label, i) in TAB_LABELS"
            :key="label"
            type="button"
            role="tab"
            :aria-selected="activeTab === i"
            :data-testid="`prompt-tab-${label}`"
            class="relative px-3 py-1.5 rounded-lg text-sm border transition-all"
            :class="activeTab === i
              ? 'border-accent bg-accent-subtle text-text'
              : 'border-glass-border text-text-muted hover:text-text'"
            @click="activeTab = i"
          >
            {{ label }}
            <span
              v-if="isFilled(i)"
              class="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-accent"
              :data-testid="`prompt-dot-${label}`"
            />
          </button>
        </div>

        <!-- Slot pour les boutons d'action (Générer / Stop) -->
        <div v-if="$slots.actions" class="flex items-center gap-2">
          <slot name="actions" />
        </div>
      </div>
    </div>

    <textarea
      :key="`textarea-${activeTab}`"
      class="input-glass min-h-[120px] resize-y w-full"
      :placeholder="placeholders[activeTab]"
      :value="modelValue[activeTab] ?? ''"
      :data-testid="`prompt-textarea-${TAB_LABELS[activeTab]}`"
      @input="onInput(activeTab, ($event.target as HTMLTextAreaElement).value)"
    />
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue: string[]
  activeTab?: number
}>(), {})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string[]): void
  (e: 'update:activeTab', value: number): void
  (e: 'reset'): void
}>()

const TAB_LABELS = ['A', 'B', 'C'] as const
const internalActive = ref(0)
const activeTab = computed<number>({
  get: () => props.activeTab ?? internalActive.value,
  set: (v: number) => {
    internalActive.value = v
    emit('update:activeTab', v)
  },
})

const placeholders = [
  'Variante A — ex: langage naturel descriptif',
  'Variante B (optionnelle) — ex: mots-clés / tags',
  'Variante C (optionnelle) — ex: style structuré',
]

function isFilled(idx: number): boolean {
  return (props.modelValue[idx] ?? '').trim().length > 0
}

function onInput(idx: number, value: string) {
  const next = [...props.modelValue]
  while (next.length < 3) next.push('')
  next[idx] = value
  emit('update:modelValue', next)
}
</script>
