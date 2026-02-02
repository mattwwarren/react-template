import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright configuration for integration tests against real backend.
 *
 * Unlike the E2E config (playwright.config.ts) which uses MSW mocks,
 * this config runs tests against a real backend deployed via DevSpace.
 */
export default defineConfig({
  testDir: './tests/integration',

  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,

  reporter: [['html', { outputFolder: 'playwright-integration-report' }], ['list']],

  use: {
    // Connect to real backend via port-forward
    baseURL: process.env.FRONTEND_URL || 'http://localhost:5173',

    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // No webServer - frontend is already running in Kubernetes
  // DevSpace pipeline handles port-forwarding
})
