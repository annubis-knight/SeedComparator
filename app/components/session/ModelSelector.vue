<template>
  <div class="space-y-4">
    <label class="block text-sm font-medium text-text-muted">Modèles</label>
    <div v-for="group in grouped" :key="group.brandId" class="space-y-1.5">
      <div class="text-xs uppercase tracking-wider text-text-dim">{{ group.brandDisplayName }}</div>
      <!--
        EPIC-18 / STORY-124 (révision UX 2026-05-06) — Le sélecteur revient à
        son rôle initial : sélectionner les modèles. Les paramètres avancés ont
        leur propre section dans le panneau "Configuration de l'image"
        (ImageConfigPanel : paramètres canoniques + section "Spécifique par modèle").
        Le badge "modifié" reste ici
        à titre INFORMATIF : l'utilisateur voit en un coup d'œil quels modèles
        ont une config custom, sans avoir à ouvrir l'autre panneau.
      -->
      <label
        v-for="m in group.models"
        :key="m.id"
        class="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors hover:bg-glass"
        :class="{ 'opacity-40': isDisabled(m) }"
        :title="disabledReason(m)"
        :data-testid="`model-row-${m.id}`"
      >
        <input
          type="checkbox"
          class="w-4 h-4 accent-accent"
          :checked="modelValue.includes(m.id)"
          :disabled="isDisabled(m)"
          @change="toggle(m.id, ($event.target as HTMLInputElement).checked)"
        />
        <div class="flex-1">
          <div class="text-sm flex items-center gap-2">
            <span>{{ m.displayName }}</span>
            <span
              v-if="hasOverridesFor(m.id)"
              class="dot-modified"
              :data-testid="`badge-modified-${m.id}`"
              title="Paramètres personnalisés (voir « Paramètres avancés » dans la configuration de l'image)"
            />
          </div>
          <div class="text-xs text-text-dim">${{ m.pricePerImage.toFixed(3) }} / image · seed: {{ m.supportsSeed ? '✓' : '—' }}</div>
        </div>
        <span v-if="!m.hasApiKey" class="text-xs text-danger" data-testid="badge-no-key">clé manquante</span>
        <span v-else-if="!m.hasFixture" class="text-xs text-warn" data-testid="badge-no-fixture">fixture manquante</span>
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ModelDTO } from '#shared/contracts'
import { useModelParams } from '../../composables/useModelParams'

const props = defineProps<{ modelValue: string[]; models: ModelDTO[] }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: string[]): void }>()

// STORY-124 révision UX 2026-05-06 — on garde uniquement le badge "modifié"
// (informatif). L'édition des paramètres se fait depuis ImageConfigPanel.
const { hasOverridesFor } = useModelParams()

interface BrandGroup {
  brandId: string
  brandDisplayName: string
  brandSortOrder: number
  models: ModelDTO[]
}

const grouped = computed<BrandGroup[]>(() => {
  const map = new Map<string, BrandGroup>()
  for (const m of props.models) {
    if (!map.has(m.brandId)) {
      map.set(m.brandId, {
        brandId: m.brandId,
        brandDisplayName: m.brandDisplayName,
        brandSortOrder: m.brandSortOrder,
        models: [],
      })
    }
    map.get(m.brandId)!.models.push(m)
  }
  return Array.from(map.values()).sort((a, b) => a.brandSortOrder - b.brandSortOrder)
})

function isDisabled(m: ModelDTO): boolean {
  if (!m.enabled) return true
  if (!m.hasApiKey) return true
  // STORY-103 (FR-064) — en mode mock-real, gate sur la fixture
  if (!m.hasFixture) return true
  return false
}

function disabledReason(m: ModelDTO): string | undefined {
  if (!m.enabled) return 'Modèle désactivé dans Réglages'
  if (!m.hasApiKey) return 'Clé API manquante pour cette passerelle'
  if (!m.hasFixture) return 'Aucune fixture capturée — teste-le d\'abord sur /models/test (en mode live)'
  return undefined
}

function toggle(id: string, checked: boolean) {
  const set = new Set(props.modelValue)
  if (checked) set.add(id); else set.delete(id)
  emit('update:modelValue', Array.from(set))
}
</script>

<style scoped>
.dot-modified {
  width: 6px;
  height: 6px;
  border-radius: 9999px;
  background: var(--color-accent);
  display: inline-block;
}
</style>
