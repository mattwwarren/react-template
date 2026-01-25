import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    // Mark optional auth SDKs as external - they are installed conditionally
    server: {
      deps: {
        external: [
          '@ory/client-fetch',
          '@auth0/auth0-react',
          'keycloak-js',
          'aws-amplify',
          'aws-amplify/auth',
        ],
      },
    },
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
      exclude: [
        'node_modules/',
        'src/components/ui/**', // shadcn components
        'src/mocks/**',
        '**/*.test.{ts,tsx}',
        '**/__tests__/**',
        'src/test/**',
        '**/*.d.ts',
      ],
    },
  },
})
