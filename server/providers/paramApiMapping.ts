/**
 * STORY-121 / EPIC-18 — Mapping clés canoniques (paramTraits.ts) → noms d'API.
 *
 * Chaque source a ses propres conventions (`guidance_scale` chez Fal,
 * `parameters.aspectRatio` chez Imagen, etc.). Ce fichier centralise les
 * traductions pour que les adapters n'aient qu'à appeler `applyParams(...)`.
 *
 * Règles :
 *   - Un trait absent de la map = ignoré silencieusement (= envoyé sous son
 *     nom canonique uniquement si l'API l'accepte tel quel — sinon, ne pas
 *     l'inclure dans la map de la source pour qu'il ne fuite pas).
 *   - La fonction `applyParams` ne renvoie QUE des clés mappées. Pas de fuite.
 */

type TraitKey = string
type ApiKey = string

export interface ParamApiMapping {
  /** Mapping `traitKey → nom dans le body API`. */
  bodyKeys?: Record<TraitKey, ApiKey>
  /**
   * Pour les API qui imbriquent (ex: Imagen `parameters.aspectRatio`),
   * on indique le chemin avec un `.`.
   */
  nestedKeys?: Record<TraitKey, string>
}

const FAL_MAPPING: ParamApiMapping = {
  bodyKeys: {
    seed: 'seed',
    guidanceScale: 'guidance_scale',
    numInferenceSteps: 'num_inference_steps',
    negativePrompt: 'negative_prompt',
    safetyTolerance: 'safety_tolerance',
    outputFormat: 'output_format',
    enableSafetyChecker: 'enable_safety_checker',
    falImageUrl: 'image_url',
    falImagePromptStrength: 'image_prompt_strength',
  },
}

const OPENAI_MAPPING: ParamApiMapping = {
  bodyKeys: {
    openaiQuality: 'quality',
    openaiStyle: 'style',
    openaiBackground: 'background',
    openaiModeration: 'moderation',
    outputFormat: 'response_format',
    outputCompression: 'output_compression',
  },
}

const IMAGEN_MAPPING: ParamApiMapping = {
  nestedKeys: {
    seed: 'parameters.seed',
    imagenPersonGeneration: 'parameters.personGeneration',
    imagenAddWatermark: 'parameters.addWatermark',
    negativePrompt: 'parameters.negativePrompt',
  },
}

const GEMINI_IMAGE_MAPPING: ParamApiMapping = {
  nestedKeys: {
    geminiTemperature: 'generationConfig.temperature',
    geminiImageSize: 'generationConfig.imageSize',
  },
}

export const API_MAPPINGS = {
  fal: FAL_MAPPING,
  openai: OPENAI_MAPPING,
  imagen: IMAGEN_MAPPING,
  geminiImage: GEMINI_IMAGE_MAPPING,
} as const

export type ApiMappingKey = keyof typeof API_MAPPINGS

/**
 * Applique les overrides utilisateur à un body API, en ne touchant qu'aux
 * clés connues du mapping. Mute `body` (ou son sous-objet pour nested) et le
 * retourne pour chaînage. Les valeurs `undefined` sont ignorées.
 *
 * @param mapping Mapping de la source
 * @param body Objet racine (sera muté)
 * @param params Map des paramètres résolus (canoniques)
 */
export function applyParams(
  mapping: ParamApiMapping,
  body: Record<string, unknown>,
  params: Record<string, unknown> | undefined,
): Record<string, unknown> {
  if (!params) return body

  for (const [traitKey, value] of Object.entries(params)) {
    if (value === undefined) continue

    const flatKey = mapping.bodyKeys?.[traitKey]
    if (flatKey) {
      body[flatKey] = value
      continue
    }

    const nestedPath = mapping.nestedKeys?.[traitKey]
    if (nestedPath) {
      setNested(body, nestedPath, value)
      continue
    }
    // Trait inconnu pour cette source → ignoré silencieusement.
  }

  return body
}

function setNested(obj: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split('.')
  let cursor: Record<string, unknown> = obj
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i]!
    if (typeof cursor[k] !== 'object' || cursor[k] === null) {
      cursor[k] = {}
    }
    cursor = cursor[k] as Record<string, unknown>
  }
  cursor[parts[parts.length - 1]!] = value
}
