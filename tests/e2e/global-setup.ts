import { chromium, type FullConfig, type Page } from '@playwright/test'

/**
 * Settles the Vite dev server before any test runs.
 *
 * Vite's dependency scan fails in this repo: the optional auth providers import
 * SDKs that are not installed (@auth0/auth0-react, aws-amplify, @ory/client-fetch,
 * keycloak-js). With the scan skipped, Vite discovers dependencies on first
 * import. On a cold cache the optimizer re-hashes them while a page is loading:
 * the page requests the old `?v=` URLs, Vite answers 504 "Outdated Optimize Dep",
 * and the page goes blank. Visiting every route, signed in, repeats until one
 * full pass sees no stale module responses, so the parallel workers start on
 * settled hashes. If the optimizer never settles, setup fails loudly.
 */
const ROUTES = ['/login', '/', '/users', '/organizations', '/documents']
const MAX_PASSES = 5

function isViteModuleUrl(url: string): boolean {
  const { pathname } = new URL(url)
  return pathname.startsWith('/node_modules/.vite/deps/') || pathname.startsWith('/src/')
}

async function signIn(page: Page, baseURL: string): Promise<void> {
  await page.goto(new URL('/login', baseURL).toString())
  await page.getByRole('button', { name: /sign in/i }).click({ timeout: 15_000 })
  await page.waitForURL(new URL('/', baseURL).toString(), { timeout: 15_000 })
}

export default async function globalSetup(config: FullConfig): Promise<void> {
  const baseURL = config.projects[0]?.use.baseURL
  if (!baseURL) {
    throw new Error('global-setup: no baseURL configured')
  }

  const browser = await chromium.launch()
  try {
    const page = await browser.newPage()
    let stale = 0
    let lastStale = ''
    // Only the 504 counts. A request aborted by our own next navigation
    // (net::ERR_ABORTED) is not a stale module and must not fail the settle check.
    page.on('response', (response) => {
      if (response.status() === 504 && isViteModuleUrl(response.url())) {
        stale++
        lastStale = `504 ${response.url()}`
      }
    })

    for (let pass = 1; pass <= MAX_PASSES; pass++) {
      stale = 0
      try {
        await signIn(page, baseURL)
      } catch {
        // A blank or mid-reload page is a stale pass, not a setup error.
        stale++
      }
      for (const route of ROUTES) {
        await page.goto(new URL(route, baseURL).toString())
        await page.waitForLoadState('networkidle')
      }
      if (stale === 0) return
    }

    throw new Error(
      `global-setup: Vite dependency optimizer did not settle after ${MAX_PASSES} passes (last pass saw ${stale} stale module responses; last: ${lastStale})`
    )
  } finally {
    await browser.close()
  }
}
