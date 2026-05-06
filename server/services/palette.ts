import { Vibrant } from 'node-vibrant/node'
import { createLogger } from '../utils/logger'

const log = createLogger('palette')

export interface PaletteEntry {
  hex: string
  population: number
  role: 'vibrant' | 'muted' | 'lightVibrant' | 'lightMuted' | 'darkVibrant' | 'darkMuted'
}

/**
 * Extrait les couleurs dominantes d'un screenshot via node-vibrant.
 * Retourne jusqu'à 6 entrées avec leur poids relatif.
 */
export async function extractPalette(imageBuffer: Buffer): Promise<PaletteEntry[]> {
  log.debug(`extractPalette start bytes=${imageBuffer.length}`)
  const palette = await Vibrant.from(imageBuffer).getPalette()
  const entries: PaletteEntry[] = []
  const roles = ['Vibrant', 'Muted', 'LightVibrant', 'LightMuted', 'DarkVibrant', 'DarkMuted'] as const
  for (const r of roles) {
    const swatch = palette[r]
    if (!swatch) continue
    entries.push({
      hex: swatch.hex,
      population: swatch.population,
      role: lowerRole(r),
    })
  }
  // Tri par population décroissante
  entries.sort((a, b) => b.population - a.population)
  log.info(`extractPalette success ${entries.length} swatches`, entries.map((e) => e.hex))
  return entries
}

function lowerRole(r: string): PaletteEntry['role'] {
  return (r.charAt(0).toLowerCase() + r.slice(1)) as PaletteEntry['role']
}
