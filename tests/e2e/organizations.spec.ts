import { test, expect } from '@playwright/test'
import { DIALOG_TIMEOUT } from './utils/constants'

test.describe('Organizations', () => {
  test('displays organizations list', async ({ page }) => {
    await page.goto('/organizations')

    // Page title should be visible
    await expect(page.getByRole('heading', { name: /organizations/i })).toBeVisible()

    // Table should be visible with data
    await expect(page.getByRole('table')).toBeVisible()

    // Wait for data to load - should have multiple rows
    await page.waitForSelector('table tbody tr')
    const rowCount = await page.locator('table tbody tr').count()
    expect(rowCount).toBeGreaterThan(0)
  })

  test('shows organization details by clicking name', async ({ page }) => {
    await page.goto('/organizations')

    // Wait for data to load
    await expect(page.getByRole('table')).toBeVisible()
    await page.waitForSelector('table tbody tr')

    // Click on first organization name link
    const firstOrgLink = page.locator('table tbody tr').first().locator('a').first()
    await firstOrgLink.click()

    // Should navigate to detail page
    await expect(page).toHaveURL(/\/organizations\//)
  })

  test('can create new organization and dialog closes', async ({ page }) => {
    await page.goto('/organizations')

    // Click create button
    await page.getByRole('button', { name: /create organization/i }).click()

    // Dialog should open
    await expect(page.getByRole('dialog')).toBeVisible()

    // Fill form
    await page.getByLabel(/name/i).fill('E2E Test Org')

    // Submit - clicking the submit button inside dialog
    await page.locator('[role="dialog"] button[type="submit"]').click()

    // Dialog should close after successful submission
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: DIALOG_TIMEOUT })
  })

  test('validates organization form', async ({ page }) => {
    await page.goto('/organizations')

    // Click create button
    await page.getByRole('button', { name: /create organization/i }).click()

    // Try to submit empty form
    await page.locator('[role="dialog"] button[type="submit"]').click()

    // Validation error should appear
    await expect(page.getByText(/name is required/i)).toBeVisible()
  })

  test('shows data in table cells', async ({ page }) => {
    await page.goto('/organizations')

    // Wait for data to load
    await expect(page.getByRole('table')).toBeVisible()
    await page.waitForSelector('table tbody tr')

    // Table should have cells with content
    const cells = page.locator('table tbody td')
    const cellCount = await cells.count()
    expect(cellCount).toBeGreaterThan(0)
  })
})
