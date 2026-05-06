import { describe, it, expect } from 'vitest'
import {
  GenerateRequestSchema,
  KeyUpsertSchema,
  SaveSessionRequestSchema,
  ProviderModeSchema,
  PhaseSchema,
  PROMPT_DEFAULTS_BY_PHASE,
  PHASE_LABELS,
} from '../../shared/contracts'

describe('contracts (Zod)', () => {
  // @requirement: FR-006, FR-007
  it('GenerateRequest accepte 1 à 3 prompts et au moins 1 modèle', () => {
    expect(GenerateRequestSchema.safeParse({ prompts: ['a'], modelIds: ['m1'] }).success).toBe(true)
    expect(GenerateRequestSchema.safeParse({ prompts: ['a','b','c'], modelIds: ['m1'] }).success).toBe(true)
    expect(GenerateRequestSchema.safeParse({ prompts: [], modelIds: ['m1'] }).success).toBe(false)
    expect(GenerateRequestSchema.safeParse({ prompts: ['a','b','c','d'], modelIds: ['m1'] }).success).toBe(false)
    expect(GenerateRequestSchema.safeParse({ prompts: ['a'], modelIds: [] }).success).toBe(false)
  })

  // @requirement: FR-008
  it('GenerateRequest valide le ratio', () => {
    expect(GenerateRequestSchema.safeParse({ prompts: ['a'], modelIds: ['m'], ratio: '16:9' }).success).toBe(true)
    expect(GenerateRequestSchema.safeParse({ prompts: ['a'], modelIds: ['m'], ratio: 'invalid' }).success).toBe(false)
  })

  // @requirement: FR-001
  it('KeyUpsert exige providerId et apiKey non vides', () => {
    expect(KeyUpsertSchema.safeParse({ providerId: '', apiKey: 'k' }).success).toBe(false)
    expect(KeyUpsertSchema.safeParse({ providerId: 'p', apiKey: '' }).success).toBe(false)
    expect(KeyUpsertSchema.safeParse({ providerId: 'p', apiKey: 'k' }).success).toBe(true)
  })

  // @requirement: FR-028
  it('SaveSessionRequest valide sessionId et folder', () => {
    expect(SaveSessionRequestSchema.safeParse({ sessionId: 'a', folder: '/x' }).success).toBe(true)
    expect(SaveSessionRequestSchema.safeParse({ sessionId: '', folder: '/x' }).success).toBe(false)
  })

  // @requirement: FR-038
  it('GenerateRequest accepte quality et nbImagesPerPrompt avec valeurs valides', () => {
    const r = GenerateRequestSchema.safeParse({
      prompts: ['a'], modelIds: ['m'], quality: 'high', nbImagesPerPrompt: 3,
    })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.quality).toBe('high')
      expect(r.data.nbImagesPerPrompt).toBe(3)
    }
  })

  // @requirement: FR-038
  it('GenerateRequest rejette quality invalide ou nbImagesPerPrompt > 4', () => {
    expect(GenerateRequestSchema.safeParse({ prompts: ['a'], modelIds: ['m'], quality: 'ultra' }).success).toBe(false)
    expect(GenerateRequestSchema.safeParse({ prompts: ['a'], modelIds: ['m'], nbImagesPerPrompt: 5 }).success).toBe(false)
    expect(GenerateRequestSchema.safeParse({ prompts: ['a'], modelIds: ['m'], nbImagesPerPrompt: 0 }).success).toBe(false)
  })

  // @requirement: FR-038
  it('GenerateRequest applique les défauts quality=standard et nbImagesPerPrompt=1', () => {
    const r = GenerateRequestSchema.safeParse({ prompts: ['a'], modelIds: ['m'] })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.quality).toBe('standard')
      expect(r.data.nbImagesPerPrompt).toBe(1)
    }
  })

  // @requirement: FR-061, FR-063
  it('ProviderModeSchema accepte mock, mock-real, live et rejette le reste', () => {
    expect(ProviderModeSchema.safeParse('mock').success).toBe(true)
    expect(ProviderModeSchema.safeParse('mock-real').success).toBe(true)
    expect(ProviderModeSchema.safeParse('live').success).toBe(true)
    expect(ProviderModeSchema.safeParse('').success).toBe(false)
    expect(ProviderModeSchema.safeParse('real').success).toBe(false)
    expect(ProviderModeSchema.safeParse('LIVE').success).toBe(false)
  })

  // @requirement: FR-069
  it('PhaseSchema accepte wireframe, mood, uiux et rejette le reste', () => {
    expect(PhaseSchema.safeParse('wireframe').success).toBe(true)
    expect(PhaseSchema.safeParse('mood').success).toBe(true)
    expect(PhaseSchema.safeParse('uiux').success).toBe(true)
    expect(PhaseSchema.safeParse('').success).toBe(false)
    expect(PhaseSchema.safeParse('ui').success).toBe(false)
    expect(PhaseSchema.safeParse('Wireframe').success).toBe(false)
  })

  // @requirement: FR-069
  it('PHASE_LABELS expose les labels français pour les 3 phases', () => {
    expect(PHASE_LABELS.wireframe).toBe('Wireframe')
    expect(PHASE_LABELS.mood).toBe('Mood')
    expect(PHASE_LABELS.uiux).toBe('UI/UX Design')
  })

  // @requirement: FR-070
  it('PROMPT_DEFAULTS_BY_PHASE expose 9 prompts non vides (3 phases × 3 variants)', () => {
    const phases = ['wireframe', 'mood', 'uiux'] as const
    for (const phase of phases) {
      expect(PROMPT_DEFAULTS_BY_PHASE[phase].a.length).toBeGreaterThan(10)
      expect(PROMPT_DEFAULTS_BY_PHASE[phase].b.length).toBeGreaterThan(10)
      expect(PROMPT_DEFAULTS_BY_PHASE[phase].c.length).toBeGreaterThan(10)
    }
  })

  // @requirement: FR-069
  it('GenerateRequestSchema applique phase=wireframe et promptVariant=A par défaut', () => {
    const r = GenerateRequestSchema.safeParse({ prompts: ['a'], modelIds: ['m'] })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.phase).toBe('wireframe')
      expect(r.data.promptVariant).toBe('A')
    }
  })

  // @requirement: FR-069
  it('GenerateRequestSchema accepte phase=mood et promptVariant=C', () => {
    const r = GenerateRequestSchema.safeParse({ prompts: ['a'], modelIds: ['m'], phase: 'mood', promptVariant: 'C' })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.phase).toBe('mood')
      expect(r.data.promptVariant).toBe('C')
    }
  })

  // @requirement: FR-069
  it('GenerateRequestSchema rejette phase invalide et promptVariant invalide', () => {
    expect(GenerateRequestSchema.safeParse({ prompts: ['a'], modelIds: ['m'], phase: 'final' }).success).toBe(false)
    expect(GenerateRequestSchema.safeParse({ prompts: ['a'], modelIds: ['m'], promptVariant: 'D' }).success).toBe(false)
  })
})

// ───────────────────────────────────────────────────────────────────────────────
// STORY-112 — Invariants des prompts par défaut (autonomie + phase-specific)
// ───────────────────────────────────────────────────────────────────────────────

describe('PROMPT_DEFAULTS_BY_PHASE — STORY-112 autonomy & phase invariants', () => {
  const allTemplates = (['wireframe', 'mood', 'uiux'] as const).flatMap((phase) =>
    (['a', 'b', 'c'] as const).map((variant) => ({
      phase,
      variant,
      text: PROMPT_DEFAULTS_BY_PHASE[phase][variant],
    }))
  )

  // @requirement: FR-054
  it('chaque template est non-vide et est une string', () => {
    expect(allTemplates.length).toBe(9)
    for (const { phase, variant, text } of allTemplates) {
      expect(typeof text, `${phase}.${variant} must be a string`).toBe('string')
      expect(text.trim().length, `${phase}.${variant} is empty`).toBeGreaterThan(20)
    }
  })

  // @requirement: FR-054 — autonomie : pas de placeholder type [Industrie] / [Valeur] / <X>
  it('aucun template ne contient de placeholder [...] ou <...> ou {...}', () => {
    const placeholderRe = /\[[A-Z][^\]]*\]|<[a-z][^>]+>|\{\{[^}]+\}\}/
    for (const { phase, variant, text } of allTemplates) {
      expect(placeholderRe.test(text), `${phase}.${variant} contains a placeholder: ${text.match(placeholderRe)?.[0]}`).toBe(false)
    }
  })

  // @requirement: FR-054 — neutralité multi-modèles : pas de syntaxe MJ/SD
  it('aucun template ne contient de syntaxe modèle-spécifique (--ar/--chaos/--stylize/::)', () => {
    const modelSyntaxRe = /(--ar |--chaos|--stylize|--v |--iw |--stop|::|\(\w+:\d+\.\d+\))/
    for (const { phase, variant, text } of allTemplates) {
      expect(modelSyntaxRe.test(text), `${phase}.${variant} contains model-specific syntax`).toBe(false)
    }
  })

  // @requirement: FR-054 — pas de référence à une image source (l'app ne supporte pas l'image-to-image)
  it('aucun template ne référence une image source', () => {
    const imageRefRe = /\b(based on|previous (wireframe|composition|image|moodboard)|reference image|image link|using image)\b/i
    for (const { phase, variant, text } of allTemplates) {
      expect(imageRefRe.test(text), `${phase}.${variant} references a source image`).toBe(false)
    }
  })

  // @requirement: FR-069 — wireframe : structure pure, pas de couleur ni texture
  it('wireframe templates ne contiennent pas de termes de couleur (sauf black/white/gray)', () => {
    const forbiddenColorRe = /\b(navy|brass|gold|red|blue|green|yellow|orange|purple|pink|violet|teal|cyan|magenta|terracotta|sage|ochre|copper|brown|warm|cool palette|gradient|earth tones)\b/i
    for (const variant of ['a', 'b', 'c'] as const) {
      const text = PROMPT_DEFAULTS_BY_PHASE.wireframe[variant]
      expect(forbiddenColorRe.test(text), `wireframe.${variant} contains forbidden color term: ${text.match(forbiddenColorRe)?.[0]}`).toBe(false)
    }
  })

  // @requirement: FR-069 — uiux : composition top-heavy + transition basse vers fond uni
  it('uiux templates mentionnent top-heavy ET seamless fade to (solid) background at the bottom', () => {
    for (const variant of ['a', 'b', 'c'] as const) {
      const text = PROMPT_DEFAULTS_BY_PHASE.uiux[variant].toLowerCase()
      expect(text.includes('top-heavy'), `uiux.${variant} missing "top-heavy"`).toBe(true)
      expect(/seamless fade to (a |the )?(solid )?background/.test(text), `uiux.${variant} missing "seamless fade to (a)(solid) background"`).toBe(true)
      expect(text.includes('bottom'), `uiux.${variant} missing "bottom"`).toBe(true)
    }
  })

  // @requirement: FR-069 — mood : pas de composants UI finis
  it('mood templates ne mentionnent pas de composants UI finis (button, navbar, CTA précis)', () => {
    const finishedUIRe = /\b(cta button|navbar|primary button|input field|dropdown menu|modal dialog)\b/i
    for (const variant of ['a', 'b', 'c'] as const) {
      const text = PROMPT_DEFAULTS_BY_PHASE.mood[variant]
      expect(finishedUIRe.test(text), `mood.${variant} contains finished UI component`).toBe(false)
    }
  })
})
