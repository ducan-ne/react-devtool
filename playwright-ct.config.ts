import { defineConfig } from '@playwright/experimental-ct-react'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  testDir: './tests/ct',
  timeout: 30_000,
  fullyParallel: true,
  use: {
    ctPort: 3100,
    ctViteConfig: {
      plugins: [react(), tsconfigPaths()],
      resolve: {
        alias: {
          'react-devtool': path.resolve(__dirname, './src'),
          'react-devtool/ui': path.resolve(__dirname, './src/ui.tsx'),
        },
      },
    },
  },
})
