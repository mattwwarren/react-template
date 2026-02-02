---
description: Implement a React feature following established patterns
argument-hint: <feature-description>
---

# Implement React Feature

Implement a new feature for this React TypeScript frontend application.

## Usage

```bash
/react-implement <feature-description>
```

## Implementation Workflow

### Phase 1: Analysis (5-10 min)
1. Understand requirements - clarify scope and user flows
2. Survey existing patterns - review similar components/features
3. Plan architecture - components, hooks, API integration
4. Check MSW handlers - are mock endpoints available?

### Phase 2: Implementation (30-60 min)
1. **Components** - React components with TypeScript
2. **Hooks** - Custom hooks for business logic
3. **API Integration** - TanStack Query hooks
4. **MSW Handlers** - Mock API responses
5. **Tests** - React Testing Library + Playwright
6. **Storybook** - Visual documentation

### Phase 3: Verification (5-10 min)
```bash
npm run lint        # Must be 0 violations
npm run typecheck   # Must be 0 type errors
npm test            # Must be 100% pass rate
npm run test:e2e    # E2E tests pass
```

## Code Structure

```
src/
├── features/<feature>/
│   ├── components/
│   │   └── <Component>.tsx
│   ├── hooks/
│   │   └── use<Feature>.ts
│   ├── index.ts              # Feature exports
│   └── <Feature>.test.tsx
├── api/
│   └── <resource>.ts         # API functions
├── mocks/
│   ├── handlers/<resource>.ts
│   └── factories/<resource>.ts
└── stories/
    └── <Component>.stories.tsx

tests/e2e/
└── <feature>.spec.ts
```

## Example Feature Patterns

### Component with Query

```typescript
// src/features/users/components/UserList.tsx
import { useQuery } from '@tanstack/react-query'
import { userKeys, fetchUsers } from '@/api/users'
import { LoadingSpinner, ErrorMessage, EmptyState } from '@/components/shared'
import { UserCard } from './UserCard'

export function UserList() {
  const { data: users, isLoading, error } = useQuery({
    queryKey: userKeys.lists(),
    queryFn: fetchUsers,
  })

  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorMessage error={error} />
  if (!users?.length) return <EmptyState message="No users found" />

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {users.map(user => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  )
}
```

### Custom Hook with Mutation

```typescript
// src/features/users/hooks/useCreateUser.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { userKeys, createUser } from '@/api/users'
import { toast } from 'sonner'

export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      toast.success('User created successfully')
      queryClient.invalidateQueries({ queryKey: userKeys.all })
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create user')
    },
  })
}
```

### MSW Handler

```typescript
// src/mocks/handlers/users.ts
import { http, HttpResponse } from 'msw'
import { mockUsers, createUser } from '../factories/users'

export const userHandlers = [
  http.get('*/users', ({ request }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '10')

    return HttpResponse.json({
      items: mockUsers.slice((page - 1) * limit, page * limit),
      total: mockUsers.length,
    })
  }),
]
```

## Common Mistakes to Avoid

- No inline object/array props (causes re-renders)
- No business logic in components (use hooks)
- No hardcoded strings (use i18n or constants)
- Missing loading/error states
- Missing TypeScript types
- Skipping tests
- No accessibility attributes

## Definition of Done

- ESLint: 0 violations
- TypeScript: 0 type errors
- Tests: 100% pass rate
- Coverage: 80%+ on new code
- Storybook: Component documented
- Accessibility: ARIA attributes present
- Responsive: Works on mobile/tablet/desktop

---

**Before reporting complete:** Run all checks and verify 100% pass rate.
