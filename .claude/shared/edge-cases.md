# Edge Cases - {{ project_name }}

This document catalogs common edge cases to test and handle in React applications.

## Form Validation

### Email Validation
- Empty email
- Invalid format (no @, no domain)
- Valid but unusual (name+tag@domain.com)
- Very long email (>254 characters)
- Unicode characters in local part

### Password Validation
- Empty password
- Too short (<8 characters)
- No special characters
- Only special characters
- Common passwords (password123)
- Very long password (>128 characters)

### Text Inputs
- Empty string
- Whitespace only
- Leading/trailing whitespace
- Very long string (>1000 characters)
- Special characters (<, >, &, ', ")
- Unicode characters (emojis, CJK)
- Script injection attempts

### Number Inputs
- Zero
- Negative numbers
- Decimal numbers
- Very large numbers (MAX_SAFE_INTEGER)
- NaN / Infinity
- String that looks like number ("123abc")

## Async Loading States

### Initial Load
```typescript
// Test sequence: loading → success
test('shows loading then data', async () => {
  render(<UserList />)
  expect(screen.getByRole('progressbar')).toBeInTheDocument()
  await screen.findByRole('table')
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
})
```

### Empty State
```typescript
server.use(http.get('*/users', () => HttpResponse.json({ items: [], total: 0 })))
// Should show empty state, not loading forever
```

### Error State
```typescript
server.use(http.get('*/users', () => HttpResponse.json({ detail: 'Error' }, { status: 500 })))
// Should show error message with retry option
```

### Slow Network
```typescript
server.use(http.get('*/users', async () => {
  await delay(10000)
  return HttpResponse.json(mockUsers)
}))
// Should show loading indicator, allow cancellation
```

## Optimistic Updates

### Success Path
1. User clicks "Like"
2. UI updates immediately (optimistic)
3. API call succeeds
4. State remains updated

### Failure Path
1. User clicks "Like"
2. UI updates immediately (optimistic)
3. API call fails
4. UI rolls back to previous state
5. Error message shown

```typescript
test('rolls back on optimistic update failure', async () => {
  server.use(http.post('*/like', () => HttpResponse.json({}, { status: 500 })))

  render(<LikeButton liked={false} />)
  await user.click(screen.getByRole('button'))

  // Optimistic update
  expect(screen.getByRole('button', { pressed: true })).toBeInTheDocument()

  // Rollback after error
  await waitFor(() => {
    expect(screen.getByRole('button', { pressed: false })).toBeInTheDocument()
  })
  expect(screen.getByText(/failed/i)).toBeInTheDocument()
})
```

## Pagination

### Boundary Conditions
- First page (no "Previous" button)
- Last page (no "Next" button)
- Single page (no pagination controls)
- Empty list (no pagination)
- Exactly page_size items

### Page Changes
- Navigating forward/backward
- Jumping to specific page
- Changing page size
- Invalidation resets to page 1

### URL Sync
```typescript
// Page number should be in URL
expect(window.location.search).toContain('page=2')
// Direct URL access should work
navigate('/users?page=3')
```

## Authentication

### Session Expiry
```typescript
// 401 response should redirect to login
server.use(http.get('*', () => HttpResponse.json({}, { status: 401 })))
// Preserve intended destination for redirect after login
```

### Token Refresh
- Refresh token flow
- Concurrent requests during refresh
- Failed refresh → logout

### Protected Routes
- Unauthenticated access redirects
- Deep link after login
- Role-based access

## Error Boundaries

### Component Errors
```typescript
test('shows fallback when component throws', () => {
  const BrokenComponent = () => { throw new Error('Boom') }

  render(
    <ErrorBoundary fallback={<div>Something went wrong</div>}>
      <BrokenComponent />
    </ErrorBoundary>
  )

  expect(screen.getByText('Something went wrong')).toBeInTheDocument()
})
```

### Async Errors
- Unhandled promise rejection
- Timeout errors
- Network errors

## Concurrent Operations

### Rapid Clicking
```typescript
test('prevents duplicate submissions', async () => {
  render(<SubmitForm />)

  const button = screen.getByRole('button', { name: /submit/i })

  // Rapid clicks
  await user.click(button)
  await user.click(button)
  await user.click(button)

  // Only one submission
  expect(mockSubmit).toHaveBeenCalledTimes(1)
})
```

### Race Conditions
```typescript
test('uses latest search result', async () => {
  // Type "ab", then "abc" quickly
  await user.type(searchInput, 'ab')
  await user.type(searchInput, 'c')

  // Should show results for "abc", not "ab"
  await waitFor(() => {
    expect(screen.getByText(/results for "abc"/i)).toBeInTheDocument()
  })
})
```

## Internationalization

### Date/Time
- Different timezones
- DST transitions
- Locale-specific formats
- Relative time ("2 hours ago")

### Numbers
- Decimal separators (. vs ,)
- Thousand separators
- Currency symbols
- Negative numbers

### Text Direction
- RTL languages (Arabic, Hebrew)
- Mixed LTR/RTL content

## Accessibility

### Keyboard Navigation
- Tab order is logical
- Focus visible on all interactive elements
- Escape closes modals
- Arrow keys in lists/menus

### Screen Readers
- All images have alt text
- Form inputs have labels
- Error messages announced
- Loading states announced

### Reduced Motion
```typescript
// Respect prefers-reduced-motion
@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; }
}
```

## File Upload

### File Validation
- No file selected
- File too large
- Invalid file type
- Corrupted file
- Multiple files when single expected

### Progress
- Upload progress indicator
- Cancel upload
- Resume failed upload

### Edge Cases
- Very long filename
- Filename with special characters
- Duplicate filename