/**
 * Extrait les blocs ```prompt ... ``` d'une réponse markdown du LLM.
 * Chaque bloc correspond à une variante (A, B, C dans l'ordre d'apparition).
 * @requirement: FR-074
 */
export function parsePromptBlocks(text: string): string[] {
  const regex = /```prompt\s*\n([\s\S]*?)```/g
  const results: string[] = []
  let match: RegExpExecArray | null
  while ((match = regex.exec(text)) !== null) {
    const content = match[1].trim()
    if (content) results.push(content)
  }
  return results
}

export const VARIANT_LABELS = ['A', 'B', 'C'] as const
export type VariantLabel = typeof VARIANT_LABELS[number]
