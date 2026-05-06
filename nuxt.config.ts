import { fileURLToPath } from 'node:url'
import { defineNuxtConfig } from 'nuxt/config'

const sharedPath = fileURLToPath(new URL('./shared', import.meta.url))

export default defineNuxtConfig({
  compatibilityDate: '2026-04-28',
  future: { compatibilityVersion: 4 },
  experimental: { appManifest: false },
  devtools: { enabled: true },
  ssr: false,
  modules: ['@nuxtjs/tailwindcss'],
  components: [
    { path: '~/components/ui', pathPrefix: false },
    { path: '~/components/generation', pathPrefix: false },
    { path: '~/components/session', pathPrefix: false },
    '~/components',
  ],
  css: ['~/assets/css/tokens.css', '~/assets/css/main.css'],
  app: {
    head: {
      title: 'SeedComparator',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
    },
  },
  alias: {
    '#shared': sharedPath,
  },
  nitro: {
    preset: 'node-server',
    alias: {
      '#shared': sharedPath,
    },
    // Externalise les libs lourdes / qui pullent electron en transitif (Playwright).
    // Elles seront chargées en runtime depuis node_modules au lieu d'être bundlées
    // dans .output/server (sinon le bundle final fait ~290MB au lieu de ~5MB).
    externals: {
      external: ['playwright', 'playwright-core', 'electron'],
    },
    rollupConfig: {
      external: [/^playwright/, 'electron'],
    },
  },
  devServer: {
    port: 3300,
    host: '127.0.0.1',
  },
  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL,
    // EPIC-14 — Mode provider (3 valeurs : mock | mock-real | live).
    // La cascade de résolution est dans server/services/providerMode.ts (DB > env > 'live').
    providersMode: process.env.PROVIDER_MODE ?? '',
    // Compat ancienne variable
    providersMockMode: process.env.PROVIDERS_MOCK_MODE === 'true',
    public: {
      // Mode initial exposé au client. Sera surchargé runtime via /api/settings.
      providerMode: process.env.PROVIDER_MODE ?? (process.env.PROVIDERS_MOCK_MODE === 'true' ? 'mock' : 'live'),
      // Compat
      mockMode: process.env.PROVIDERS_MOCK_MODE === 'true',
    },
  },
})
