# Testing Guide

This template includes a comprehensive test suite with production-grade patterns. This guide explains the testing architecture and how to extend it.

## Test Architecture

### Test Infrastructure

Tests use:
- **Vitest**: Fast test framework with native TypeScript support
- **Testing Library**: DOM testing utilities (React Testing Library)
- **MSW**: Mock Service Worker for API mocking
- **Playwright**: Browser-based E2E testing
- **Mock Data**: Seeded Faker.js factories for deterministic data

### Test Setup

**Key files:**

- `vitest.config.ts`: Vitest configuration with React plugin
- `src/test/setup.ts`: Global setup (MSW, cleanup, custom matchers)
- `src/mocks/browser.ts`: MSW browser worker setup
- `src/mocks/handlers/`: MSW request handlers by domain
- `src/mocks/factories/`: Faker.js data factories
- `playwright.config.ts`: Playwright E2E configuration

**Why MSW?**
- Intercepts requests at the network level (not mocking fetch)
- Same handlers work in dev mode, unit tests, and E2E tests
- Tests real fetch/TanStack Query behavior
- Factories provide consistent test data (seeded with 12345)

---

## Test Organization

### Test Structure: AAA Pattern

All tests follow Arrange-Act-Assert:

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserList } from './UserList';

describe('UserList', () => {
  it('displays users from API', async () => {
    // Arrange
    const user = userEvent.setup();

    // Act
    render(<UserList />);

    // Assert
    expect(await screen.findByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });
});
```

### Test Organization by Feature

Each feature has colocated test files:

**features/users/**
- `UserList.test.tsx`: List rendering, pagination, loading states
- `UserForm.test.tsx`: Form validation, submission, error handling
- `UserCard.test.tsx`: Card display, actions

**features/auth/**
- `Login.test.tsx`: Login form, validation, redirect
- `ProtectedRoute.test.tsx`: Authentication guards

**hooks/**
- `useUsers.test.tsx`: TanStack Query hook testing
- `usePagination.test.tsx`: Pagination logic

---

## Unit Testing Patterns

### Component Testing with MSW

MSW handlers are active in test environment:

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { UserList } from './UserList';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

describe('UserList', () => {
  beforeEach(() => {
    queryClient.clear();
  });

  it('fetches and displays users', async () => {
    render(<UserList />, { wrapper: Wrapper });

    // Loading state
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Data loaded (from MSW mock)
    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });
  });
});
```

### TanStack Query Hook Testing

Test hooks with `renderHook`:

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useUsers } from './useUsers';
import { Wrapper } from '@/test/utils';

describe('useUsers', () => {
  it('fetches paginated users', async () => {
    const { result } = renderHook(() => useUsers({ page: 1 }), {
      wrapper: Wrapper,
    });

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    // Wait for data
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.items).toHaveLength(10);
    expect(result.current.data?.total).toBe(25);
  });
});
```

### Form Testing

Test form validation and submission:

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserForm } from './UserForm';

describe('UserForm', () => {
  it('validates required fields', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<UserForm onSubmit={onSubmit} />);

    // Submit empty form
    await user.click(screen.getByRole('button', { name: /submit/i }));

    // Validation errors shown
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits valid data', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<UserForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/email/i), 'jane@example.com');
    await user.type(screen.getByLabelText(/name/i), 'Jane Doe');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      email: 'jane@example.com',
      name: 'Jane Doe',
    });
  });
});
```

---

## E2E Testing with Playwright

### Configuration

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:5173',
  },
  webServer: {
    command: 'npm run dev:mock',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

### E2E Test Pattern

```typescript
// e2e/users.spec.ts
import { test, expect } from '@playwright/test';

test.describe('User Management', () => {
  test('can create a new user', async ({ page }) => {
    // Navigate to users page
    await page.goto('/users');

    // Click create button
    await page.click('button:has-text("Create User")');

    // Fill form
    await page.fill('[name="email"]', 'newuser@example.com');
    await page.fill('[name="name"]', 'New User');

    // Submit
    await page.click('button:has-text("Save")');

    // Verify created
    await expect(page.locator('text=New User')).toBeVisible();
  });

  test('can paginate user list', async ({ page }) => {
    await page.goto('/users');

    // Verify first page
    await expect(page.locator('.user-card')).toHaveCount(10);

    // Go to next page
    await page.click('button:has-text("Next")');

    // Verify different users
    await expect(page.locator('.user-card')).toHaveCount(10);
  });
});
```

---

## Running Tests

### Unit Tests

```bash
# Run all unit tests
npm test

# Run with coverage
npm run test:coverage

# Run specific file
npm test -- UserList.test.tsx

# Watch mode
npm test -- --watch
```

### E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI
npm run test:e2e -- --ui

# Run specific test file
npm run test:e2e -- users.spec.ts

# Debug mode
npm run test:e2e -- --debug
```

---

## Coverage Requirements

| Category | Target |
|----------|--------|
| Statements | 80% |
| Branches | 75% |
| Functions | 80% |
| Lines | 80% |

**Focus areas:**
- All user-facing components
- All TanStack Query hooks
- Form validation logic
- Error boundaries

**Excluded from coverage:**
- Generated types (`src/api/generated/`)
- Mock factories (`src/mocks/factories/`)
- Test utilities

---

## Best Practices

### Do

- Use `screen` queries (not destructured from render)
- Use `userEvent` over `fireEvent` for realistic interactions
- Test behavior, not implementation details
- Use `waitFor` for async assertions
- Test error states and loading states
- Use `vi.fn()` for callback assertions

### Don't

- Don't mock TanStack Query directly (use MSW)
- Don't test internal component state
- Don't use `getByTestId` when role/text queries work
- Don't skip loading/error state tests
- Don't write E2E tests for unit-testable logic

---

## Related Files

- [CLAUDE.md](CLAUDE.md) - Development patterns
- [AGENTS.md](AGENTS.md) - Quick reference
- [CONFIGURATION-GUIDE.md](CONFIGURATION-GUIDE.md) - Environment setup
