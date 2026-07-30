import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['mammoth'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('node_modules/jszip') || id.includes('node_modules/pako')) {
            return 'document-zip';
          }
          if (id.includes('node_modules/@xmldom') || id.includes('node_modules/xmlbuilder')) {
            return 'document-xml';
          }
          if (id.includes('node_modules/mammoth') || id.includes('node_modules/bluebird')) {
            return 'document-preview';
          }
          if (id.includes('node_modules/recharts')) {
            return 'charts';
          }
          if (id.includes('node_modules/d3-') || id.includes('node_modules/internmap')) {
            return 'charts-d3';
          }
        },
      },
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  }
})
