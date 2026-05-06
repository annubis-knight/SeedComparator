import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      imports: ['vue'],
      dts: false,
    }),
  ],
  test: {
    include: ['tests/unit/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/.output/**', '**/.nuxt/**', '**/dist-electron/**', '**/*.timestamp-*'],
    setupFiles: ['tests/setup/vitest.setup.ts'],
    environmentMatchGlobs: [
      ['tests/unit/components/**', 'happy-dom'],
      ['tests/unit/composables/**', 'happy-dom'],
      ['tests/unit/**', 'node'],
    ],
    alias: {
      '#shared': fileURLToPath(new URL('./shared', import.meta.url)),
      '~/': fileURLToPath(new URL('./app/', import.meta.url)),
    },
  },
})
