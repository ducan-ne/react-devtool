import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'jsdom',
    include: ['tests/unit/**/*.spec.{ts,tsx}'],
    globals: true,
    css: false,
    coverage: {
      reporter: ['text', 'html'],
    },
    setupFiles: ['tests/setup.ts'],
    alias: {
      'react-devtool': '/src',
      'react-devtool/ui': '/src/ui.tsx',
    },
  },
})

