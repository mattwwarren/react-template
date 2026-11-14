import { test as base, expect, type Page } from '@playwright/test'

/**
 * Signs in through the real Sign in form (mock provider). The email field is
 * prefilled with dev@example.com, so only the submit button is clicked.
 * login() persists the user to localStorage, so later page.goto() reloads stay signed in.
 */
export async function signInViaMockProvider(page: Page): Promise<void> {
  await page.goto('/login')
  await page.getByRole('button', { name: /sign in/i }).click()
  await expect(page).toHaveURL('/')
}

/**
 * Use this `test` (not `@playwright/test`'s) in every spec that needs an
 * authenticated session. The `signedIn` fixture is auto, so it runs before each test.
 */
export const test = base.extend<{ signedIn: undefined }>({
  signedIn: [
    async ({ page }, use) => {
      await signInViaMockProvider(page)
      await use(undefined)
    },
    { auto: true },
  ],
})

export { expect } from '@playwright/test'
