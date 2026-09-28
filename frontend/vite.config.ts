import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true, // listen on localhost + 127.0.0.1 (+ LAN), avoids ::1-only binding
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
  // ---- production build -------------------------------------------------
  build: {
    // Route-level splitting (see src/App.tsx) already pulls heavy optional
    // deps out of the entry chunk. These vendor chunks keep long-lived,
    // rarely-changing third-party code separate from app code so a deploy
    // doesn't invalidate them in the browser cache.
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return

          const inNodeModules = (name: string) =>
            id.includes(`node_modules/${name}/`) || id.includes(`node_modules\\${name}\\`)

          // charts + their deps: only AnalyticsPage imports recharts
          if (
            id.includes('recharts') ||
            id.includes('victory-vendor') ||
            /node_modules[\\/](d3-[a-z-]+|internmap|delaunator|robust-predicates)[\\/]/.test(id)
          ) {
            return 'charts'
          }
          if (inNodeModules('lucide-react')) return 'icons'
          if (id.includes('@tanstack')) return 'tanstack'
          // must run before the react check below
          if (id.includes('react-router') || id.includes('@remix-run')) return 'router'
          if (
            inNodeModules('react') ||
            inNodeModules('react-dom') ||
            inNodeModules('scheduler')
          ) {
            return 'react'
          }
          return 'vendor'
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
} as any)
