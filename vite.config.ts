/// <reference types="vitest" />
import { fileURLToPath } from 'url'
import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import path from 'path'
import process from 'node:process'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'

/**
 * 開発サーバー専用: public/ort/ の WASM 一式を素の静的ファイルとして配信する。
 * onnxruntime-web は wasmPaths 配下の .mjs を動的 import() で読むが、
 * Vite の開発サーバーは public/ 配下のファイルをモジュールとして
 * import しようとすると 500 エラー（vite-error-overlay）を出す。
 * そのため本番ビルド（vite preview / GitHub Pages）では動くのに、
 * E2E の使う開発サーバーでは分類器の読み込みを試みるたびに
 * オーバーレイが出てクリックが塞がれ、大量の E2E が失敗する。
 * dev 専用ミドルウェアで transform より先に配信し、回避する。
 * 本番は public/ がそのまま dist へコピーされるため不要。
 */
function serveOrtAssets(): Plugin {
  return {
    name: 'serve-ort-assets',
    apply: 'serve',
    configureServer(server) {
      const ortDir = path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        'public/ort',
      )
      const prefix = `${server.config.base}ort/`
      server.middlewares.use(async (req, res, next) => {
        try {
          if (req.method !== 'GET' && req.method !== 'HEAD') return next()
          const pathname = (req.url ?? '').split('?')[0]
          if (!pathname.startsWith(prefix)) return next()
          const rel = decodeURIComponent(pathname.slice(prefix.length))
          const file = path.resolve(ortDir, rel)
          if (!file.startsWith(ortDir + path.sep)) return next()
          const info = await stat(file).catch(() => null)
          if (!info?.isFile()) return next()
          const type =
            file.endsWith('.mjs') || file.endsWith('.js')
              ? 'text/javascript; charset=utf-8'
              : file.endsWith('.wasm')
                ? 'application/wasm'
                : 'application/octet-stream'
          res.writeHead(200, {
            'Content-Type': type,
            'Content-Length': info.size,
          })
          if (req.method === 'GET') createReadStream(file).pipe(res)
          else res.end()
        } catch {
          next()
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: '/gymini/',
  plugins: [
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    react(),
    tailwindcss(),
    serveOrtAssets(),
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
