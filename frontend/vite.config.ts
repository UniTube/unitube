import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // Use the plugin's virtual module (virtual:pwa-register) for SW registration.
      // This is paired with main.tsx importing registerSW from 'virtual:pwa-register'.
      registerType: 'autoUpdate',

      // Pre-cache all static assets produced by the build
      includeAssets: ['favicon.svg', 'images/*.png'],

      manifest: {
        name: 'UniTube',
        short_name: 'UniTube',
        description: 'Watch, upload and stream videos — works offline too.',
        start_url: '/',
        scope: '/',
        display: 'standalone', // Hides browser chrome — feels like a native app
        orientation: 'portrait',
        background_color: '#18181b', // zinc-900 — matches dark theme splash
        theme_color: '#dc2626',     // red-600 — matches brand colour
        icons: [
          {
            // Largest available icon in the project (192×192)
            src: '/images/android-icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            // Maskable variant (same file; browsers will apply safe-zone masking)
            src: '/images/android-icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            // Largest for splash screens / app stores (use the biggest available)
            src: '/images/ms-icon-310x310.png',
            sizes: '310x310',
            type: 'image/png',
            purpose: 'any',
          },
        ],
      },

      workbox: {
        // Pre-cache all JS/CSS/HTML/images produced by the build
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest,woff2}'],

        // Runtime caching strategies
        runtimeCaching: [
          {
            // NetworkFirst for API requests: try fresh data, fall back to cache
            urlPattern: /^https?:\/\/.*\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
              networkTimeoutSeconds: 10,
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // CacheFirst for images: serve from cache instantly, revalidate in background
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // StaleWhileRevalidate for fonts/static assets: fast load + background refresh
            urlPattern: /\.(?:js|css|woff2?)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-assets-cache',
            },
          },
        ],
      },

      devOptions: {
        // Enable PWA in dev mode so you can test service worker behaviour locally
        enabled: true,
        type: 'module',
      },
    }),
  ],
})

