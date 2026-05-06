import { z } from 'zod'

/**
 * STORY-120 / EPIC-18 — Catalogue mutualisé de traits de paramètres.
 *
 * Source de vérité unique : un trait défini ici est référencé par autant de
 * modèles que pertinent (cf. `modelParamProfiles.ts`). Pas de duplication.
 *
 * Distinction `scope` :
 *   - `global`         : valeur partagée entre tous les modèles concernés au sein d'une session.
 *                        S'affiche dans le panneau "Configuration de l'image".
 *                        Les traits homogènes sont factorisés via les paramètres
 *                        canoniques (`shared/canonicalParams.ts`) ; les traits
 *                        idiosyncratiques restent rendus par modèle.
 *   - `per-generation` : valeur intimement liée à une instance précise (modèle × prompt × run).
 *                        S'affiche sur la carte de génération + vue détail.
 */

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

export type ParamScope = 'global' | 'per-generation'

export interface ParamOptionMeta {
  value: string | number
  label: string
}

export interface ParamCostImpact {
  /** Multiplicateur appliqué au prix de base. (value) → 1, 2, 0.5… */
  multiplier?: (value: unknown) => number
  /** Addition fixe au prix de base. (value) → 0, 0.04… */
  addition?: (value: unknown) => number
}

export interface ParamTrait {
  key: string
  label: string
  tooltip: string
  kind: ParamKind
  scope: ParamScope
  zod: z.ZodTypeAny
  default: unknown
  /** Sliders : bornes et pas. */
  min?: number
  max?: number
  step?: number
  /** Segmented / select / radio : options ordonnées. */
  options?: ParamOptionMeta[]
  /** Textarea : longueur max. */
  maxLength?: number
  /** Si présent, le coût d'une génération est ajusté en fonction de la valeur. */
  affectsCost?: ParamCostImpact
}

const SAFETY_TOLERANCE_OPTIONS: ParamOptionMeta[] = [
  { value: 1, label: '1 (strict)' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 4, label: '4' },
  { value: 5, label: '5' },
  { value: 6, label: '6 (permissif)' },
]

export const PARAM_TRAITS = {
  // ─────────────────────────────────────────────────────────────────────────
  // PER-GENERATION — vit sur la carte / vue détail (jamais dans le panneau global)
  // ─────────────────────────────────────────────────────────────────────────

  seed: {
    key: 'seed',
    label: 'Seed',
    tooltip: 'Graine déterministe : la même valeur + le même prompt + le même modèle = la même image. Utile pour itérer sans tout changer.',
    kind: 'number-with-random',
    scope: 'per-generation',
    zod: z.number().int().nonnegative().nullable(),
    default: null,
    min: 0,
    max: 2147483647,
  },

  falImageUrl: {
    key: 'falImageUrl',
    label: 'Image de référence',
    tooltip: 'Image utilisée comme référence visuelle (style transfer). Le modèle s\'inspire de la composition et des couleurs.',
    kind: 'textarea',
    scope: 'per-generation',
    zod: z.string().url().nullable(),
    default: null,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // GLOBAL — exposés dans la "Configuration de l'image" (canoniques ou idiosyncratiques)
  // ─────────────────────────────────────────────────────────────────────────

  guidanceScale: {
    key: 'guidanceScale',
    label: 'Adhérence au prompt (CFG)',
    tooltip: 'Plus la valeur est haute, plus le modèle suit le prompt à la lettre — au risque d\'artefacts. Plus elle est basse, plus le modèle interprète librement.',
    kind: 'slider-continuous',
    scope: 'global',
    zod: z.number().min(1).max(20),
    default: 3.5,
    min: 1,
    max: 20,
    step: 0.5,
  },

  numInferenceSteps: {
    key: 'numInferenceSteps',
    label: 'Étapes d\'inférence',
    tooltip: 'Nombre de passes de débruitage. Plus = qualité finer mais plus lent. Le coût Fal est forfaitaire par image, donc pas d\'impact prix direct.',
    kind: 'slider-stepped',
    scope: 'global',
    zod: z.number().int().min(1).max(50),
    default: 28,
    min: 1,
    max: 50,
    step: 1,
  },

  negativePrompt: {
    key: 'negativePrompt',
    label: 'Prompt négatif',
    tooltip: 'Description de ce que tu NE veux PAS dans l\'image (artefacts, styles à éviter, éléments parasites…).',
    kind: 'textarea',
    scope: 'global',
    zod: z.string().max(2000),
    default: '',
    maxLength: 2000,
  },

  safetyTolerance: {
    key: 'safetyTolerance',
    label: 'Tolérance du filtre',
    tooltip: '1 = filtrage très strict, 6 = très permissif. Affecte ce que le modèle accepte de générer.',
    kind: 'segmented',
    scope: 'global',
    zod: z.number().int().min(1).max(6),
    default: 3,
    options: SAFETY_TOLERANCE_OPTIONS,
  },

  outputFormat: {
    key: 'outputFormat',
    label: 'Format de sortie',
    tooltip: 'PNG = sans perte (plus lourd). JPEG/WebP = compressé, plus léger.',
    kind: 'segmented',
    scope: 'global',
    zod: z.enum(['png', 'jpeg', 'webp']),
    default: 'png',
    options: [
      { value: 'png', label: 'PNG' },
      { value: 'jpeg', label: 'JPEG' },
      { value: 'webp', label: 'WebP' },
    ],
  },

  enableSafetyChecker: {
    key: 'enableSafetyChecker',
    label: 'Filtre NSFW',
    tooltip: 'Bloque les contenus jugés inappropriés par le modèle. Désactivable pour la photographie artistique.',
    kind: 'toggle',
    scope: 'global',
    zod: z.boolean(),
    default: true,
  },

  numImages: {
    key: 'numImages',
    label: 'Images par génération',
    tooltip: 'Nombre d\'images produites par appel pour ce modèle. Multiplie le coût d\'autant.',
    kind: 'number',
    scope: 'global',
    zod: z.number().int().min(1).max(4),
    default: 1,
    min: 1,
    max: 4,
    step: 1,
    affectsCost: {
      multiplier: (v) => (typeof v === 'number' ? v : 1),
    },
  },

  falImagePromptStrength: {
    key: 'falImagePromptStrength',
    label: 'Force de la référence',
    tooltip: 'Poids de l\'image de référence vs le prompt textuel (0 = ignorée, 1 = très influente).',
    kind: 'slider-continuous',
    scope: 'global',
    zod: z.number().min(0).max(1),
    default: 0.5,
    min: 0,
    max: 1,
    step: 0.05,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // OpenAI (DALL·E + GPT Image)
  // ─────────────────────────────────────────────────────────────────────────

  openaiQuality: {
    key: 'openaiQuality',
    label: 'Qualité',
    tooltip: 'Plus haut = plus de détail mais plus cher. Sur DALL·E 3, "hd" double le tarif. Sur GPT Image, "high" peut multiplier le coût par ~5 (token-based, indicatif).',
    kind: 'segmented',
    scope: 'global',
    zod: z.enum(['low', 'medium', 'high', 'auto', 'standard', 'hd']),
    default: 'auto',
    options: [
      { value: 'low', label: 'Low' },
      { value: 'medium', label: 'Medium' },
      { value: 'high', label: 'High' },
      { value: 'auto', label: 'Auto' },
      { value: 'standard', label: 'Standard' },
      { value: 'hd', label: 'HD' },
    ],
    affectsCost: {
      multiplier: (v) => {
        if (v === 'hd') return 2
        if (v === 'high') return 1.8
        if (v === 'low') return 0.4
        if (v === 'medium') return 0.8
        return 1
      },
    },
  },

  openaiStyle: {
    key: 'openaiStyle',
    label: 'Style',
    tooltip: 'Vivid = rendu hyper-saturé, naturel = plus sobre et photographique. Spécifique DALL·E 3.',
    kind: 'radio',
    scope: 'global',
    zod: z.enum(['vivid', 'natural']),
    default: 'vivid',
    options: [
      { value: 'vivid', label: 'Vivid' },
      { value: 'natural', label: 'Natural' },
    ],
  },

  openaiBackground: {
    key: 'openaiBackground',
    label: 'Fond',
    tooltip: 'Auto = laissé au modèle. Transparent = fond alpha (utile pour découpe/composition). Opaque = forcé plein.',
    kind: 'segmented',
    scope: 'global',
    zod: z.enum(['auto', 'transparent', 'opaque']),
    default: 'auto',
    options: [
      { value: 'auto', label: 'Auto' },
      { value: 'transparent', label: 'Transparent' },
      { value: 'opaque', label: 'Opaque' },
    ],
  },

  openaiModeration: {
    key: 'openaiModeration',
    label: 'Modération',
    tooltip: 'Auto = filtrage standard. Low = filtrage allégé (réservé aux comptes habilités).',
    kind: 'segmented',
    scope: 'global',
    zod: z.enum(['auto', 'low']),
    default: 'auto',
    options: [
      { value: 'auto', label: 'Auto' },
      { value: 'low', label: 'Low' },
    ],
  },

  outputCompression: {
    key: 'outputCompression',
    label: 'Compression',
    tooltip: 'Niveau de compression JPEG/WebP (0–100 %). Sans effet sur PNG.',
    kind: 'slider-continuous',
    scope: 'global',
    zod: z.number().int().min(0).max(100),
    default: 100,
    min: 0,
    max: 100,
    step: 1,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Google Imagen
  // ─────────────────────────────────────────────────────────────────────────

  imagenPersonGeneration: {
    key: 'imagenPersonGeneration',
    label: 'Génération de personnes',
    tooltip: 'Contrôle ce que le modèle accepte de générer concernant les personnes. Soumis aux politiques Google.',
    kind: 'select',
    scope: 'global',
    zod: z.enum(['allow_adult', 'allow_all', 'dont_allow']),
    default: 'allow_adult',
    options: [
      { value: 'allow_adult', label: 'Adultes uniquement' },
      { value: 'allow_all', label: 'Tout autoriser' },
      { value: 'dont_allow', label: 'Aucune personne' },
    ],
  },

  imagenAddWatermark: {
    key: 'imagenAddWatermark',
    label: 'Watermark Google',
    tooltip: 'Ajoute la marque d\'eau invisible SynthID propre à Google. Désactivable selon les conditions de service.',
    kind: 'toggle',
    scope: 'global',
    zod: z.boolean(),
    default: true,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Google Gemini Image (Nano Banana)
  // ─────────────────────────────────────────────────────────────────────────

  geminiTemperature: {
    key: 'geminiTemperature',
    label: 'Température',
    tooltip: 'Contrôle l\'imprévisibilité du modèle. 0 = très déterministe, 2 = très créatif/aléatoire. 1 par défaut.',
    kind: 'slider-continuous',
    scope: 'global',
    zod: z.number().min(0).max(2),
    default: 1,
    min: 0,
    max: 2,
    step: 0.05,
  },

  geminiImageSize: {
    key: 'geminiImageSize',
    label: 'Résolution',
    tooltip: 'Résolution de sortie. Plus haut = plus lent et plus cher.',
    kind: 'segmented',
    scope: 'global',
    zod: z.enum(['512', '1K', '2K', '4K']),
    default: '2K',
    options: [
      { value: '512', label: '0,5K' },
      { value: '1K', label: '1K' },
      { value: '2K', label: '2K' },
      { value: '4K', label: '4K' },
    ],
  },
} as const satisfies Record<string, ParamTrait>

export type ParamTraitKey = keyof typeof PARAM_TRAITS
