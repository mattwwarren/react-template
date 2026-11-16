import { test as unauthenticatedTest } from '@playwright/test'
import { assertAccessible } from './support/axe.mjs'
import { expect, test } from './utils/fixtures'

// Each test title is its scan label; the same label names the screenshot and the axe allowlist entry.
// Scoped scans are preceded by a one-match guard so a selector that matches nothing cannot pass vacuously.

// Sets the dark theme on <html>. A page.goto reload drops the class; SPA clicks do not.
async function enableDarkTheme(page) {
  await page.evaluate(() => document.documentElement.classList.add('dark'))
  await expect(page.locator('html')).toHaveClass(/dark/)
}

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

  // Radix hides the app root while the select is open; scope to the listbox to avoid aria-hidden-focus there.
  test('documents-upload-select-open', async ({ page }) => {
    await page.goto('/documents')
    await expect(page.getByRole('heading', { name: /documents/i })).toBeVisible()
    await page.getByRole('button', { name: /upload document/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByRole('combobox').click()
    await expect(page.getByRole('option')).toHaveCount(5) // 5 mock organizations
    await expect(page.locator('[role="listbox"]')).toHaveCount(1)
    await page.screenshot({ path: 'test-results/a11y-documents-upload-select-open.png' })
    await assertAccessible(page, 'documents-upload-select-open', { within: '[role="listbox"]' })
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

  // Destructive-colour states. Acceptance criteria:
  // - error text and labels, the destructive Delete buttons and the destructive menu item reach 4.5:1
  //   in the light and dark themes;
  // - every state is scanned with its own label, after a screenshot, with no allowlist entry.
  // Radix hides the app root while a dialog or menu is open, so those scans are scoped to the overlay.
  // Each state runs twice: light (unchanged titles and labels) and a `-dark` sibling with the dark class set.
  for (const dark of [false, true]) {
    const sfx = dark ? '-dark' : ''

    test(`users-create-dialog-errors${sfx}`, async ({ page }) => {
      await page.goto('/users')
      await expect(page.getByRole('table')).toBeVisible()
      await page.getByRole('button', { name: /create user/i }).click()
      await expect(page.getByRole('dialog')).toBeVisible()
      // Submit the empty form so the validation messages render in the destructive colour.
      await page
        .getByRole('dialog')
        .getByRole('button', { name: /create user/i })
        .click()
      await expect(page.getByText('Name is required')).toBeVisible()
      await expect(page.getByText('Invalid email address')).toBeVisible()
      await expect(page.locator('[role="dialog"]')).toHaveCount(1)
      if (dark) await enableDarkTheme(page)
      await page.screenshot({ path: `test-results/a11y-users-create-dialog-errors${sfx}.png` })
      await assertAccessible(page, `users-create-dialog-errors${sfx}`, {
        within: '[role="dialog"]',
      })
    })

    test(`user-detail${sfx}`, async ({ page }) => {
      await page.goto('/users')
      await expect(page.getByRole('table')).toBeVisible()
      await page.waitForSelector('table tbody tr')
      await page.locator('table tbody tr').first().locator('a').first().click()
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Delete' })).toBeVisible()
      await expect(page.locator('.animate-pulse')).toHaveCount(0)
      if (dark) await enableDarkTheme(page)
      await page.screenshot({ path: `test-results/a11y-user-detail${sfx}.png` })
      await assertAccessible(page, `user-detail${sfx}`)
    })

    test(`organization-detail${sfx}`, async ({ page }) => {
      await page.goto('/organizations')
      await expect(page.getByRole('table')).toBeVisible()
      await page.waitForSelector('table tbody tr')
      await page.locator('table tbody tr').first().locator('a').first().click()
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Delete' })).toBeVisible()
      await expect(page.locator('.animate-pulse')).toHaveCount(0)
      if (dark) await enableDarkTheme(page)
      await page.screenshot({ path: `test-results/a11y-organization-detail${sfx}.png` })
      await assertAccessible(page, `organization-detail${sfx}`)
    })

    test(`delete-confirm-dialog${sfx}`, async ({ page }) => {
      await page.goto('/users')
      await expect(page.getByRole('table')).toBeVisible()
      await page.waitForSelector('table tbody tr')
      await page
        .locator('table tbody tr')
        .first()
        .getByRole('button', { name: /open menu/i })
        .click()
      await page.getByRole('menuitem', { name: /delete/i }).click()
      await expect(page.getByRole('alertdialog')).toBeVisible()
      await expect(page.locator('[role="alertdialog"]')).toHaveCount(1)
      if (dark) await enableDarkTheme(page)
      await page.screenshot({ path: `test-results/a11y-delete-confirm-dialog${sfx}.png` })
      await assertAccessible(page, `delete-confirm-dialog${sfx}`, {
        within: '[role="alertdialog"]',
      })
    })

    test(`users-row-actions-menu${sfx}`, async ({ page }) => {
      await page.goto('/users')
      await expect(page.getByRole('table')).toBeVisible()
      await page.waitForSelector('table tbody tr')
      await page
        .locator('table tbody tr')
        .first()
        .getByRole('button', { name: /open menu/i })
        .click()
      await expect(page.getByRole('menu')).toBeVisible()
      await expect(page.locator('[role="menu"]')).toHaveCount(1)
      if (dark) await enableDarkTheme(page)
      await page.screenshot({ path: `test-results/a11y-users-row-actions-menu${sfx}.png` })
      await assertAccessible(page, `users-row-actions-menu${sfx}`, { within: '[role="menu"]' })
    })
  }
})
