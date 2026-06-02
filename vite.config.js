import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/quitto/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      injectManifest: { maximumFileSizeToCacheInBytes: 5000000 },
      manifest: {
        name: 'Quitto — Bargeld quittieren & abrechnen',
        short_name: 'Quitto',
        description: 'Bargeld annehmen, quittieren, Rechnung erstellen — mit Unterschrift.',
        lang: 'de',
        theme_color: '#0b0f1a',
        background_color: '#0b0f1a',
        display: 'standalone',
        orientation: 'portrait',
        id: '/quitto/',
        scope: '/quitto/',
        start_url: '/quitto/',
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
    }),
  ],
  server: { host: true },
})
