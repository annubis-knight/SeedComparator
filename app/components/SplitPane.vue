<template>
  <div
    ref="containerEl"
    class="split-pane flex flex-col h-full min-h-0 overflow-hidden"
    data-testid="split-pane"
  >
    <!-- Panneau haut -->
    <div
      class="split-pane-top overflow-hidden flex flex-col shrink-0"
      :style="topStyle"
      data-testid="split-pane-top"
    >
      <slot name="top" />
    </div>

    <!-- Barre de séparation draggable -->
    <div
      class="split-pane-divider shrink-0 flex items-center justify-center cursor-row-resize select-none transition-colors"
      :class="dragging ? 'bg-accent/20' : 'hover:bg-glass-border/60'"
      style="height: 10px"
      data-testid="split-pane-divider"
      @mousedown.prevent="startDrag"
      @touchstart.prevent="startDragTouch"
    >
      <div class="w-8 h-1 rounded-full bg-glass-border" />
    </div>

    <!-- Panneau bas -->
    <div
      class="split-pane-bottom overflow-hidden flex flex-col min-h-0 flex-1"
      data-testid="split-pane-bottom"
    >
      <slot name="bottom" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSplitPane } from '../composables/useSplitPane'

const props = withDefaults(defineProps<{
  defaultPct?: number
  minTopPx?: number
  minBottomPx?: number
  collapsed?: boolean
}>(), {
  defaultPct: 45,
  minTopPx: 80,
  minBottomPx: 80,
  collapsed: false,
})

const emit = defineEmits<{
  (e: 'update:topPct', v: number): void
}>()

const containerEl = ref<HTMLElement | null>(null)
const containerHeight = ref(0)
const dragging = ref(false)

const splitPane = useSplitPane(containerHeight, {
  defaultPct: props.defaultPct,
  minTopPx: props.minTopPx,
  minBottomPx: props.minBottomPx,
})

const { topStyle, setPct, setCollapsed } = splitPane

// Sync collapse prop
watch(() => props.collapsed, (v) => setCollapsed(v), { immediate: true })

// Observe container height changes (resize)
let resizeObserver: ResizeObserver | null = null
onMounted(() => {
  if (!containerEl.value) return
  containerHeight.value = containerEl.value.clientHeight
  resizeObserver = new ResizeObserver(([entry]) => {
    containerHeight.value = entry.contentRect.height
  })
  resizeObserver.observe(containerEl.value)
})
onUnmounted(() => resizeObserver?.disconnect())

// ── Drag logic ─────────────────────────────────────────────────────────────

function startDrag(e: MouseEvent) {
  dragging.value = true
  const startY = e.clientY
  const startPct = splitPane.topPct.value

  function onMove(ev: MouseEvent) {
    const delta = ev.clientY - startY
    const h = containerHeight.value
    if (h <= 0) return
    const newPct = startPct + (delta / h) * 100
    setPct(newPct)
    emit('update:topPct', splitPane.topPct.value)
  }

  function onUp() {
    dragging.value = false
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
  }

  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}

function startDragTouch(e: TouchEvent) {
  const touch = e.touches[0]
  if (!touch) return
  dragging.value = true
  const startY = touch.clientY
  const startPct = splitPane.topPct.value

  function onMove(ev: TouchEvent) {
    const t = ev.touches[0]
    if (!t) return
    const delta = t.clientY - startY
    const h = containerHeight.value
    if (h <= 0) return
    const newPct = startPct + (delta / h) * 100
    setPct(newPct)
    emit('update:topPct', splitPane.topPct.value)
  }

  function onEnd() {
    dragging.value = false
    window.removeEventListener('touchmove', onMove)
    window.removeEventListener('touchend', onEnd)
  }

  window.addEventListener('touchmove', onMove, { passive: false })
  window.addEventListener('touchend', onEnd)
}

// Expose splitPane pour que le parent puisse piloter setAutoCollapse
defineExpose({ splitPane })
</script>
