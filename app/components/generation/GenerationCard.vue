<template>
  <div class="flex flex-col gap-3 self-start" :data-testid="`gen-card-wrapper`">
    <div
      class="glass overflow-hidden flex flex-col"
      :class="{ 'opacity-90': gen.status === 'failed' }"
    >
      <div
        class="bg-bg-elevated flex items-center justify-center relative gen-card-min-h"
        :class="aspectClass"
        :data-testid="`gen-card-${gen.status}`"
      >
      <!-- Idle : placeholder structuré (icône image + label) — FR-048 -->
      <template v-if="gen.status === 'idle'">
        <div class="absolute inset-0 bg-glass" data-testid="placeholder-bg" />
        <div class="relative z-10 flex flex-col items-center gap-2 text-text-dim">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            data-testid="placeholder-icon"
            aria-hidden="true"
          >
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
          </svg>
          <span class="text-[11px] uppercase tracking-wider">En attente</span>
        </div>
      </template>

      <!-- Pending : skeleton animé + icône -->
      <template v-else-if="gen.status === 'pending'">
        <div class="absolute inset-0 bg-glass animate-pulse" />
        <div class="relative z-10 flex flex-col items-center gap-2 text-text-muted">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="animate-spin"
            aria-hidden="true"
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          <span class="text-[11px] uppercase tracking-wider">Génération…</span>
        </div>
      </template>

      <!-- Success : image -->
      <template v-else-if="gen.status === 'success' && gen.imageDataUrl">
        <img :src="gen.imageDataUrl" :alt="gen.modelId" class="w-full h-full object-cover cursor-zoom-in" @click="$emit('open', gen)" />
        <!-- STORY-104 : badge "fixture A" sur cartes B/C en mode mock-real (replay de la fixture A) -->
        <span
          v-if="isReplayedFromAOnNonA"
          class="absolute top-2 left-2 z-10 text-[10px] px-1.5 py-0.5 rounded bg-warn/90 text-bg font-medium border border-warn"
          :title="`Cette image vient de la fixture du prompt A (mode mock-real, fixture B/C non capturée). Lance \`npm run probe:* --overwrite\` après avoir basculé en mode live pour capturer une vraie fixture.`"
          data-testid="replay-from-a-badge"
        >fixture A</span>
      </template>

      <!-- Failed : icône d'erreur + code/message -->
      <template v-else-if="gen.status === 'failed'">
        <div class="flex flex-col items-center gap-2 text-danger px-4 text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4" />
            <path d="M12 16h.01" />
          </svg>
          <div class="font-semibold text-xs">{{ gen.errorCode }}</div>
          <div class="opacity-70 text-xs">{{ gen.errorMsg }}</div>
        </div>
      </template>

      <!-- Aborted -->
      <template v-else-if="gen.status === 'aborted'">
        <div class="text-text-muted text-xs uppercase tracking-wider">annulé</div>
      </template>
    </div>

      <div class="gen-card-padding flex items-center justify-between text-xs gap-3">
        <div class="min-w-0 flex-1">
          <div class="text-text flex items-center gap-2 flex-wrap">
            <span class="truncate">{{ shortName }}</span>
            <span
              v-if="gatewayDisplayName"
              class="text-[10px] px-1.5 py-0.5 rounded border border-glass-border text-text-dim font-normal shrink-0"
              data-testid="gateway-tag"
            >via {{ gatewayDisplayName }}</span>
            <!-- STORY-107 — badges phase + variant en historyMode -->
            <template v-if="historyMode">
              <span
                class="text-[10px] px-1.5 py-0.5 rounded border font-medium shrink-0"
                :class="phaseColorClass"
                data-testid="phase-badge"
              >{{ phaseLabel }}</span>
              <span
                class="text-[10px] px-1.5 py-0.5 rounded border border-glass-border text-text-dim font-medium shrink-0"
                data-testid="variant-badge"
              >{{ gen.promptVariant }}</span>
            </template>
          </div>
          <div class="text-text-dim font-mono flex items-center gap-1.5">
            <span>seed:</span>
            <span
              v-if="gen.seed != null"
              class="cursor-pointer hover:text-text"
              :title="`Cliquer pour copier ${gen.seed}`"
              :data-testid="`seed-copy-${gen.id}`"
              @click="copySeed(gen.seed!)"
            >{{ gen.seed }}</span>
            <span v-else>—</span>
            <button
              v-if="gen.seed != null && !historyMode"
              type="button"
              class="lock-btn"
              :class="{ 'lock-btn-on': isLocked }"
              :title="isLocked ? `Seed verrouillée pour ${gen.modelDisplayName}` : `Verrouiller cette seed pour les prochaines générations de ${gen.modelDisplayName}`"
              :data-testid="`seed-lock-${gen.id}`"
              @click="toggleLock"
            >{{ isLocked ? '🔒' : '🔓' }}</button>
            <span class="ml-1">· ${{ gen.costUsd.toFixed(3) }}</span>
          </div>
        </div>
        <div class="flex gap-1">
          <button
            v-if="gen.status === 'success' && !historyMode"
            class="px-1.5 transition-colors"
            :class="gen.liked ? 'text-danger hover:opacity-80' : 'text-text-muted hover:text-danger'"
            :title="gen.liked ? 'Retirer des favoris (supprime du disque)' : 'Marquer comme favori (sauvegarde sur disque)'"
            data-testid="like-btn"
            @click="$emit('like', gen)"
          >{{ gen.liked ? '❤' : '♡' }}</button>
          <span
            v-else-if="gen.status === 'success' && historyMode && gen.liked"
            class="px-1.5 text-danger"
            data-testid="liked-indicator"
            title="Image likée"
          >❤</span>
          <button
            v-if="gen.status === 'success' && !historyMode"
            class="text-text-muted hover:text-text px-1.5"
            title="Détails"
            @click="$emit('details', gen)"
          >ℹ</button>
          <button
            v-if="gen.status === 'success' && !historyMode"
            class="text-text-muted hover:text-accent px-1.5"
            title="Sauvegarder ailleurs"
            @click="$emit('save', gen)"
          >⬇</button>
        </div>
      </div>
    </div>

    <!-- Zone "Prompt utilisé" sous la card (FR-052) — visible si promptText fourni -->
    <div
      v-if="promptText !== undefined"
      class="px-1 space-y-1"
      data-testid="card-prompt-area"
    >
      <div class="text-[10px] uppercase tracking-wider text-text-dim">Prompt</div>
      <p class="text-xs text-text-muted leading-relaxed line-clamp-4 break-words">
        {{ promptText || '—' }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Ratio } from '#shared/contracts'
import { PHASE_LABELS } from '#shared/contracts'
import type { LiveGeneration } from '../../composables/useGenerationSession'
import { usePerGenerationParams } from '../../composables/usePerGenerationParams'

const props = withDefaults(defineProps<{
  gen: LiveGeneration
  modelDisplayName?: string
  gatewayDisplayName?: string
  ratio?: Ratio
  /**
   * Prompt à afficher sous la card (zone optionnelle).
   * Quand fourni (même chaîne vide), la zone "Prompt" est rendue.
   */
  promptText?: string
  /** @deprecated remplacé par le wrapper auto-sizing — gardé pour compat. */
  fullHeight?: boolean
  /** STORY-107 — mode historique : affiche badges phase+variant, masque actions génération */
  historyMode?: boolean
}>(), { fullHeight: false, historyMode: false })

defineEmits<{
  (e: 'open', gen: LiveGeneration): void
  (e: 'details', gen: LiveGeneration): void
  (e: 'save', gen: LiveGeneration): void
  (e: 'like', gen: LiveGeneration): void
}>()

const shortName = computed(() => props.modelDisplayName ?? props.gen.modelId)

// EPIC-18 / STORY-128 — verrouillage de seed per-generation
const { lockSeed, isSeedLocked } = usePerGenerationParams()
const isLocked = computed(() => isSeedLocked(props.gen.modelId, props.gen.promptIdx))

function toggleLock() {
  if (props.gen.seed == null) return
  if (isLocked.value) {
    lockSeed(props.gen.modelId, props.gen.promptIdx, null)
  } else {
    lockSeed(props.gen.modelId, props.gen.promptIdx, Number(props.gen.seed))
  }
}

async function copySeed(seed: number | string) {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(String(seed))
    }
  } catch {}
}

// STORY-104 — n'affiche le badge que si on est sur une carte B/C (promptIdx > 0)
const isReplayedFromAOnNonA = computed(
  () => props.gen.replayedFromVariant === 'A' && props.gen.promptIdx > 0,
)

// STORY-107 — badges phase/variant en historyMode
const PHASE_COLORS: Record<string, string> = {
  wireframe: 'bg-text-dim/20 text-text-muted border-text-dim/30',
  mood: 'bg-accent/20 text-accent border-accent/30',
  uiux: 'bg-success/20 text-success border-success/30',
}
const phaseLabel = computed(() => PHASE_LABELS[props.gen.phase as keyof typeof PHASE_LABELS] ?? props.gen.phase)
const phaseColorClass = computed(() => PHASE_COLORS[props.gen.phase] ?? 'bg-glass text-text-muted border-glass-border')

const aspectClass = computed(() => {
  switch (props.ratio) {
    case '16:9': return 'aspect-video'
    case '21:9': return 'aspect-[21/9]'
    case '4:5': return 'aspect-[4/5]'
    case '2:3': return 'aspect-[2/3]'
    case '3:4': return 'aspect-[3/4]'
    case '1:1':
    case 'native':
    default: return 'aspect-square'
  }
})
</script>

<style scoped>
.lock-btn {
  font-size: 11px;
  line-height: 1;
  padding: 0 2px;
  background: transparent;
  border: 0;
  cursor: pointer;
  opacity: 0.5;
  transition: opacity 0.15s;
}
.lock-btn:hover { opacity: 1; }
.lock-btn-on { opacity: 1; }
</style>
