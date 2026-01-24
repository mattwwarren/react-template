---
description: Generate Playwright E2E tests for a React feature
argument-hint: <feature-or-flow-description>
---

# Generate Playwright E2E Tests

Generate end-to-end tests using Playwright for a React feature or user flow.

## Usage

```bash
/react-e2e "user can create and edit their profile"
/react-e2e "admin can manage organization members"
/react-e2e "document upload and download flow"
```

## Generated Files

```
tests/e2e/
├── pages/
│   └── <feature>.page.ts     # Page Object Model
└── <feature>.spec.ts         # Test specifications
```

## Page Object Model Template

```typescript
// tests/e2e/pages/users.page.ts
import { Page, Locator } from '@playwright/test'

export class UsersPage {
  readonly page: Page
  readonly heading: Locator
  readonly searchInput: Locator
  readonly createButton: Locator
  readonly userTable: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: /users/i })
    this.searchInput = page.getByRole('searchbox', { name: /search/i })
    this.createButton = page.getByRole('button', { name: /create user/i })
    this.userTable = page.getByRole('table')
  }

  async goto() {
    await this.page.goto('/users')
    await this.heading.waitFor()
  }

  async search(query: string) {
    await this.searchInput.fill(query)
    await this.searchInput.press('Enter')
  }

  async clickCreate() {
    await this.createButton.click()
  }

  async getUserRows() {
    return this.userTable.getByRole('row').filter({
      has: this.page.getByRole('cell'),
    })
  }

  async selectUser(name: string) {
    await this.page.getByRole('row', { name }).click()
  }
}
```

## Test Specification Template

```typescript
// tests/e2e/users.spec.ts
import { test, expect } from '@playwright/test'
import { UsersPage } from './pages/users.page'

test.describe('Users Management', () => {
  let usersPage: UsersPage

  test.beforeEach(async ({ page }) => {
    usersPage = new UsersPage(page)
    await usersPage.goto()
  })

  test('displays list of users', async () => {
    await expect(usersPage.heading).toBeVisible()
    const rows = await usersPage.getUserRows()
    await expect(rows).toHaveCount.greaterThan(0)
  })

  test('filters users by search', async () => {
    await usersPage.search('john')

    const rows = await usersPage.getUserRows()
    for (const row of await rows.all()) {
      await expect(row).toContainText(/john/i)
    }
  })

  test('navigates to create user form', async ({ page }) => {
    await usersPage.clickCreate()

    await expect(page).toHaveURL(/\/users\/new/)
    await expect(page.getByRole('heading', { name: /create user/i })).toBeVisible()
  })

  test('can create a new user', async ({ page }) => {
    await usersPage.clickCreate()

    // Fill form
    await page.getByLabel(/name/i).fill('Test User')
    await page.getByLabel(/email/i).fill('test@example.com')
    await page.getByRole('button', { name: /save/i }).click()

    // Verify redirect and success
    await expect(page).toHaveURL(/\/users$/)
    await expect(page.getByText('User created successfully')).toBeVisible()
  })
})
```

## Authentication Flow Template

```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/dashboard')

    await expect(page).toHaveURL(/\/login/)
  })

  test('allows login with valid credentials', async ({ page }) => {
    await page.goto('/login')

    await page.getByLabel(/email/i).fill('user@example.com')
    await page.getByLabel(/password/i).fill('password123')
    await page.getByRole('button', { name: /sign in/i }).click()

    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.getByText(/welcome/i)).toBeVisible()
  })

  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login')

    await page.getByLabel(/email/i).fill('wrong@example.com')
    await page.getByLabel(/password/i).fill('wrongpassword')
    await page.getByRole('button', { name: /sign in/i }).click()

    await expect(page.getByRole('alert')).toContainText(/invalid/i)
  })
})
```

## CRUD Flow Template

```typescript
// tests/e2e/crud-flow.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Document CRUD Operations', () => {
  test('complete document lifecycle', async ({ page }) => {
    // CREATE
    await page.goto('/documents')
    await page.getByRole('button', { name: /upload/i }).click()
    await page.getByLabel(/file/i).setInputFiles('fixtures/sample.pdf')
    await page.getByRole('button', { name: /upload/i }).click()
    await expect(page.getByText('Document uploaded')).toBeVisible()

    // READ
    await expect(page.getByRole('link', { name: /sample.pdf/i })).toBeVisible()

    // UPDATE
    await page.getByRole('row', { name: /sample.pdf/i }).getByRole('button', { name: /edit/i }).click()
    await page.getByLabel(/description/i).fill('Updated description')
    await page.getByRole('button', { name: /save/i }).click()
    await expect(page.getByText('Document updated')).toBeVisible()

    // DELETE
    await page.getByRole('row', { name: /sample.pdf/i }).getByRole('button', { name: /delete/i }).click()
    await page.getByRole('button', { name: /confirm/i }).click()
    await expect(page.getByText('Document deleted')).toBeVisible()
    await expect(page.getByRole('link', { name: /sample.pdf/i })).not.toBeVisible()
  })
})
```

## E2E Test Patterns

### Use Semantic Locators
```typescript
// Prefer
page.getByRole('button', { name: /submit/i })
page.getByLabel('Email')
page.getByText('Success')

// Avoid
page.locator('#submit-btn')
page.locator('.email-input')
page.locator('[data-testid="success"]')
```

### Wait for Network
```typescript
// Wait for API response
await Promise.all([
  page.waitForResponse('**/api/users'),
  page.getByRole('button', { name: /save/i }).click(),
])
```

### Handle Async UI
```typescript
// Wait for element
await expect(page.getByRole('alert')).toBeVisible({ timeout: 5000 })

// Wait for element to disappear
await expect(page.getByRole('progressbar')).not.toBeVisible()
```

## Test Configuration

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './tests/e2e',
  webServer: {
    command: 'npm run dev:mock',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
})
```

## Checklist

- [ ] Page Object Model used
- [ ] Semantic locators preferred
- [ ] AAA pattern followed
- [ ] Network waits where needed
- [ ] Error scenarios covered
- [ ] Mobile viewport tested
- [ ] Accessibility assertions included

---

**After generation:** Run `npm run test:e2e` to verify tests pass.
