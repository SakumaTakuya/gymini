/// <reference types="vitest" />
import { fileURLToPath } from 'url'
import path from 'path'
import process from 'node:process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/gymini/',
  plugins: [
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(path.dirname(fileURLToPath(import.meta.url)), './src'),
    },
  },
  server: {
    // Codespaces のポートフォワード(HTTPS/443)経由でも HMR WebSocket が繋がるように
    hmr: process.env.CODESPACES ? { clientPort: 443 } : undefined,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    exclude: ['**/node_modules/**', '**/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/routeTree.gen.ts',
        'src/main.tsx',
        'src/vite-env.d.ts',
        'src/types/**',
        'src/components/ui/**',
        'src/routes/**',
        'src/hooks/useHydrated.ts',
        'src/test/**',
        'src/dev/**',
        '**/*.test.{ts,tsx}',
      ],
      thresholds: {
        lines: 90,
        branches: 90,
        functions: 90,
        statements: 90,
      },
    },
  },
})
