// Types repris localement (ce fichier est consommé aussi côté client).
export type ParamKind =
  | 'slider-continuous'
  | 'slider-stepped'
  | 'segmented'
  | 'select'
  | 'radio'
  | 'toggle'
  | 'number-with-random'
  | 'textarea'
  | 'number'

/**
 * EPIC-18 / STORY-124 (révision UX 2026-05-06 v3) — Catalogue de paramètres
 * CANONIQUES côté UI. Chaque entrée définit une échelle homogène présentée à
 * l'utilisateur (ex : qualité 1–5, format `lossless|balanced|compact`) et les
 * fonctions de mapping qui traduisent une valeur canonique vers les valeurs
 * natives à écrire dans `useModelParams` (par modèle, par trait backend).
 *
 * Bénéfices :
 *   - L'UI n'affiche **plus** les paramètres en doublon entre modèles.
 *   - L'utilisateur manipule un vocabulaire homogène (Brouillon / Standard /
 *     Premium au lieu de hd, high, medium, standard, low...).
 *   - Un même contrôle peut écrire plusieurs traits backend (multiplexage) :
 *     `safetyLevel = strict` → `safety_tolerance: 2` + `enable_safety_checker: true`
 *     + `moderation: 'auto'`.
 *
 * Côté server, RIEN ne change : `paramTraits.ts`, `paramResolver.ts`,
 * `paramApiMapping.ts` et les adapters continuent à parler la langue native
 * de chaque API. Cette factorisation est **purement UI**.
 */

export type CanonicalKey =
  | 'quality'
  | 'outputFormat'
  | 'creativity'
  | 'inferenceEffort'
  | 'safetyLevel'
  | 'negativePrompt'

export interface CanonicalOption {
  value: string | number
  label: string
}

/**
 * Map<traitKey, nativeValue> retournée par un mapping canonique.
 * - Une clé absente = ce trait ne doit PAS être touché par ce modèle (=> la
 *   valeur native existante est conservée, ou son défaut s'applique).
 * - `null` explicite = on retire l'override (retour au défaut natif).
 */
export type NativeOverrides = Record<string, unknown>

export interface CanonicalParam {
  key: CanonicalKey
  label: string
  tooltip: string
  kind: ParamKind
  default: string | number | boolean
  /** Sliders. */
  min?: number
  max?: number
  step?: number
  /** Segmented / select / radio. */
  options?: CanonicalOption[]
  /** Textarea. */
  maxLength?: number
  /**
   * Map<modelId, (canonicalValue) => NativeOverrides>
   * Le modèle reçoit l'override calculé. Modèles absents = paramètre ignoré.
   */
  mapping: Record<string, (v: unknown) => NativeOverrides>
}

/**
 * Liste des modèles concernés par un paramètre canonique = clés de `mapping`.
 * Utile pour calculer "Appliqué à N modèles" côté UI.
 */
export function appliesTo(p: CanonicalParam): string[] {
  return Object.keys(p.mapping)
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. quality — slider 1..5
//    Vocabulaire homogène vs. zoo des `quality` providers.
// ─────────────────────────────────────────────────────────────────────────────

const dalleQuality = (v: unknown): NativeOverrides => {
  // DALL·E 3 accepte standard|hd. 1..3 → standard, 4..5 → hd.
  const n = Number(v)
  return { openaiQuality: n >= 4 ? 'hd' : 'standard' }
}

const gptImageQuality = (v: unknown): NativeOverrides => {
  // GPT Image accepte low|medium|high|auto. On évite `auto` pour rendre le
  // slider prédictible (l'utilisateur a explicitement demandé un niveau).
  const n = Number(v)
  if (n <= 1) return { openaiQuality: 'low' }
  if (n <= 3) return { openaiQuality: 'medium' }
  return { openaiQuality: 'high' }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. outputFormat — segmented [lossless | balanced | compact]
// ─────────────────────────────────────────────────────────────────────────────

const formatToOpenAI = (v: unknown): NativeOverrides => {
  // OpenAI: `response_format` (DALL·E 2/3) ne supporte que png/jpeg/webp.
  // GPT Image idem côté API images. On mappe via le trait canonique outputFormat
  // (qui est rerouté vers `response_format` côté openai par `paramApiMapping`).
  switch (v) {
    case 'lossless': return { outputFormat: 'png' }
    case 'compact':  return { outputFormat: 'jpeg' }
    case 'balanced': return { outputFormat: 'webp' }
    default:         return { outputFormat: 'png' }
  }
}

const formatToFal = (v: unknown): NativeOverrides => {
  // Fal `output_format`: png ou jpeg uniquement (pas de webp officiel).
  // → balanced retombe sur jpeg (compromis taille/qualité).
  switch (v) {
    case 'lossless': return { outputFormat: 'png' }
    case 'compact':  return { outputFormat: 'jpeg' }
    case 'balanced': return { outputFormat: 'jpeg' }
    default:         return { outputFormat: 'png' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. creativity — slider 0..10
//    Sémantique "à quel point je laisse le modèle improviser".
//    ATTENTION : `temperature` haut = créatif, `guidanceScale` haut = strict.
//    Le mapping inverse l'axe pour guidanceScale.
// ─────────────────────────────────────────────────────────────────────────────

function lerp(t: number, fromMin: number, fromMax: number, toMin: number, toMax: number): number {
  const r = (t - fromMin) / (fromMax - fromMin)
  return toMin + r * (toMax - toMin)
}

const creativityToTemperature = (v: unknown): NativeOverrides => {
  // 0..10 → 0..2 (linéaire), arrondi à 0.05
  const n = Math.max(0, Math.min(10, Number(v)))
  const t = lerp(n, 0, 10, 0, 2)
  return { geminiTemperature: Math.round(t * 20) / 20 }
}

const creativityToGuidance = (v: unknown): NativeOverrides => {
  // 0..10 (créatif) → 15..1 (strict), inversé. Arrondi à 0.5.
  const n = Math.max(0, Math.min(10, Number(v)))
  const g = lerp(n, 0, 10, 15, 1)
  return { guidanceScale: Math.round(g * 2) / 2 }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. inferenceEffort — slider 1..5
//    Mappe vers num_inference_steps avec ranges natifs différents par modèle.
// ─────────────────────────────────────────────────────────────────────────────

const effortToSchnellSteps = (v: unknown): NativeOverrides => {
  // Schnell : 1..8. Échelle 1→1, 2→2, 3→4 (défaut), 4→6, 5→8.
  const n = Math.max(1, Math.min(5, Number(v)))
  const steps = [1, 2, 4, 6, 8][n - 1]!
  return { numInferenceSteps: steps }
}

const effortToProSteps = (v: unknown): NativeOverrides => {
  // Pro/SD : 1..50. 1→10, 2→20, 3→28 (défaut), 4→40, 5→50.
  const n = Math.max(1, Math.min(5, Number(v)))
  const steps = [10, 20, 28, 40, 50][n - 1]!
  return { numInferenceSteps: steps }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. safetyLevel — segmented [strict | balanced | permissive]
//    Multiplexe 3 traits backend distincts.
// ─────────────────────────────────────────────────────────────────────────────

const safetyToFalPro = (v: unknown): NativeOverrides => {
  // Fal Pro Ultra : safety_tolerance 1..6 + enable_safety_checker bool
  switch (v) {
    case 'strict':     return { safetyTolerance: 2, enableSafetyChecker: true }
    case 'balanced':   return { safetyTolerance: 3, enableSafetyChecker: true }
    case 'permissive': return { safetyTolerance: 5, enableSafetyChecker: false }
    default:           return { safetyTolerance: 3, enableSafetyChecker: true }
  }
}

const safetyToFalStandard = (v: unknown): NativeOverrides => {
  // Schnell/SD : pas de safety_tolerance, juste enable_safety_checker
  return { enableSafetyChecker: v !== 'permissive' }
}

const safetyToOpenAI = (v: unknown): NativeOverrides => {
  // GPT Image : moderation auto|low
  return { openaiModeration: v === 'permissive' ? 'low' : 'auto' }
}

// ─────────────────────────────────────────────────────────────────────────────
// CATALOGUE
// ─────────────────────────────────────────────────────────────────────────────

export const CANONICAL_PARAMS: Record<CanonicalKey, CanonicalParam> = {
  quality: {
    key: 'quality',
    label: 'Qualité',
    tooltip: 'Échelle de qualité unifiée. 1 = brouillon (rapide, économique), 5 = premium (lent, plus cher). Mappée vers les options natives de chaque modèle.',
    kind: 'slider-stepped',
    default: 3,
    min: 1, max: 5, step: 1,
    options: [
      { value: 1, label: 'Brouillon' },
      { value: 2, label: 'Standard' },
      { value: 3, label: 'Équilibré' },
      { value: 4, label: 'Élevé' },
      { value: 5, label: 'Premium' },
    ],
    mapping: {
      'dall-e-3':         dalleQuality,
      'dall-e-2':         dalleQuality,
      'gpt-image-1':      gptImageQuality,
      'gpt-image-1-mini': gptImageQuality,
      'gpt-image-1.5':    gptImageQuality,
      'gpt-image-2':      gptImageQuality,
    },
  },

  outputFormat: {
    key: 'outputFormat',
    label: 'Format de sortie',
    tooltip: 'Lossless = PNG (sans perte, lourd). Équilibré = WebP/JPEG. Compact = JPEG (le plus léger).',
    kind: 'segmented',
    default: 'lossless',
    options: [
      { value: 'lossless', label: 'Lossless' },
      { value: 'balanced', label: 'Équilibré' },
      { value: 'compact',  label: 'Compact' },
    ],
    mapping: {
      'gpt-image-1':      formatToOpenAI,
      'gpt-image-1-mini': formatToOpenAI,
      'gpt-image-1.5':    formatToOpenAI,
      'gpt-image-2':      formatToOpenAI,
      'flux-1.1-schnell': formatToFal,
      'flux-1.1-pro':     formatToFal,
      'sd-3.5-large':     formatToFal,
    },
  },

  creativity: {
    key: 'creativity',
    label: 'Créativité',
    tooltip: 'À quel point le modèle improvise. 0 = très strict (suit le prompt à la lettre, risque d\'artefacts). 10 = sauvage (interprète librement). Pilote temperature/guidance selon le modèle.',
    kind: 'slider-continuous',
    default: 5,
    min: 0, max: 10, step: 0.5,
    mapping: {
      'gemini-2.5-flash-image':         creativityToTemperature,
      'gemini-3.1-flash-image-preview': creativityToTemperature,
      'gemini-3-pro-image-preview':     creativityToTemperature,
      'flux-1.1-schnell':               creativityToGuidance,
      'flux-1.1-pro':                   creativityToGuidance,
      'sd-3.5-large':                   creativityToGuidance,
    },
  },

  inferenceEffort: {
    key: 'inferenceEffort',
    label: 'Effort de calcul',
    tooltip: 'Nombre de passes de débruitage. Plus élevé = qualité finer mais plus lent. Le coût Fal est forfaitaire par image, donc pas d\'impact prix direct.',
    kind: 'slider-stepped',
    default: 3,
    min: 1, max: 5, step: 1,
    options: [
      { value: 1, label: 'Minimal' },
      { value: 2, label: 'Réduit' },
      { value: 3, label: 'Standard' },
      { value: 4, label: 'Soutenu' },
      { value: 5, label: 'Maximal' },
    ],
    mapping: {
      'flux-1.1-schnell': effortToSchnellSteps,
      'flux-1.1-pro':     effortToProSteps,
      'sd-3.5-large':     effortToProSteps,
    },
  },

  negativePrompt: {
    key: 'negativePrompt',
    label: 'Prompt négatif',
    tooltip: 'Description de ce que tu NE veux PAS dans l\'image (artefacts, styles à éviter, éléments parasites…). Appliqué uniquement aux modèles qui le supportent.',
    kind: 'textarea',
    default: '',
    mapping: {
      'sd-3.5-large':                   (v) => ({ negativePrompt: String(v ?? '') }),
      'imagen-4-fast':                  (v) => ({ negativePrompt: String(v ?? '') }),
      'imagen-4':                       (v) => ({ negativePrompt: String(v ?? '') }),
      'imagen-4-ultra':                 (v) => ({ negativePrompt: String(v ?? '') }),
    },
  },

  safetyLevel: {
    key: 'safetyLevel',
    label: 'Filtrage',
    tooltip: 'Strict = filtrage maximum. Équilibré = défaut sain. Permissif = filtrage allégé (utile pour la photographie artistique).',
    kind: 'segmented',
    default: 'balanced',
    options: [
      { value: 'strict',     label: 'Strict' },
      { value: 'balanced',   label: 'Équilibré' },
      { value: 'permissive', label: 'Permissif' },
    ],
    mapping: {
      'flux-1.1-pro':     safetyToFalPro,
      'flux-1.1-schnell': safetyToFalStandard,
      'sd-3.5-large':     safetyToFalStandard,
      'gpt-image-1':      safetyToOpenAI,
      'gpt-image-1-mini': safetyToOpenAI,
      'gpt-image-1.5':    safetyToOpenAI,
      'gpt-image-2':      safetyToOpenAI,
    },
  },
}

/**
 * DTO sérialisable pour le frontend (sans les fonctions de mapping).
 * Le mapping vit côté server uniquement — le front envoie la valeur canonique
 * et le serveur la traduit avant d'appeler les adapters... NON : le mapping
 * doit pouvoir tourner côté **client** aussi, parce que `useModelParams` doit
 * recevoir les valeurs natives (le contrat backend reste inchangé).
 *
 * → On expose le mapping côté client en sérialisant les fonctions sous forme
 *   de "rules" déclaratives. Voir `canonicalMappingRules.ts` pour la version
 *   compatible client (tables de correspondance + interpolation linéaire).
 */
export interface CanonicalParamDTO {
  key: CanonicalKey
  label: string
  tooltip: string
  kind: ParamKind
  default: string | number | boolean
  min?: number
  max?: number
  step?: number
  options?: CanonicalOption[]
  maxLength?: number
  appliesTo: string[]
}

export function toCanonicalParamDTO(p: CanonicalParam): CanonicalParamDTO {
  return {
    key: p.key,
    label: p.label,
    tooltip: p.tooltip,
    kind: p.kind,
    default: p.default,
    min: p.min,
    max: p.max,
    step: p.step,
    options: p.options,
    maxLength: p.maxLength,
    appliesTo: appliesTo(p),
  }
}

/**
 * Liste les `CanonicalParamDTO` applicables à au moins un modèle donné.
 * Utilisé par `/api/models` ou un endpoint dédié.
 */
export function listApplicableCanonicalParams(modelIds: string[]): CanonicalParamDTO[] {
  const set = new Set(modelIds)
  return Object.values(CANONICAL_PARAMS)
    .filter((p) => appliesTo(p).some((id) => set.has(id)))
    .map(toCanonicalParamDTO)
}

/**
 * Calcule, pour une valeur canonique donnée et un modèle donné, les overrides
 * natifs à écrire dans `useModelParams`. Utilisé côté **client** via un DTO
 * sérialisable (voir `canonicalMappingRules.ts` pour le contrat client).
 */
export function applyCanonicalToModel(
  canonicalKey: CanonicalKey,
  canonicalValue: unknown,
  modelId: string,
): NativeOverrides {
  const param = CANONICAL_PARAMS[canonicalKey]
  if (!param) return {}
  const fn = param.mapping[modelId]
  if (!fn) return {}
  return fn(canonicalValue)
}

