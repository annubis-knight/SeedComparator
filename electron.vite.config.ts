import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import { resolve } from 'node:path'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: 'dist-electron/main',
      emptyOutDir: true,
      lib: {
        entry: resolve(__dirname, 'electron/main.ts'),
      },
      rollupOptions: {
        output: { format: 'es' },
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: 'dist-electron/preload',
      emptyOutDir: true,
      lib: {
        entry: resolve(__dirname, 'electron/preload.ts'),
      },
      rollupOptions: {
        output: { format: 'cjs', entryFileNames: '[name].cjs' },
      },
    },
  },
})
