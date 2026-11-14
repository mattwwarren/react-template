import { chromium, type FullConfig } from '@playwright/test'

/**
 * Warms the Vite dev server before any test runs.
 *
 * Vite's dependency scan fails in this repo: the optional auth providers import
 * SDKs that are not installed (@auth0/auth0-react, aws-amplify, @ory/client-fetch,
 * keycloak-js). With the scan skipped, Vite discovers dependencies lazily on the
 * first visit to each route and reloads the page mid-test
 * ("optimized dependencies changed. reloading"). On a cold cache that reload
 * blanks the page under test. Visiting every route once here, signed in, lets
 * the optimizer finish before the parallel workers start.
 */
export default async function globalSetup(config: FullConfig): Promise<void> {
  const baseURL = config.projects[0]?.use.baseURL
  if (!baseURL) {
    throw new Error('global-setup: no baseURL configured')
  }

  const routes = ['/login', '/', '/users', '/organizations', '/documents']
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage()

    await page.goto(new URL('/login', baseURL).toString())
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForURL(new URL('/', baseURL).toString())

    for (let pass = 0; pass < 2; pass++) {
      for (const route of routes) {
        await page.goto(new URL(route, baseURL).toString())
        await page.waitForLoadState('networkidle')
      }
    }
  } finally {
    await browser.close()
  }
}
