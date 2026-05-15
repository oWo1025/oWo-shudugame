import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import legacy from '@vitejs/plugin-legacy'
import { VitePWA } from 'vite-plugin-pwa'
import pkg from './package.json'
import changelogPlugin from './vite-plugin-changelog'

const SUPABASE_URL = process.env.SUPABASE_URL || ''
const SUPABASE_KEY = process.env.SUPABASE_KEY || ''
const NAS_URL = process.env.NAS_URL || ''
const NAS_USERNAME = process.env.NAS_USERNAME || ''
const NAS_PASSWORD = process.env.NAS_PASSWORD || ''
const NAS_PATH = process.env.NAS_PATH || '/Sudoku'

export default defineConfig({
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  server: {
    proxy: {
      '/api/nas': {
        target: NAS_URL || 'http://192.168.31.175:5007',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/nas/, ''),
      },
    },
  },
  plugins: [
    changelogPlugin(),
    react(),
    legacy({
      targets: ['defaults', 'not IE 11'],
      modernPolyfills: true,
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: '数独',
        short_name: '数独',
        description: '经典9×9数独游戏',
        start_url: './',
        scope: './',
        display: 'standalone',
        background_color: '#4F6BF6',
        theme_color: '#4F6BF6',
        icons: [
          {
            src: './icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: './icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: './maskable-icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: './maskable-icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: './index.html',
      },
    }),
    {
      name: 'inject-meta-config',
      transformIndexHtml(html) {
        return html
          .replace('content="" name="supabase-url"', `content="${SUPABASE_URL}" name="supabase-url"`)
          .replace('content="" name="supabase-key"', `content="${SUPABASE_KEY}" name="supabase-key"`)
          .replace('content="" name="nas-url"', `content="${NAS_URL}" name="nas-url"`)
          .replace('content="" name="nas-username"', `content="${NAS_USERNAME}" name="nas-username"`)
          .replace('content="" name="nas-password"', `content="${NAS_PASSWORD}" name="nas-password"`)
          .replace('content="/Sudoku" name="nas-path"', `content="${NAS_PATH}" name="nas-path"`)
      },
    },
  ],
})
