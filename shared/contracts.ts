import { z } from 'zod'

export const RatioSchema = z.enum(['native', '1:1', '4:5', '2:3', '3:4', '16:9', '21:9'])
export type Ratio = z.infer<typeof RatioSchema>

// EPIC-15 — Phase du workflow de génération
export const PhaseSchema = z.enum(['wireframe', 'mood', 'uiux'])
export type Phase = z.infer<typeof PhaseSchema>

export const PHASE_LABELS: Record<Phase, string> = {
  wireframe: 'Wireframe',
  mood: 'Mood',
  uiux: 'UI/UX Design',
} as const

// EPIC-14 — Modes provider : mock (placeholder), mock-real (rejoue fixture capturée), live (appel réel API).
export const ProviderModeSchema = z.enum(['mock', 'mock-real', 'live'])
export type ProviderMode = z.infer<typeof ProviderModeSchema>

export const GenerationStatusSchema = z.enum(['idle', 'pending', 'success', 'failed', 'aborted'])
export type GenerationStatus = z.infer<typeof GenerationStatusSchema>

export const QualitySchema = z.enum(['low', 'standard', 'high'])
export type Quality = z.infer<typeof QualitySchema>

export const GenerateRequestSchema = z.object({
  sessionId: z.string().optional(),
  prompts: z.array(z.string().min(1)).min(1).max(3),
  modelIds: z.array(z.string().min(1)).min(1),
  ratio: RatioSchema.default('native'),
  quality: QualitySchema.default('standard'),
  nbImagesPerPrompt: z.number().int().min(1).max(4).default(1),
  seed: z.number().int().nonnegative().nullable().optional(),
  /** Brief Assistant (STORY-092) — métadonnées optionnelles attachées à la session. */
  brief: z.unknown().optional(),
  /** STORY-105 — phase active au moment du lancement */
  phase: PhaseSchema.default('wireframe'),
  /** STORY-105 — variant actif (A|B|C) */
  promptVariant: z.enum(['A', 'B', 'C']).default('A'),
  /**
   * EPIC-18 / STORY-121 — Overrides utilisateur scope=global, par modèle.
   * Map `{ [modelId]: { [paramKey]: value } }`. La validation Zod stricte
   * par modèle vit côté server (`paramResolver.validateModelParams`).
   */
  globalParams: z.record(z.string(), z.record(z.string(), z.unknown())).optional(),
  /**
   * EPIC-18 / STORY-128 — Overrides utilisateur scope=per-generation.
   * Map `{ [`${modelId}::${promptIdx}`]: { [paramKey]: value } }`.
   */
  perGenerationParams: z.record(z.string(), z.record(z.string(), z.unknown())).optional(),
})
export type GenerateRequest = z.infer<typeof GenerateRequestSchema>

export const SaveImageRequestSchema = z.object({
  generationId: z.string().min(1),
  folder: z.string().min(1),
})
export type SaveImageRequest = z.infer<typeof SaveImageRequestSchema>

export const SaveSessionRequestSchema = z.object({
  sessionId: z.string().min(1),
  folder: z.string().min(1),
})
export type SaveSessionRequest = z.infer<typeof SaveSessionRequestSchema>

export const KeyUpsertSchema = z.object({
  providerId: z.string().min(1),
  apiKey: z.string().min(1),
})
export type KeyUpsert = z.infer<typeof KeyUpsertSchema>

export const SettingUpsertSchema = z.object({
  key: z.string().min(1),
  value: z.string(),
})
export type SettingUpsert = z.infer<typeof SettingUpsertSchema>

export const ModelToggleSchema = z.object({
  modelId: z.string().min(1),
  enabled: z.boolean(),
})

// EPIC-14 / STORY-101 — payload pour tester un modèle isolément + capturer la fixture
export const ModelTestRequestSchema = z.object({
  modelId: z.string().min(1),
  prompt: z.string().min(1),
  ratio: RatioSchema.default('1:1'),
  /** Si true, écrase la fixture existante. Si false et fixture présente, l'endpoint répond 409. */
  overwrite: z.boolean().default(false),
})
export type ModelTestRequest = z.infer<typeof ModelTestRequestSchema>

// ───────────────────────────────────────────────────────────────────────────────
// Pré-prompts par défaut (STORY-092 v2 — orientation outil d'inspiration)
// ───────────────────────────────────────────────────────────────────────────────
// Chaque variante porte le cadre commun (haut de landing page, hero, art direction
// éditoriale, typographie display) et invite à la créativité. Le brief utilisateur
// vient COMPLÉTER ces pré-prompts au moment de la concaténation.
//
// Format de concaténation côté frontend :
//   - A : `${PROMPT_PREFIX_A}. ${userAddition}`
//   - B : `${PROMPT_PREFIX_B}, ${userAddition}`
//   - C : `${PROMPT_PREFIX_C}\n${userAddition}`
//
// Ces préfixes sont aussi affichés par défaut dans les 3 textareas de /generate.
// L'utilisateur peut les éditer/supprimer librement (un bouton ↺ permet de revenir
// à l'état par défaut).

export const PROMPT_PREFIX_A = `A creative, art-directed hero section for the top of a modern landing page. Bold display typography with strong hierarchy. The composition feels editorial and intentional, leaving room for visual interpretation. Free creative direction.`

export const PROMPT_PREFIX_B = `landing page hero, top of webpage, art-directed, editorial design, bold display typography, strong hierarchy, intentional composition, creative direction`

export const PROMPT_PREFIX_C = `Format: top of a modern landing page including a hero section
Direction: creative, art-directed, editorial
Typography: bold display type, strong hierarchy, large scale
Composition: intentional, free creative interpretation
Style additions:`

export const PROMPT_PREFIXES = {
  A: PROMPT_PREFIX_A,
  B: PROMPT_PREFIX_B,
  C: PROMPT_PREFIX_C,
} as const

export type PromptVariant = keyof typeof PROMPT_PREFIXES

// STORY-105 — Prompts par défaut par phase (3 phases × 3 variants)
//
// Principes (issus des apprentissages "prompt morphing" v1.2.0) :
// - Chaque prompt est AUTONOME (text-only, pas d'image de référence, pas de
//   placeholder type [Industrie] / [Valeur]).
// - 3 langages distincts : A = narratif fluide, B = keywords, C = sections labellisées.
// - Wireframe : focus structure pure, anti-pattern doux, pas de couleur ni texture.
// - Mood : ambiance + matière + palette + traduction valeur→visuel intégrée.
// - UI/UX : haute fidélité + composition top-heavy + transition basse vers fond
//   uni pour ménager la suite de page (intuition initiale validée).
export const PROMPT_DEFAULTS_BY_PHASE: Record<Phase, { a: string; b: string; c: string }> = {
  wireframe: {
    a: `Low-fidelity UX wireframe of a landing page hero section, top-aligned content, asymmetric bento grid with overlapping placeholder blocks. Thick black strokes on white background, no shading, no color, no images. Radical negative space in the lower half, structural innovation over template conformity, editorial avant-garde influence.`,
    b: `low-fidelity wireframe, hero section, top of landing page, top-heavy composition, asymmetric bento grid, broken grid, overlapping placeholder blocks, thick black lines, white background, no shading, no color, no imagery, large bottom negative space, structural innovation, editorial avant-garde`,
    c: `Format: low-fidelity UX wireframe of a landing page hero section
Fidelity: black and white only, thick strokes, no shading, no color, no images
Layout: top-heavy composition, asymmetric bento grid, overlapping placeholder blocks
Disruption: broken grid, off-grid placement, intentionally misaligned blocks
Bottom: large negative space reserved for the next section
Notes:`,
  },
  mood: {
    a: `Conceptual moodboard for a landing page hero section, expressing quiet luxury and high-performance precision through brushed steel surfaces, frosted glass panels, deep navy and brass palette, soft window light with ambient occlusion. Editorial atmosphere, cinematic depth, top-heavy composition fading toward a clean lower area. Focus on atmosphere, materials and color rather than final UI components.`,
    b: `conceptual moodboard, landing page hero section, quiet luxury, high-performance precision, brushed steel, frosted glass, navy and brass palette, soft window light, ambient occlusion, editorial atmosphere, cinematic depth, top-heavy composition, soft fade to lower area, no final UI`,
    c: `Format: conceptual moodboard for a landing page hero section
Mood: quiet luxury, high-performance precision, editorial atmosphere
Materials: brushed steel, frosted glass, deep matte surfaces
Palette: navy and brass, deep neutrals with a single restrained accent
Lighting: soft window light, ambient occlusion, cinematic depth
Values translated: trust → grounded geometry, innovation → refracted glass accent
Composition: top-heavy, soft fade toward lower area`,
  },
  uiux: {
    a: `High-fidelity landing page hero section, pixel-perfect UI components with refined typography system, hairline 1px borders, soft layered shadows, ambient occlusion, restrained navy and brass palette on near-white background. Cinematic studio lighting, octane-quality render, ultra-detailed micro-finishing. Top-heavy composition with a seamless fade to a solid background at the bottom for visual continuity with the next section.`,
    b: `high-fidelity landing page hero, pixel-perfect UI, refined typography system, hairline 1px borders, soft layered shadows, ambient occlusion, navy and brass palette, near-white background, cinematic studio lighting, octane render quality, ultra-detailed, top-heavy composition, seamless fade to solid background at bottom`,
    c: `Format: high-fidelity landing page hero section, polished web UI
Quality: pixel-perfect, octane render quality, ultra-detailed micro-finishing
UI: refined component system, hairline 1px borders, soft layered shadows
Typography: bold display sans paired with editorial serif, large scale, tight tracking
Palette: navy and brass on near-white, single restrained accent
Lighting: cinematic studio lighting, ambient occlusion, soft directional fill
Composition: top-heavy with seamless fade to solid background at the bottom for the next section`,
  },
}

export type PhasePromptsMap = Record<Phase, { a: string; b: string; c: string }>

export interface SessionPhasePrompts {
  wireframe: { a: string; b: string; c: string }
  mood: { a: string; b: string; c: string }
  uiux: { a: string; b: string; c: string }
}

/** Sépare le préfixe du contenu utilisateur dans le format attendu par chaque variante. */
export function joinPromptVariant(variant: PromptVariant, addition: string): string {
  const prefix = PROMPT_PREFIXES[variant]
  const trimmed = addition.trim()
  if (!trimmed) return prefix
  switch (variant) {
    case 'A': return `${prefix} ${trimmed}`
    case 'B': return `${prefix}, ${trimmed}`
    case 'C': return `${prefix}\n${trimmed}`
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// Brief Assistant (STORY-092 v2 — outil d'inspiration, tous champs optionnels)
// ───────────────────────────────────────────────────────────────────────────────
export const BriefRequestSchema = z.object({
  artDirection: z.string().max(500).optional().default(''),
  mood: z.string().max(300).optional().default(''),
  uiStyle: z.string().max(300).optional().default(''),
  typography: z.string().max(300).optional().default(''),
  palette: z.string().max(300).optional().default(''),
  urls: z.array(z.string().url()).max(10).default([]),
})
export type BriefRequest = z.infer<typeof BriefRequestSchema>

export interface BriefPaletteEntry {
  hex: string
  population: number
  role: string
}

export interface BriefUrlContext {
  url: string
  title: string
  metaDescription: string
  textExcerpt: string
  miniDataUrl: string         // jpeg base64 pour affichage UI
  palette: BriefPaletteEntry[]
  visualDescription: string
}

export interface BriefResult {
  artDirection: string
  mood: string
  uiStyle: string
  typography: string
  palette: string
  urls: string[]
  contexts: BriefUrlContext[]   // 1 entrée par URL fournie, dans l'ordre
  contextMarkdown: string        // markdown agrégé envoyé au LLM
  /**
   * Prompts générés par le LLM = COMPLÉMENT à ajouter aux préfixes par défaut.
   * Format final affiché dans les textareas = joinPromptVariant(variant, prompts.promptX).
   */
  prompts: { promptA: string; promptB: string; promptC: string }
}

// DTO sortie
export interface GenerationDTO {
  id: string
  sessionId: string
  promptIdx: number
  prompt: string
  modelId: string
  modelDisplayName: string
  seed: string | null // BigInt sérialisé
  ratio: string | null
  status: GenerationStatus
  errorCode: string | null
  errorMsg: string | null
  imagePath: string | null
  imageDataUrl: string | null // base64 inline pour cache temp
  costUsd: number
  liked: boolean // STORY-097
  phase: Phase // STORY-105
  promptVariant: 'A' | 'B' | 'C' // STORY-105
  /** EPIC-18 / STORY-126 — params figés au moment de la génération. */
  params: Record<string, unknown> | null
  createdAt: string
}

export interface SessionDTO {
  id: string
  name: string | null  // STORY-096
  createdAt: string
  prompts: string[]
  promptsByPhase: SessionPhasePrompts | null // STORY-105
  activePhase: Phase // STORY-105
  ratio: string | null
  saved: boolean
  saveFolder: string | null
  generations: GenerationDTO[]
  totalCostUsd: number
}

// EPIC-18 / STORY-120 — Métadonnées de paramètres exposées au frontend.
export type ParamKindDTO =
  | 'slider-continuous'
  | 'slider-stepped'
  | 'segmented'
  | 'select'
  | 'radio'
  | 'toggle'
  | 'number-with-random'
  | 'textarea'
  | 'number'

export type ParamScopeDTO = 'global' | 'per-generation'

export interface ParamFieldMetaDTO {
  key: string
  label: string
  tooltip: string
  kind: ParamKindDTO
  scope: ParamScopeDTO
  default: unknown
  min?: number
  max?: number
  step?: number
  options?: Array<{ value: string | number; label: string }>
  maxLength?: number
  affectsCost?: boolean
}

export interface ModelDTO {
  id: string
  // Gateway technique (= ancienne notion de "provider", clé API)
  providerId: string
  providerDisplayName: string
  // Brand commercial visible UI (= éditeur du modèle, ex: Google, OpenAI)
  brandId: string
  brandDisplayName: string
  brandSortOrder: number
  displayName: string
  supportsSeed: boolean
  supportsEditing: boolean
  pricePerImage: number
  enabled: boolean
  hasApiKey: boolean
  /**
   * STORY-103 (FR-064) — true si le modèle peut être généré dans le mode courant.
   *  - mode `mock`      : toujours true.
   *  - mode `mock-real` : true ssi une fixture nominale a été capturée sur disque.
   *  - mode `live`      : toujours true (le gate réel est `hasApiKey`).
   */
  hasFixture: boolean
  /**
   * EPIC-18 / STORY-120 — Liste des paramètres exposés par le modèle.
   * Inclut les deux scopes (`global` et `per-generation`).
   */
  paramFields: ParamFieldMetaDTO[]
}

export interface CostEstimate {
  generations: number
  totalUsd: number
  breakdown: Array<{ modelId: string; modelDisplayName: string; pricePerImage: number; count: number }>
}

// STORY-108 — Helper conversationnel (assistant créatif LLM)
export interface HelperMessage {
  role: 'user' | 'assistant'
  content: string
}

export const HelperChatRequestSchema = z.object({
  sessionId: z.string().min(1),
  phase: PhaseSchema,
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().min(1),
  })).min(1),
})
export type HelperChatRequest = z.infer<typeof HelperChatRequestSchema>
