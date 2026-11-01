import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // Raise warning threshold to 600 kB so the firebase chunk doesn't warn
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          // Firebase SDK (largest dep — isolated for long-term caching)
          'vendor-firebase': [
            'firebase/app',
            'firebase/firestore',
            'firebase/auth',
          ],
          // Google Maps React wrapper
          'vendor-maps': ['@react-google-maps/api'],
          // React core
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Charting + utils
          'vendor-ui': ['recharts', 'lucide-react', 'date-fns'],
        },
      },
    },
  },
})
