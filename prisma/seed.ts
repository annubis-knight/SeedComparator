import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const providers = [
    { id: 'openrouter', displayName: 'OpenRouter' },
    { id: 'fal', displayName: 'Fal.ai' },
    { id: 'google-ai', displayName: 'Google AI Studio' },
    { id: 'openai', displayName: 'OpenAI Platform' },
  ]

  for (const p of providers) {
    await prisma.provider.upsert({
      where: { id: p.id },
      update: { displayName: p.displayName },
      create: { id: p.id, displayName: p.displayName, apiKeyRef: p.id },
    })
  }

  // Brand: éditeur du modèle (visible UI). brandSortOrder fixe l'ordre d'affichage.
  // providerId = gateway technique (OpenRouter, Fal.ai), invisible dans le ModelSelector.
  const G = { brandId: 'google',            brandDisplayName: 'Google',            brandSortOrder: 1 }
  const O = { brandId: 'openai',            brandDisplayName: 'OpenAI',            brandSortOrder: 2 }
  const B = { brandId: 'black-forest-labs', brandDisplayName: 'Black Forest Labs', brandSortOrder: 3 }
  const S = { brandId: 'stability-ai',      brandDisplayName: 'Stability AI',      brandSortOrder: 4 }

  // EPIC-14 / STORY-104 — Catalogue refondé : tous les modèles d'image sont
  // accessibles directement via leur API native (Google AI, OpenAI Platform,
  // Fal.ai). OpenRouter n'est plus utilisé pour les images (uniquement texte
  // côté Brief Assistant). Les anciens IDs Imagen 3 (déprécié) et Gemini 3.1
  // via OpenRouter ont été remplacés.
  const models = [
    // Google AI Studio — gateway "google-ai"
    // Imagen (predict endpoint)
    { id: 'imagen-4-fast',                      providerId: 'google-ai', displayName: 'Imagen 4 Fast',          supportsSeed: false, pricePerImage: '0.020', ...G },
    { id: 'imagen-4',                           providerId: 'google-ai', displayName: 'Imagen 4',               supportsSeed: false, pricePerImage: '0.040', ...G },
    { id: 'imagen-4-ultra',                     providerId: 'google-ai', displayName: 'Imagen 4 Ultra',         supportsSeed: false, pricePerImage: '0.060', ...G },
    // Gemini Image (generateContent endpoint, modality IMAGE)
    { id: 'gemini-2.5-flash-image',             providerId: 'google-ai', displayName: 'Nano Banana',            supportsSeed: false, pricePerImage: '0.030', ...G },
    { id: 'gemini-3.1-flash-image-preview',     providerId: 'google-ai', displayName: 'Nano Banana 2',          supportsSeed: false, pricePerImage: '0.040', ...G },
    { id: 'gemini-3-pro-image-preview',         providerId: 'google-ai', displayName: 'Nano Banana Pro',        supportsSeed: false, pricePerImage: '0.130', ...G },

    // OpenAI Platform — gateway "openai" (tri par prix croissant)
    { id: 'gpt-image-1-mini',                   providerId: 'openai',    displayName: 'GPT Image 1 Mini',       supportsSeed: false, pricePerImage: '0.011', ...O },
    { id: 'dall-e-2',                           providerId: 'openai',    displayName: 'DALL-E 2',               supportsSeed: false, pricePerImage: '0.020', ...O },
    { id: 'gpt-image-1.5',                      providerId: 'openai',    displayName: 'GPT Image 1.5',          supportsSeed: false, pricePerImage: '0.030', ...O },
    { id: 'dall-e-3',                           providerId: 'openai',    displayName: 'DALL-E 3',               supportsSeed: false, pricePerImage: '0.040', ...O },
    { id: 'gpt-image-1',                        providerId: 'openai',    displayName: 'GPT Image 1',            supportsSeed: false, pricePerImage: '0.040', ...O },
    { id: 'gpt-image-2',                        providerId: 'openai',    displayName: 'GPT Image 2',            supportsSeed: false, pricePerImage: '0.053', ...O },

    // Fal.ai — gateway "fal"
    { id: 'flux-1.1-schnell',                   providerId: 'fal',       displayName: 'Flux 1.1 Schnell',       supportsSeed: true,  pricePerImage: '0.010', ...B },
    { id: 'sd-3.5-large',                       providerId: 'fal',       displayName: 'Stable Diffusion 3.5 Large', supportsSeed: true, pricePerImage: '0.030', ...S },
    { id: 'flux-1.1-pro',                       providerId: 'fal',       displayName: 'Flux 1.1 Pro',           supportsSeed: true,  pricePerImage: '0.040', ...B },
  ]

  // STORY-104 — IDs obsolètes à supprimer (ancien seed). On les retire de la DB
  // pour que le ModelSelector ne les affiche plus, et que les fixtures orphelines
  // ne perturbent pas le mode mock-real.
  const obsoleteModelIds = [
    'gemini-3.1-flash-lite',  // OpenRouter, ID inexistant côté API
    'gemini-3.1-flash',       // OpenRouter, basculé sur gemini-3.1-flash-image-preview / google-ai
    'gemini-3.1-pro',         // OpenRouter, basculé sur gemini-3-pro-image-preview / google-ai
    'imagen-3-fast',          // Imagen 3 déprécié → Imagen 4
    'imagen-3',               // Imagen 3 déprécié → Imagen 4
    'imagen-4-preview',       // Renommé en imagen-4 (GA)
  ]
  for (const id of obsoleteModelIds) {
    await prisma.model.deleteMany({ where: { id } })
  }

  for (const m of models) {
    await prisma.model.upsert({
      where: { id: m.id },
      update: {
        displayName: m.displayName,
        pricePerImage: m.pricePerImage,
        supportsSeed: m.supportsSeed,
        brandId: m.brandId,
        brandDisplayName: m.brandDisplayName,
        brandSortOrder: m.brandSortOrder,
      },
      create: m,
    })
  }

  const defaults = [
    { key: 'cost_threshold_usd', value: '0.5' },
    { key: 'save_folder', value: '' },
    { key: 'concurrency_limit', value: '3' },
  ]
  for (const s of defaults) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    })
  }

  console.log('[seed] OK — providers, models, settings prêts')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
