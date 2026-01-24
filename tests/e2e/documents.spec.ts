import { test, expect } from '@playwright/test'

test.describe('Documents', () => {
  test('displays documents page', async ({ page }) => {
    await page.goto('/documents')

    // Page title should be visible
    await expect(page.getByRole('heading', { name: /documents/i })).toBeVisible()

    // Description should be visible
    await expect(page.getByText(/manage files and documents/i)).toBeVisible()
  })

  test('shows upload button', async ({ page }) => {
    await page.goto('/documents')

    // Upload button should be visible in header
    await expect(page.getByRole('button', { name: /upload document/i })).toBeVisible()
  })

  test('opens upload dialog', async ({ page }) => {
    await page.goto('/documents')

    // Click upload button
    await page.getByRole('button', { name: /upload document/i }).click()

    // Dialog should open
    await expect(page.getByRole('dialog')).toBeVisible()

    // Dialog should have title
    await expect(page.getByText(/upload document/i)).toBeVisible()

    // Organization selector should be present
    await expect(page.getByText(/organization/i)).toBeVisible()

    // File input should be present
    await expect(page.getByText(/file/i)).toBeVisible()
  })

  test('can close upload dialog', async ({ page }) => {
    await page.goto('/documents')

    // Open dialog
    await page.getByRole('button', { name: /upload document/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible()

    // Close by pressing escape
    await page.keyboard.press('Escape')

    // Dialog should close
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })

  test('shows organization selector in upload dialog', async ({ page }) => {
    await page.goto('/documents')

    // Open upload dialog
    await page.getByRole('button', { name: /upload document/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible()

    // Click the organization selector trigger
    await page.getByRole('combobox').click()

    // Organizations dropdown should appear with options (from MSW mock data)
    await expect(page.getByRole('option')).toHaveCount(5) // 5 mock organizations
  })

  test('validates organization selection on upload', async ({ page }) => {
    await page.goto('/documents')

    // Open upload dialog
    await page.getByRole('button', { name: /upload document/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible()

    // Try to submit without selecting organization
    await page.getByRole('button', { name: /^upload$/i }).click()

    // Validation error should appear
    await expect(page.getByText(/organization is required/i)).toBeVisible()
  })

  test('shows cards with document information', async ({ page }) => {
    await page.goto('/documents')

    // Should show informational cards
    await expect(page.getByText(/all documents/i)).toBeVisible()
    await expect(page.getByText(/upload documents/i)).toBeVisible()
    await expect(page.getByText(/organization documents/i)).toBeVisible()
  })

  test('alternate upload button opens dialog', async ({ page }) => {
    await page.goto('/documents')

    // Click the alternate upload button in the card
    await page.getByRole('button', { name: /choose file to upload/i }).click()

    // Dialog should open
    await expect(page.getByRole('dialog')).toBeVisible()
  })
})
