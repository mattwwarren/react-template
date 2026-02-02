import { expect, test } from '@playwright/test'

/**
 * Integration smoke tests against a real deployed backend.
 *
 * These tests run against the actual frontend + backend infrastructure,
 * not mocked services. Use `devspace run integration-tests` to execute.
 */
test.describe('Integration Smoke Tests', () => {
  test('should load the application', async ({ page }) => {
    await page.goto('/')

    // Verify the page loads without critical errors
    await expect(page).toHaveTitle(/__PROJECT_NAME__|Dashboard/)
  })

  test('should navigate to users page', async ({ page }) => {
    await page.goto('/users')

    // Verify users page loads (may show empty state or real data)
    await expect(page.locator('h1, [data-testid="users-heading"]')).toBeVisible()
  })
})
