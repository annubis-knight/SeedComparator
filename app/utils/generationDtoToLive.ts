import type { GenerationDTO, Phase } from '#shared/contracts'
import type { LiveGeneration } from '~/composables/useGenerationSession'

/** STORY-107 — Convertit un GenerationDTO (depuis la DB) en LiveGeneration pour GenerationCard. */
export function dtoToLive(g: GenerationDTO): LiveGeneration {
  return {
    taskId: g.id,
    generationId: g.id,
    promptIdx: g.promptIdx,
    modelId: g.modelId,
    status: g.status,
    imageDataUrl: g.imageDataUrl ?? (g.imagePath ? `file://${g.imagePath}` : null),
    seed: g.seed ? Number(g.seed) : null,
    costUsd: g.costUsd,
    errorCode: g.errorCode,
    errorMsg: g.errorMsg,
    liked: g.liked,
    phase: (g.phase as Phase) ?? 'wireframe',
    promptVariant: g.promptVariant ?? 'A',
  }
}
