<template>
  <form class="space-y-5" @submit.prevent="onSubmit">
    <p class="text-sm text-text-dim leading-relaxed">
      Tous les champs sont <strong>optionnels</strong>. Le pré-prompt par défaut garantit déjà un haut de landing page avec hero, typographie display et direction éditoriale.
      Tu peux laisser tout vide pour explorer 3 directions complètement libres, ou guider partiellement avec quelques précisions ci-dessous.
    </p>

    <div class="space-y-1.5">
      <label class="text-sm font-medium text-text-muted">Direction artistique souhaitée</label>
      <input
        v-model="form.artDirection"
        type="text"
        class="input-glass w-full"
        placeholder="ex: éditorial luxe / minimaliste scandinave / brutalisme web…"
      />
    </div>

    <div class="space-y-1.5">
      <label class="text-sm font-medium text-text-muted">Mood / ambiance</label>
      <input
        v-model="form.mood"
        type="text"
        class="input-glass w-full"
        placeholder="ex: calme et lumineux / dramatique nocturne / joyeux énergique…"
      />
    </div>

    <div class="space-y-1.5">
      <label class="text-sm font-medium text-text-muted">Style graphique UI / UX souhaité</label>
      <input
        v-model="form.uiStyle"
        type="text"
        class="input-glass w-full"
        placeholder="ex: swiss minimal / neo-brutalism / bento grid / saas tech vibrant…"
      />
    </div>

    <div class="space-y-1.5">
      <label class="text-sm font-medium text-text-muted">Typographie souhaitée</label>
      <input
        v-model="form.typography"
        type="text"
        class="input-glass w-full"
        placeholder="ex: serif éditorial / sans grotesque oversized / mono tech / display experimental…"
      />
    </div>

    <div class="space-y-1.5">
      <label class="text-sm font-medium text-text-muted">Palette / couleurs</label>
      <input
        v-model="form.palette"
        type="text"
        class="input-glass w-full"
        placeholder="ex: earth tones / monochrome dark / pastels désaturés / #f5e6d3 #2d4a3e…"
      />
    </div>

    <!-- URLs dynamiques -->
    <div class="space-y-2">
      <div class="flex items-baseline justify-between">
        <label class="text-sm font-medium text-text-muted">Site existant pour inspiration — URL(s)</label>
        <span class="text-[11px] text-text-dim">{{ form.urls.length }}/10</span>
      </div>
      <div v-for="(_, i) in form.urls" :key="i" class="flex gap-2">
        <input
          v-model="form.urls[i]"
          type="url"
          class="input-glass flex-1"
          :placeholder="i === 0 ? 'https://exemple.com' : `https://exemple.com/page-${i + 1}`"
        />
        <AppButton variant="ghost" type="button" @click="removeUrl(i)">−</AppButton>
      </div>
      <AppButton
        v-if="form.urls.length < 10"
        variant="ghost"
        type="button"
        data-testid="add-url"
        @click="addUrl"
      >+ Ajouter une URL de page</AppButton>
    </div>

    <div class="flex items-center justify-between gap-3 pt-3 border-t border-glass-border">
      <p class="text-xs text-text-dim">
        Si une URL est fournie, son contenu textuel et visuel sera analysé pour t'inspirer.
        Une URL invalide ou en échec bloque l'analyse.
      </p>
      <AppButton variant="primary" type="submit" :disabled="running" data-testid="prompter-btn">
        {{ running ? 'Analyse…' : 'Prompter' }}
      </AppButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import type { BriefRequest } from '#shared/contracts'

const props = defineProps<{ initial?: Partial<BriefRequest>; running?: boolean }>()
const emit = defineEmits<{ (e: 'submit', value: BriefRequest): void }>()

const form = reactive<BriefRequest>({
  artDirection: props.initial?.artDirection ?? '',
  mood: props.initial?.mood ?? '',
  uiStyle: props.initial?.uiStyle ?? '',
  typography: props.initial?.typography ?? '',
  palette: props.initial?.palette ?? '',
  urls: props.initial?.urls ?? [],
})

watch(() => props.initial, (next) => {
  if (!next) return
  form.artDirection = next.artDirection ?? form.artDirection
  form.mood = next.mood ?? form.mood
  form.uiStyle = next.uiStyle ?? form.uiStyle
  form.typography = next.typography ?? form.typography
  form.palette = next.palette ?? form.palette
  if (next.urls) form.urls = [...next.urls]
}, { deep: true })

function addUrl() {
  form.urls.push('')
}

function removeUrl(idx: number) {
  form.urls.splice(idx, 1)
}

function onSubmit() {
  // Tous les champs sont optionnels, on peut soumettre sans rien remplir
  const cleaned: BriefRequest = {
    ...form,
    urls: form.urls.map((u) => u.trim()).filter((u) => u.length > 0),
  }
  emit('submit', cleaned)
}
</script>
