# Testing Philosophy - {{ project_name }}

This document outlines the testing philosophy and patterns for the {{ project_slug }} project.

## Testing Pyramid

```
        /\
       /E2E\        <- Playwright (10-20%)
      /------\
     /Integration\  <- RTL + MSW (30-40%)
    /--------------\
   /      Unit      \ <- Vitest (40-50%)
  /------------------\
```

## Test Tools

| Tool | Purpose |
|------|---------|
| **Vitest** | Unit tests, fast, Vite-native |
| **React Testing Library** | Component testing, user-centric |
| **MSW** | API mocking, network isolation |
| **Playwright** | E2E tests, cross-browser |

## When to Use Each Test Type

### Unit Tests (Vitest)
- Pure utility functions
- Custom hooks (with renderHook)
- State logic
- Data transformations

### Integration Tests (RTL + MSW)
- Component behavior with API calls
- Form submissions
- User interactions
- Error handling

### E2E Tests (Playwright)
- Critical user flows
- Authentication
- Multi-page workflows
- Cross-browser verification

## React Testing Library Principles

### Query Priority

Use queries in this order (most to least preferred):

1. **getByRole** - Accessible elements (buttons, links, headings)
2. **getByLabelText** - Form elements with labels
3. **getByPlaceholderText** - Inputs without labels
4. **getByText** - Non-interactive content
5. **getByDisplayValue** - Current input value
6. **getByAltText** - Images
7. **getByTitle** - Title attribute
8. **getByTestId** - Last resort only

### User-Centric Testing

```typescript
// Prefer user-centric queries
screen.getByRole('button', { name: /submit/i })
screen.getByLabelText(/email/i)

// Avoid implementation details
container.querySelector('.submit-btn')  // Bad
wrapper.find('Button')                   // Bad
```

### Async Testing

```typescript
// Wait for element to appear
await screen.findByText('Success')

// Wait for element to disappear
await waitForElementToBeRemoved(() => screen.queryByRole('progressbar'))

// Wait for multiple assertions
await waitFor(() => {
  expect(screen.getByRole('list')).toBeInTheDocument()
  expect(screen.getAllByRole('listitem')).toHaveLength(3)
})
```

## MSW Patterns

### Handler Reset

Always reset handlers between tests:

```typescript
beforeEach(() => {
  server.resetHandlers()
  resetMockData()
})
```

### Error Simulation

```typescript
it('shows error when API fails', async () => {
  server.use(
    http.get('*/users', () => {
      return HttpResponse.json({ detail: 'Server error' }, { status: 500 })
    })
  )

  render(<UserList />)
  await screen.findByRole('alert')
  expect(screen.getByText(/server error/i)).toBeInTheDocument()
})
```

### Network Delay

```typescript
server.use(
  http.get('*/users', async () => {
    await delay(1000) // Simulate slow network
    return HttpResponse.json(mockUsers)
  })
)
```

## Test Isolation

### Data Factories

Use Faker.js with seeding for reproducible data:

```typescript
import { faker } from '@faker-js/faker'

faker.seed(12345) // Always same data

export function createUser(overrides = {}) {
  return {
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    ...overrides,
  }
}
```

### Reset Between Tests

```typescript
// src/test/setup.ts
beforeEach(() => {
  server.resetHandlers()
  resetMockData()
  vi.clearAllMocks()
})
```

## Coverage Requirements

| Metric | Threshold |
|--------|-----------|
| Lines | 80% |
| Functions | 80% |
| Branches | 80% |
| Statements | 80% |

Critical paths (auth, payments) should have 90%+ coverage.

## AAA Pattern

Every test should follow Arrange-Act-Assert:

```typescript
test('displays user name', async () => {
  // Arrange
  const user = createUser({ name: 'John Doe' })
  render(<UserCard user={user} />)

  // Act
  await user.click(screen.getByRole('button'))

  // Assert
  expect(screen.getByText('John Doe')).toBeInTheDocument()
})
```

## Test Descriptions

Use descriptive test names that explain behavior:

```typescript
// Good
test('disables submit button when form is invalid')
test('shows error message when email is already taken')
test('redirects to dashboard after successful login')

// Bad
test('button test')
test('error')
test('works')
```

## What NOT to Test

- Implementation details (internal state, private methods)
- Third-party libraries (shadcn/ui, TanStack Query)
- Snapshot tests (prefer explicit assertions)
- Styling (unless behavior-critical)
