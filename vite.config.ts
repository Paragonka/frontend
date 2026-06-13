import path from 'node:path'
import { readFileSync } from 'node:fs'
import type { Plugin } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'

// MSW is a dev/test tool: its service worker must never ship in a prod build.
// The worker lives in tests/mocks/ (not public/) and is served only by the
// dev server, so production dist/ contains no trace of MSW.
const mswWorkerDev = (): Plugin => ({
  name: 'msw-worker-dev',
  apply: 'serve',
  configureServer(server) {
    server.middlewares.use('/mockServiceWorker.js', (_req, res) => {
      res.setHeader('Content-Type', 'text/javascript')
      res.end(readFileSync(path.resolve(__dirname, 'tests/mocks/mockServiceWorker.js')))
    })
  },
})

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    mswWorkerDev(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      injectRegister: 'script-defer',
      includeAssets: ['logo.svg'],
      devOptions: {
        enabled: false,
      },
      manifest: {
        name: 'Paragonka CRM',
        short_name: 'Paragonka',
        description: 'CRM for small businesses',
        theme_color: '#2563eb',
        background_color: '#f9fafb',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      injectManifest: {
        globIgnores: ['lazy-manifest.json'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes('node_modules/react-dom') ||
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-router-dom')
          ) {
            return 'vendor-react'
          }
          if (id.includes('node_modules/@tanstack/react-query')) {
            return 'vendor-query'
          }
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: './tests/setup.ts',
    testTimeout: 15000,
    hookTimeout: 15000,
    css: true,
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build,eslint,prettier}.config.*',
      'tests/e2e/**',
    ],
  },
})
