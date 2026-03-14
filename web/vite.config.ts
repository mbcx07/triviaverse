import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// NOTE: This app is intended to be deployed on GitHub Pages under /triviaverse/
// If you deploy elsewhere, adjust BASE accordingly.
const BASE = '/triviaverse/'

export default defineConfig({
  base: BASE,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png'],
      manifest: {
        name: 'Triviverso',
        short_name: 'Triviverso',
        description: 'Trivias estilo Duolingo para 5º y 6º de primaria',
        theme_color: '#10b981',
        background_color: '#0b1220',
        display: 'standalone',
        scope: BASE,
        start_url: BASE,
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
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
})
