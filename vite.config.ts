import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Consolidado de Ítems XML',
        short_name: 'Ítems XML',
        description: 'Extrae y consolida ítems de facturas electrónicas XML.',
        theme_color: '#E11D48',
        icons: [
          { src: 'pwa-icon.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-icon.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      }
    })
  ],
})
