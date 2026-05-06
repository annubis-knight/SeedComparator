interface CachedImage {
  buffer: Buffer
  mime: string
  createdAt: number
}

const cache = new Map<string, CachedImage>()

export function putImage(generationId: string, buffer: Buffer, mime: string) {
  cache.set(generationId, { buffer, mime, createdAt: Date.now() })
}

export function getImage(generationId: string): CachedImage | null {
  return cache.get(generationId) ?? null
}

export function deleteImage(generationId: string) {
  cache.delete(generationId)
}

export function clearAll() {
  cache.clear()
}

export function imageToDataUrl(generationId: string): string | null {
  const entry = cache.get(generationId)
  if (!entry) return null
  return `data:${entry.mime};base64,${entry.buffer.toString('base64')}`
}
