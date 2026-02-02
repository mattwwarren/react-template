import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true, // Allow external access for Docker
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL ?? 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (reqPath) => reqPath.replace(/^\/api/, ''),
      },
    },
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      // Mark optional auth SDKs as external - they are installed conditionally
      // based on the selected auth provider during project generation
      external: [
        '@ory/client-fetch',
        '@auth0/auth0-react',
        'keycloak-js',
        'aws-amplify',
        'aws-amplify/auth',
      ],
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          query: ['@tanstack/react-query'],
        },
      },
    },
  },
})
