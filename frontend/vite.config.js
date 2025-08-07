import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0',  // Erlaubt externe Verbindungen
    allowedHosts: [
      'ochtii.run.place',
      '18.197.100.102',
      'localhost',
      '.run.place'  // Wildcard für Subdomains
    ],
    proxy: {
      '/api': {
        target: 'http://ochtii.run.place:4000',
        changeOrigin: true
      }
    }
  }
})
