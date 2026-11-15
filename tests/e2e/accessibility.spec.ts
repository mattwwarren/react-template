import { test as unauthenticatedTest } from '@playwright/test'
import { assertAccessible } from './support/axe.mjs'
import { expect, test } from './utils/fixtures'

// Each test title is its scan label; the same label names the screenshot and the axe allowlist entry.
// Scoped scans are preceded by a one-match guard so a selector that matches nothing cannot pass vacuously.
test.describe('Accessibility', () => {
  unauthenticatedTest('login', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
    await page.screenshot({ path: 'test-results/a11y-login.png' })
    await assertAccessible(page, 'login')
  })

  test('dashboard', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
    // Skeleton is the only user of animate-pulse: none left means the stats have loaded.
    await expect(page.locator('.animate-pulse')).toHaveCount(0)
    await page.screenshot({ path: 'test-results/a11y-dashboard.png' })
    await assertAccessible(page, 'dashboard')
  })

  test('users-list', async ({ page }) => {
    await page.goto('/users')
    await expect(page.getByRole('table')).toBeVisible()
    await page.waitForSelector('table tbody tr')
    await page.screenshot({ path: 'test-results/a11y-users-list.png' })
    await assertAccessible(page, 'users-list')
  })

  test('organizations-list', async ({ page }) => {
    await page.goto('/organizations')
    await expect(page.getByRole('table')).toBeVisible()
    await page.waitForSelector('table tbody tr')
    await page.screenshot({ path: 'test-results/a11y-organizations-list.png' })
    await assertAccessible(page, 'organizations-list')
  })

  test('documents', async ({ page }) => {
    await page.goto('/documents')
    await expect(page.getByRole('heading', { name: /documents/i })).toBeVisible()
    await page.screenshot({ path: 'test-results/a11y-documents.png' })
    await assertAccessible(page, 'documents')
  })

  test('users-create-dialog', async ({ page }) => {
    await page.goto('/users')
    await expect(page.getByRole('table')).toBeVisible()
    await page.getByRole('button', { name: /create user/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.screenshot({ path: 'test-results/a11y-users-create-dialog.png' })
    await assertAccessible(page, 'users-create-dialog')
  })

  test('organizations-create-dialog', async ({ page }) => {
    await page.goto('/organizations')
    await expect(page.getByRole('table')).toBeVisible()
    await page.getByRole('button', { name: /create organization/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.screenshot({ path: 'test-results/a11y-organizations-create-dialog.png' })
    await assertAccessible(page, 'organizations-create-dialog')
  })

  test('documents-upload-dialog', async ({ page }) => {
    await page.goto('/documents')
    await expect(page.getByRole('heading', { name: /documents/i })).toBeVisible()
    await page.getByRole('button', { name: /upload document/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.screenshot({ path: 'test-results/a11y-documents-upload-dialog.png' })
    await assertAccessible(page, 'documents-upload-dialog')
  })

  // Unscoped first (plan A2). If axe reports aria-hidden-focus on the app root, scope to the listbox.
  test('documents-upload-select-open', async ({ page }) => {
    await page.goto('/documents')
    await expect(page.getByRole('heading', { name: /documents/i })).toBeVisible()
    await page.getByRole('button', { name: /upload document/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByRole('combobox').click()
    await expect(page.getByRole('option')).toHaveCount(5) // 5 mock organizations
    await page.screenshot({ path: 'test-results/a11y-documents-upload-select-open.png' })
    await assertAccessible(page, 'documents-upload-select-open')
  })

  test('user-menu', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
    // Header-scoped: the initials trigger is the last aria-haspopup="menu" button in the header.
    await page.locator('header button[aria-haspopup="menu"]').last().click()
    await expect(page.getByRole('menu')).toBeVisible()
    await expect(page.locator('[role="menu"]')).toHaveCount(1)
    await page.screenshot({ path: 'test-results/a11y-user-menu.png' })
    await assertAccessible(page, 'user-menu', { within: '[role="menu"]' })
  })

  test('org-switcher-menu', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
    await page
      .locator('header')
      .getByRole('button', { name: /select organization/i })
      .click()
    await expect(page.getByRole('menu')).toBeVisible()
    await expect(page.locator('[role="menu"]')).toHaveCount(1)
    await page.screenshot({ path: 'test-results/a11y-org-switcher-menu.png' })
    await assertAccessible(page, 'org-switcher-menu', { within: '[role="menu"]' })
  })

  test('user-detail-back-link', async ({ page }) => {
    await page.goto('/users')
    await expect(page.getByRole('table')).toBeVisible()
    await page.waitForSelector('table tbody tr')
    await page.locator('table tbody tr').first().locator('a').first().click()
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.locator('main a[href="/users"]')).toHaveCount(1)
    await page.screenshot({ path: 'test-results/a11y-user-detail-back-link.png' })
    await assertAccessible(page, 'user-detail-back-link', { within: 'main a[href="/users"]' })
  })

  test('organization-detail-back-link', async ({ page }) => {
    await page.goto('/organizations')
    await expect(page.getByRole('table')).toBeVisible()
    await page.waitForSelector('table tbody tr')
    await page.locator('table tbody tr').first().locator('a').first().click()
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.locator('main a[href="/organizations"]')).toHaveCount(1)
    await page.screenshot({ path: 'test-results/a11y-organization-detail-back-link.png' })
    await assertAccessible(page, 'organization-detail-back-link', {
      within: 'main a[href="/organizations"]',
    })
  })
})
