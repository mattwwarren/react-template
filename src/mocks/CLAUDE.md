# Mock Data Layer

MSW request handlers and Faker.js data factories for development and testing.

## Faker Seed

**ALWAYS seed faker for reproducible data:**

```typescript
import { faker } from '@faker-js/faker'
faker.seed(12345)
```

The seed is set once in `factories/index.ts`. All factories import the seeded instance from there.

## Factory Pattern

```typescript
export function createUser(overrides?: Partial<User>): User {
  const createdAt = faker.date.past().toISOString()
  return {
    id: faker.string.uuid(),
    email: faker.internet.email(),
    name: faker.person.fullName(),
    created_at: createdAt,
    updated_at: createdAt,
    organizations: [],
    ...overrides,  // Overrides always last via spread
  }
}

export function createUsers(count: number): User[] {
  return Array.from({ length: count }, () => createUser())
}
```

- `createX(overrides?: Partial<X>): X` for single items
- `createXs(count: number): X[]` for bulk generation
- Timestamps as ISO strings from `faker.date.past().toISOString()`

## Pre-Generated Dataset (`factories/dataset.ts`)

```typescript
export const mockDataset = generateDataset()  // Seeded, deterministic
export const mockUsers = mockDataset.users     // 25 users
export const mockOrganizations = mockDataset.organizations  // 5 orgs
export const mockMemberships = mockDataset.memberships      // 25 memberships
export const mockDocuments = mockDataset.documents           // 50 documents
```

Relationships are pre-wired (users belong to orgs via memberships). The seed resets at generation time for consistency.

## MSW Handler Pattern

```typescript
let users = [...mockUsers]  // Mutable copy for CRUD

export const userHandlers = [
  http.get('*/users', ({ request }) => {
    const { page, size } = extractPaginationFromUrl(new URL(request.url))
    return HttpResponse.json(paginateArray(users, page, size))
  }),

  http.post('*/users', async ({ request }) => {
    const body = await request.json()
    const result = UserCreateSchema.safeParse(body)
    if (!result.success) {
      return HttpResponse.json(
        { detail: result.error.issues.map(i => ({ loc: [i.path[0]], msg: i.message })) },
        { status: 422 }
      )
    }
    const user = createUser({ ...result.data })
    users.push(user)
    return HttpResponse.json(user, { status: 201 })
  }),
]

export function resetUsers() { users = [...mockUsers] }
```

Key conventions:
- `let items = [...mockItems]` for mutable CRUD state
- Zod schemas mirror backend Pydantic validation
- Error format matches FastAPI: `{ detail: [...] }` with 422 status
- `resetX()` functions for test cleanup
- URL patterns use `*/resource` glob (works with any base URL)

## Pagination Utility

`paginateArray()` from `handlers/utils.ts` - centralized to avoid DRY violations:

```typescript
paginateArray(items, page, size)
// Returns: { items, total, page, size, pages }
```

Pages are 1-indexed.
