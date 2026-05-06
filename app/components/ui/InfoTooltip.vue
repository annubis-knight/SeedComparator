<template>
  <span class="relative inline-flex" @mouseenter="show" @mouseleave="hide" @focusin="show" @focusout="hide">
    <button
      ref="triggerRef"
      type="button"
      class="info-icon"
      :aria-label="ariaLabel ?? 'Informations sur ce paramètre'"
      :aria-describedby="visible ? tooltipId : undefined"
      @keydown.escape="hide"
      @click.prevent
    >
      i
    </button>

    <!--
      EPIC-18 / STORY-124 — Le tooltip est téléporté vers <body> et positionné
      en `fixed` pour échapper aux conteneurs `overflow: auto` (SidePanel,
      popovers, etc.) qui le clippaient en v1.
    -->
    <Teleport to="body">
      <span
        v-if="visible"
        :id="tooltipId"
        role="tooltip"
        class="info-tooltip"
        :style="floatingStyle"
      >{{ text }}</span>
    </Teleport>
  </span>
</template>

<script setup lang="ts">
import { ref, nextTick, onBeforeUnmount, watch } from 'vue'

const props = withDefaults(defineProps<{
  text: string
  placement?: 'top' | 'bottom' | 'right'
  ariaLabel?: string
}>(), { placement: 'right' })

const visible = ref(false)
const triggerRef = ref<HTMLButtonElement | null>(null)
const floatingStyle = ref<Record<string, string>>({})

let uidCounter = 0
const tooltipId = `info-tt-${++uidCounter}-${Math.random().toString(36).slice(2, 7)}`

const TOOLTIP_MAX_WIDTH = 280
const GAP = 8 // espace entre l'icône et le tooltip
const VIEWPORT_PADDING = 8 // marge minimale aux bords de la fenêtre

/**
 * Calcule la position en `fixed` à partir du rect du trigger.
 * Choisit le placement qui rentre dans le viewport — fallback automatique :
 *   right → left (si dépasse à droite)
 *   top   → bottom (si dépasse en haut)
 *   bottom → top  (si dépasse en bas)
 * La largeur effective du tooltip n'est pas connue avant rendu, on utilise
 * `TOOLTIP_MAX_WIDTH` comme borne supérieure pour les décisions de fallback.
 */
function computePosition() {
  const trigger = triggerRef.value
  if (!trigger) return

  const r = trigger.getBoundingClientRect()
  const vw = window.innerWidth
  const vh = window.innerHeight

  let placement = props.placement
  // Fallback right → left si pas de place à droite
  if (placement === 'right' && r.right + GAP + TOOLTIP_MAX_WIDTH > vw - VIEWPORT_PADDING) {
    placement = 'top'
  }
  // Fallback top → bottom si pas de place en haut
  if (placement === 'top' && r.top - GAP < VIEWPORT_PADDING) {
    placement = 'bottom'
  }
  // Fallback bottom → top si pas de place en bas
  if (placement === 'bottom' && r.bottom + GAP > vh - VIEWPORT_PADDING) {
    placement = 'top'
  }

  let style: Record<string, string> = {
    position: 'fixed',
    maxWidth: `${TOOLTIP_MAX_WIDTH}px`,
    width: 'max-content',
    zIndex: '1000',
  }

  if (placement === 'right') {
    const top = Math.max(VIEWPORT_PADDING, Math.min(vh - VIEWPORT_PADDING, r.top + r.height / 2))
    style = {
      ...style,
      left: `${r.right + GAP}px`,
      top: `${top}px`,
      transform: 'translateY(-50%)',
    }
  } else if (placement === 'top') {
    // Centré horizontalement sur l'icône, mais clampé pour ne pas déborder.
    const halfMax = TOOLTIP_MAX_WIDTH / 2
    const centerX = r.left + r.width / 2
    const clampedX = Math.max(VIEWPORT_PADDING + halfMax, Math.min(vw - VIEWPORT_PADDING - halfMax, centerX))
    style = {
      ...style,
      left: `${clampedX}px`,
      bottom: `${vh - r.top + GAP}px`,
      transform: 'translateX(-50%)',
    }
  } else { // bottom
    const halfMax = TOOLTIP_MAX_WIDTH / 2
    const centerX = r.left + r.width / 2
    const clampedX = Math.max(VIEWPORT_PADDING + halfMax, Math.min(vw - VIEWPORT_PADDING - halfMax, centerX))
    style = {
      ...style,
      left: `${clampedX}px`,
      top: `${r.bottom + GAP}px`,
      transform: 'translateX(-50%)',
    }
  }

  floatingStyle.value = style
}

async function show() {
  visible.value = true
  await nextTick()
  computePosition()
}
function hide() { visible.value = false }

// Recalcul au scroll/resize tant que le tooltip est visible. On bind sur
// `window` en capture pour attraper aussi les scroll des parents (fallback
// le plus simple sans observer les ancêtres).
function onWindowChange() {
  if (visible.value) computePosition()
}
watch(visible, (v) => {
  if (v) {
    window.addEventListener('scroll', onWindowChange, true)
    window.addEventListener('resize', onWindowChange)
  } else {
    window.removeEventListener('scroll', onWindowChange, true)
    window.removeEventListener('resize', onWindowChange)
  }
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', onWindowChange, true)
  window.removeEventListener('resize', onWindowChange)
})
</script>

<style scoped>
.info-icon {
  width: 14px;
  height: 14px;
  border-radius: 9999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: 600;
  line-height: 1;
  color: var(--color-text-dim);
  background: transparent;
  border: 1px solid var(--color-text-dim);
  cursor: help;
  transition: color 0.15s, border-color 0.15s;
}
.info-icon:hover, .info-icon:focus-visible {
  color: var(--color-text-muted);
  border-color: var(--color-text-muted);
  outline: none;
}
</style>

<!--
  Styles globaux (le tooltip est téléporté vers <body>, donc en dehors du
  scope du parent : on déclare les styles ici en non-scoped pour qu'ils
  s'appliquent au noeud téléporté).
-->
<style>
.info-tooltip {
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
  line-height: 1.35;
  color: var(--color-text);
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-glass-border);
  border-radius: 0.375rem;
  box-shadow: var(--shadow-glass);
  pointer-events: none;
  white-space: normal;
}
</style>
