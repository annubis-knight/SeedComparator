import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/.output/**', '**/.nuxt/**', '**/dist-electron/**', '**/*.timestamp-*'],
    testTimeout: 30_000,
    dangerouslyIgnoreUnhandledErrors: true,
    alias: {
      '#shared': fileURLToPath(new URL('./shared', import.meta.url)),
    },
  },
})
