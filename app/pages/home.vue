<template>
  <div class="max-w-[720px] mx-auto space-y-8 py-4">
    <header class="space-y-2">
      <h1 class="text-2xl font-semibold tracking-tight">Brief Assistant</h1>
      <p class="text-sm text-text-muted">
        Décris ton brief client et un site existant si tu en as un. On extrait automatiquement le contexte
        (texte + identité visuelle) pour générer 3 variantes de prompt image, prêtes à comparer entre modèles.
      </p>
    </header>

    <!-- Indicateur mode mock -->
    <div v-if="mockMode" class="glass px-4 py-2 text-xs text-accent border-l-4 border-accent" data-testid="mock-banner">
      ⚡ Mode mock actif — les prompts générés sont des placeholders statiques (pas d'appel LLM réel).
      Pour activer Claude Haiku 4.5, retire <code>PROVIDERS_MOCK_MODE</code> de ton <code>.env</code> et saisis ta clé OpenRouter dans Réglages.
    </div>

    <!-- Phase saisie : visible uniquement en idle ou après une erreur -->
    <BriefForm
      v-if="step.kind === 'idle' || step.kind === 'error'"
      :initial="initialBrief"
      :running="false"
      @submit="onSubmit"
    />

    <!-- Phase running : progression SSE -->
    <CrawlProgress v-if="step.kind === 'running'" :state="step" @cancel="cancel" />

    <!-- Phase error -->
    <div v-if="step.kind === 'error'" class="glass p-4 border-l-4 border-danger" data-testid="brief-error">
      <div class="text-sm font-semibold text-danger mb-1">Échec de l'analyse · {{ step.code }}</div>
      <div class="text-xs text-text-muted">{{ step.msg }}</div>
      <p class="text-xs text-text-dim mt-2">
        Vérifie tes URLs (toutes doivent être valides et fonctionnelles), ou ta clé OpenRouter dans Réglages.
      </p>
    </div>

    <!-- Phase success : récap brief + preview contexte + prompts + bouton continuer -->
    <div v-if="step.kind === 'success'" class="space-y-6" data-testid="brief-success">
      <!-- Récap du brief soumis (lecture seule) -->
      <section class="glass p-5 space-y-2">
        <h3 class="text-sm font-semibold text-text uppercase tracking-wider">Brief soumis</h3>
        <dl class="space-y-1 text-sm">
          <div v-if="step.result.artDirection"><dt class="inline text-text-dim text-xs uppercase tracking-wider mr-2">Direction artistique</dt><dd class="inline text-text">{{ step.result.artDirection }}</dd></div>
          <div v-if="step.result.mood"><dt class="inline text-text-dim text-xs uppercase tracking-wider mr-2">Mood</dt><dd class="inline text-text">{{ step.result.mood }}</dd></div>
          <div v-if="step.result.uiStyle"><dt class="inline text-text-dim text-xs uppercase tracking-wider mr-2">UI / UX</dt><dd class="inline text-text">{{ step.result.uiStyle }}</dd></div>
          <div v-if="step.result.typography"><dt class="inline text-text-dim text-xs uppercase tracking-wider mr-2">Typographie</dt><dd class="inline text-text">{{ step.result.typography }}</dd></div>
          <div v-if="step.result.palette"><dt class="inline text-text-dim text-xs uppercase tracking-wider mr-2">Palette</dt><dd class="inline text-text">{{ step.result.palette }}</dd></div>
          <div v-if="step.result.urls.length > 0"><dt class="inline text-text-dim text-xs uppercase tracking-wider mr-2">URLs</dt><dd class="inline text-text">{{ step.result.urls.join(' · ') }}</dd></div>
          <div v-if="!hasAnyBriefField" class="text-text-dim italic">Aucune précision — 3 directions créatives complètement libres.</div>
        </dl>
      </section>

      <ContextPanel v-if="step.result.contexts.length > 0" :result="step.result" />

      <div class="space-y-3">
        <h3 class="text-sm font-semibold text-text uppercase tracking-wider">Prompts générés (préfixe + complément)</h3>
        <p class="text-xs text-text-dim">Chaque prompt = pré-prompt par défaut + complément généré par l'IA. Tu pourras les éditer librement dans l'écran de génération.</p>
        <PromptPreview label="A · langage naturel" :text="finalPromptA" />
        <PromptPreview label="B · mots-clés" :text="finalPromptB" />
        <PromptPreview label="C · structuré" :text="finalPromptC" />
      </div>

      <div class="flex gap-3 items-center flex-wrap pt-2 border-t border-glass-border">
        <AppButton variant="primary" data-testid="use-prompts-btn" @click="usePrompts">
          Utiliser ces prompts → générer
        </AppButton>
        <AppButton variant="ghost" @click="reset">Modifier le brief</AppButton>
        <AppButton variant="ghost" @click="clearPersisted">Repartir de zéro</AppButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { BriefRequest } from '#shared/contracts'
import { joinPromptVariant } from '#shared/contracts'
import { createLogger } from '~/utils/logger'

const log = createLogger('pages/home')

const { lastBrief, step, submit, cancel, reset, clearPersisted } = useBriefAssistant()
const router = useRouter()
const runtimeConfig = useRuntimeConfig()
const mockMode = computed(() => !!runtimeConfig.public.mockMode)

const initialBrief = computed<Partial<BriefRequest> | undefined>(() => {
  if (!lastBrief.value) return undefined
  return {
    artDirection: lastBrief.value.artDirection,
    mood: lastBrief.value.mood,
    uiStyle: lastBrief.value.uiStyle,
    typography: lastBrief.value.typography,
    palette: lastBrief.value.palette,
    urls: [...lastBrief.value.urls],
  }
})

const hasAnyBriefField = computed(() => {
  if (step.value.kind !== 'success') return false
  const r = step.value.result
  return Boolean(r.artDirection || r.mood || r.uiStyle || r.typography || r.palette || r.urls.length > 0)
})

// Prompts finaux affichés = préfixe par défaut + complément généré par le LLM.
const finalPromptA = computed(() => {
  if (step.value.kind !== 'success') return ''
  return joinPromptVariant('A', step.value.result.prompts.promptA)
})
const finalPromptB = computed(() => {
  if (step.value.kind !== 'success') return ''
  return joinPromptVariant('B', step.value.result.prompts.promptB)
})
const finalPromptC = computed(() => {
  if (step.value.kind !== 'success') return ''
  return joinPromptVariant('C', step.value.result.prompts.promptC)
})

async function onSubmit(req: BriefRequest) {
  log.info('submit form', { urls: req.urls.length })
  await submit(req)
}

function usePrompts() {
  if (step.value.kind !== 'success') return
  log.info('redirect /generate with generated prompts (prefix + completion)')
  // Les 3 prompts finaux = concaténation préfixe + complément
  const state = useState<string[]>('prompts-generated', () => ['', '', ''])
  state.value = [finalPromptA.value, finalPromptB.value, finalPromptC.value]
  router.push('/')
}
</script>
