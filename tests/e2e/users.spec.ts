import { test, expect } from '@playwright/test'

test.describe('Users', () => {
  test('displays users list', async ({ page }) => {
    await page.goto('/users')

    // Page title should be visible
    await expect(page.getByRole('heading', { name: /users/i })).toBeVisible()

    // Table should be visible with data
    await expect(page.getByRole('table')).toBeVisible()

    // Wait for data to load - should have multiple rows
    await page.waitForSelector('table tbody tr')
    const rowCount = await page.locator('table tbody tr').count()
    expect(rowCount).toBeGreaterThan(0)
  })

  test('shows pagination controls', async ({ page }) => {
    await page.goto('/users')

    // Wait for data to load
    await expect(page.getByRole('table')).toBeVisible()

    // Pagination should be visible (25 mock users, 10 per page = 3 pages)
    await expect(page.getByText(/page 1 of/i)).toBeVisible()
  })

  test('can navigate to next page', async ({ page }) => {
    await page.goto('/users')

    // Wait for initial load
    await expect(page.getByText(/page 1 of/i)).toBeVisible()

    // Click next button
    await page.getByRole('button', { name: /next/i }).click()

    // Should show page 2
    await expect(page.getByText(/page 2 of/i)).toBeVisible()
  })

  test('opens create user dialog', async ({ page }) => {
    await page.goto('/users')

    // Click create button
    await page.getByRole('button', { name: /create user/i }).click()

    // Dialog should open
    await expect(page.getByRole('dialog')).toBeVisible()

    // Form fields should be present
    await expect(page.getByLabel(/name/i)).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
  })

  test('creates a new user and dialog closes', async ({ page }) => {
    await page.goto('/users')

    // Open create dialog
    await page.getByRole('button', { name: /create user/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible()

    // Fill form
    await page.getByLabel(/name/i).fill('E2E Test User')
    await page.getByLabel(/email/i).fill('e2e-test@example.com')

    // Submit - clicking the submit button inside dialog
    await page.locator('[role="dialog"] button[type="submit"]').click()

    // Dialog should close after successful submission
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 })
  })

  test('validates form on create', async ({ page }) => {
    await page.goto('/users')

    // Open create dialog
    await page.getByRole('button', { name: /create user/i }).click()

    // Try to submit empty form
    await page.locator('[role="dialog"] button[type="submit"]').click()

    // Validation error should appear
    await expect(page.getByText(/name is required/i)).toBeVisible()
  })

  test('can view user detail by clicking name', async ({ page }) => {
    await page.goto('/users')

    // Wait for data to load
    await expect(page.getByRole('table')).toBeVisible()
    await page.waitForSelector('table tbody tr')

    // Click on first user name link (the name column contains a link)
    const firstUserLink = page.locator('table tbody tr').first().locator('a').first()
    await firstUserLink.click()

    // Should navigate to detail page
    await expect(page).toHaveURL(/\/users\//)

    // User details should be visible
    await expect(page.getByRole('heading')).toBeVisible()
  })

  test('shows actions dropdown menu', async ({ page }) => {
    await page.goto('/users')

    // Wait for data to load
    await expect(page.getByRole('table')).toBeVisible()
    await page.waitForSelector('table tbody tr')

    // Click the actions button (three dots menu)
    const actionsButton = page.locator('table tbody tr').first().getByRole('button')
    await actionsButton.click()

    // Dropdown should be visible with options
    await expect(page.getByRole('menuitem', { name: /view details/i })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: /edit/i })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: /delete/i })).toBeVisible()
  })
})
