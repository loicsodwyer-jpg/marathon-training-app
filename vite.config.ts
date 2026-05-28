import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'service-worker.ts',
      registerType: 'autoUpdate',
      includeAssets: [
        'icons/apple-touch-icon.png',
        'icons/favicon-32.png',
        'icons/favicon-16.png',
        'icons/icon-192.png',
        'icons/icon-512.png',
        'icons/maskable-icon-192.png',
        'icons/maskable-icon-512.png',
        'icons/icon.svg',
        'icons/maskable-icon.svg',
        'offline.html',
      ],
      manifest: {
        name: 'Loïc Marathon 2:55',
        short_name: 'Marathon 2:55',
        description: 'Private marathon training app for the Amsterdam Marathon build.',
        start_url: '.',
        scope: '.',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#050505',
        theme_color: '#050505',
        categories: ['sports', 'health', 'fitness', 'productivity'],
        lang: 'en',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/maskable-icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/icons/maskable-icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        navigateFallback: 'index.html',
        globPatterns: ['**/*.{html,js,css,svg,png,ico,json,txt}'],
      },
      injectManifest: {
        globPatterns: ['**/*.{html,js,css,svg,png,ico,json,txt}'],
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],
})
