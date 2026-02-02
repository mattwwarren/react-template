---
description: Generate MSW handlers and Faker factories from OpenAPI types
argument-hint: <resource-name>
---

# Generate MSW Handlers

Generate Mock Service Worker handlers and Faker.js data factories from OpenAPI types.

## Usage

```bash
/react-msw users
/react-msw organizations
/react-msw documents
```

## Generated Files

```
src/mocks/
├── handlers/
│   └── <resource>.ts     # MSW request handlers
└── factories/
    └── <resource>.ts     # Faker.js data factories
```

## Handler Template

```typescript
// src/mocks/handlers/users.ts
import { http, HttpResponse } from 'msw'
import { mockUsers, createUser, resetUsers } from '../factories/users'
import type { components } from '@/api/generated/types'

type UserCreate = components['schemas']['UserCreate']

// Mutable state for CRUD operations
let users = [...mockUsers]

export function resetUserHandlers() {
  users = [...mockUsers]
}

export const userHandlers = [
  // GET /users - List with pagination
  http.get('*/users', ({ request }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const search = url.searchParams.get('search')?.toLowerCase()

    let filteredUsers = users
    if (search) {
      filteredUsers = users.filter(
        u => u.name.toLowerCase().includes(search) ||
             u.email.toLowerCase().includes(search)
      )
    }

    const start = (page - 1) * limit
    const items = filteredUsers.slice(start, start + limit)

    return HttpResponse.json({
      items,
      total: filteredUsers.length,
      page,
      size: limit,
      pages: Math.ceil(filteredUsers.length / limit),
    })
  }),

  // GET /users/:id - Get single user
  http.get('*/users/:id', ({ params }) => {
    const user = users.find(u => u.id === params.id)
    if (!user) {
      return HttpResponse.json(
        { detail: 'User not found' },
        { status: 404 }
      )
    }
    return HttpResponse.json(user)
  }),

  // POST /users - Create user
  http.post('*/users', async ({ request }) => {
    const body = await request.json() as UserCreate

    // Validate required fields
    if (!body.email || !body.name) {
      return HttpResponse.json(
        { detail: [{ loc: ['body'], msg: 'Missing required fields', type: 'validation_error' }] },
        { status: 422 }
      )
    }

    // Check for duplicate email
    if (users.some(u => u.email === body.email)) {
      return HttpResponse.json(
        { detail: 'Email already exists' },
        { status: 409 }
      )
    }

    const newUser = createUser(body)
    users.push(newUser)
    return HttpResponse.json(newUser, { status: 201 })
  }),

  // PATCH /users/:id - Update user
  http.patch('*/users/:id', async ({ params, request }) => {
    const body = await request.json() as Partial<UserCreate>
    const index = users.findIndex(u => u.id === params.id)

    if (index === -1) {
      return HttpResponse.json(
        { detail: 'User not found' },
        { status: 404 }
      )
    }

    users[index] = { ...users[index], ...body, updated_at: new Date().toISOString() }
    return HttpResponse.json(users[index])
  }),

  // DELETE /users/:id - Delete user
  http.delete('*/users/:id', ({ params }) => {
    const index = users.findIndex(u => u.id === params.id)

    if (index === -1) {
      return HttpResponse.json(
        { detail: 'User not found' },
        { status: 404 }
      )
    }

    users.splice(index, 1)
    return new HttpResponse(null, { status: 204 })
  }),
]
```

## Factory Template

```typescript
// src/mocks/factories/users.ts
import { faker } from '@faker-js/faker'
import type { components } from '@/api/generated/types'

type User = components['schemas']['UserRead']
type UserCreate = components['schemas']['UserCreate']

// Seed for reproducible data
faker.seed(12345)

export function createUser(overrides?: Partial<UserCreate>): User {
  const createdAt = faker.date.past().toISOString()
  return {
    id: faker.string.uuid(),
    email: overrides?.email ?? faker.internet.email(),
    name: overrides?.name ?? faker.person.fullName(),
    avatar: faker.image.avatar(),
    is_active: true,
    created_at: createdAt,
    updated_at: createdAt,
    ...overrides,
  }
}

export function createUsers(count: number): User[] {
  return Array.from({ length: count }, () => createUser())
}

// Pre-generated dataset for consistent mock data
export const mockUsers = createUsers(25)

// Reset function for test isolation
export function resetUsers(): User[] {
  faker.seed(12345)
  return createUsers(25)
}
```

## Handler Index

```typescript
// src/mocks/handlers/index.ts
import { userHandlers, resetUserHandlers } from './users'
import { organizationHandlers, resetOrgHandlers } from './organizations'
import { documentHandlers, resetDocHandlers } from './documents'

export const handlers = [
  ...userHandlers,
  ...organizationHandlers,
  ...documentHandlers,
]

export function resetAllHandlers() {
  resetUserHandlers()
  resetOrgHandlers()
  resetDocHandlers()
}
```

## Factory Index

```typescript
// src/mocks/factories/index.ts
import { faker } from '@faker-js/faker'

// Global seed for reproducibility
faker.seed(12345)

export { faker }
export * from './users'
export * from './organizations'
export * from './documents'

// Reset all factories
export function resetMockData() {
  faker.seed(12345)
}
```

## Test Setup Integration

```typescript
// src/test/setup.ts
import '@testing-library/jest-dom'
import { server } from '@/mocks/server'
import { resetAllHandlers } from '@/mocks/handlers'
import { resetMockData } from '@/mocks/factories'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  server.resetHandlers()
  resetAllHandlers()
  resetMockData()
})
afterAll(() => server.close())
```

## OpenAPI Type Reference

Generate types first:
```bash
npm run generate:types
```

Then import from generated types:
```typescript
import type { components, paths } from '@/api/generated/types'

// Schema types
type User = components['schemas']['UserRead']
type UserCreate = components['schemas']['UserCreate']

// Response types
type UsersResponse = paths['/users']['get']['responses']['200']['content']['application/json']
```

## Handler Patterns

### File Upload
```typescript
http.post('*/documents', async ({ request }) => {
  const formData = await request.formData()
  const file = formData.get('file') as File

  if (!file) {
    return HttpResponse.json({ detail: 'No file provided' }, { status: 422 })
  }

  const doc = createDocument({ filename: file.name, size: file.size })
  return HttpResponse.json(doc, { status: 201 })
})
```

### Nested Resources
```typescript
http.get('*/organizations/:orgId/members', ({ params }) => {
  const members = mockMemberships.filter(m => m.organization_id === params.orgId)
  return HttpResponse.json({ items: members, total: members.length })
})
```

### Error Simulation
```typescript
http.get('*/users/:id', ({ params }) => {
  if (params.id === 'error-500') {
    return HttpResponse.json({ detail: 'Internal error' }, { status: 500 })
  }
  // Normal handling...
})
```

## Checklist

- [ ] All CRUD operations covered
- [ ] Pagination implemented
- [ ] Search/filter supported
- [ ] Validation errors return 422
- [ ] Not found errors return 404
- [ ] Conflict errors return 409
- [ ] Factory uses Faker.js
- [ ] Factory is seeded for reproducibility
- [ ] Reset functions exported
- [ ] TypeScript types imported from generated

---

**After generation:** Run `npm run dev:mock` to verify handlers work.
