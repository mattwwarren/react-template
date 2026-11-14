import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright configuration for E2E tests.
 * @see https://playwright.dev/docs/test-configuration
 *
 * E2E_PORT overrides the dev-server port (default 5173). Set it to a free port
 * when 5173 is busy; a port set this way never reuses an existing server.
 */
const PORT = Number(process.env.E2E_PORT ?? 5173)
const BASE_URL = `http://localhost:${PORT}`

export default defineConfig({
  // Directory containing test files
  testDir: './tests/e2e',

  // Warms the Vite dev server (dependency pre-bundling) before workers start
  globalSetup: './tests/e2e/global-setup.ts',

  // Run tests in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter to use
  reporter: [['html', { outputFolder: 'playwright-report' }], ['list']],

  // Shared settings for all projects
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: BASE_URL,

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Take screenshot on failure
    screenshot: 'only-on-failure',
  },

  // Configure projects for different browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Enable Firefox/WebKit on CI or when E2E_ALL_BROWSERS is set
    ...(process.env.CI || process.env.E2E_ALL_BROWSERS
      ? [
          {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] },
          },
          {
            name: 'webkit',
            use: { ...devices['Desktop Safari'] },
          },
        ]
      : []),
  ],

  // Run dev server before starting the tests
  webServer: {
    command: `npm run dev:mock -- --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI && !process.env.E2E_PORT,
    timeout: 120 * 1000, // 2 minutes to start
  },
})
