import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          // Stable vendor chunk — rarely changes between deploys, long cache TTL
          vendor: ['react', 'react-dom', 'react-router-dom'],
          query: ['@tanstack/react-query'],
          virtual: ['@tanstack/react-virtual'],
          http: ['axios', 'zustand'],
        },
      },
    },
  },
})
