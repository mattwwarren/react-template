import { expect, test } from '@playwright/test'

test.describe('Navigation', () => {
  test('loads dashboard by default', async ({ page }) => {
    await page.goto('/')

    // Dashboard should be visible
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
  })

  test('navigates to users page', async ({ page }) => {
    await page.goto('/')

    // Click users link in sidebar
    await page.getByRole('link', { name: /users/i }).click()

    // Should be on users page
    await expect(page).toHaveURL('/users')
    await expect(page.getByRole('heading', { name: /users/i })).toBeVisible()
  })

  test('navigates to organizations page', async ({ page }) => {
    await page.goto('/')

    // Click organizations link in sidebar
    await page.getByRole('link', { name: /organizations/i }).click()

    // Should be on organizations page
    await expect(page).toHaveURL('/organizations')
    await expect(page.getByRole('heading', { name: /organizations/i })).toBeVisible()
  })

  test('navigates to documents page', async ({ page }) => {
    await page.goto('/')

    // Click documents link in sidebar
    await page.getByRole('link', { name: /documents/i }).click()

    // Should be on documents page
    await expect(page).toHaveURL('/documents')
    await expect(page.getByRole('heading', { name: /documents/i })).toBeVisible()
  })

  test('shows 404 for unknown routes', async ({ page }) => {
    await page.goto('/unknown-page')

    // Should show not found page
    await expect(page.getByText(/not found/i)).toBeVisible()
  })

  test('can navigate back to dashboard', async ({ page }) => {
    // Start on users page
    await page.goto('/users')

    // Click dashboard link
    await page.getByRole('link', { name: /dashboard/i }).click()

    // Should be on dashboard
    await expect(page).toHaveURL('/')
  })

  test('sidebar has all navigation links', async ({ page }) => {
    await page.goto('/')

    // All main navigation links should be visible
    await expect(page.getByRole('link', { name: /dashboard/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /users/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /organizations/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /documents/i })).toBeVisible()
  })
})
