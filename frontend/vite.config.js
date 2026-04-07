import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss()],
  base: './',
   server: {
    host: true,
    strictPort: false,
    allowedHosts: ["shipment-tracker-yk97.onrender.com"],
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: false,
    allowedHosts: ["shipment-tracker-yk97.onrender.com"],
  }
})

