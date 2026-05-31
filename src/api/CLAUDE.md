# API Client Layer

Type-safe API functions and generated types.

## Generated Types

`generated/types.ts` is auto-generated from the OpenAPI spec. **NEVER edit manually.**

```bash
npm run generate:types  # Reads from ../specs/openapi.json
```

## Type Aliases (`types.ts`)

```typescript
import type { components } from './generated/types'

export type User = components['schemas']['UserRead']
export type UserCreate = components['schemas']['UserCreate']
export type PaginatedUsers = components['schemas']['Page_UserRead_']
```

Always create type aliases here. Import these throughout the app, never import from `generated/` directly.

## Fetch Client (`client.ts`)

```typescript
// Generic typed fetch
const data = await fetchApi<User>('/users/123')

// POST/PATCH always JSON.stringify the body
await fetchApi<User>('/users', {
  method: 'POST',
  body: JSON.stringify(data),
})
```

- Custom `ApiError` class with `status`, `statusText`, `message`
- `credentials: 'include'` on all requests
- Organization header: validates UUID v4 format before injecting `X-Selected-Org`
- 403 with "organization" in detail clears localStorage and emits `org:cleared` event
- `fetchApiFormData()` variant for file uploads (no Content-Type header)

## API Object Pattern

Each domain gets an API object with CRUD methods:

```typescript
export const usersApi = {
  list: (params: PaginationParams = {}) =>
    fetchApi<PaginatedUsers>(`/users?page=${params.page ?? 1}&size=${params.size ?? 10}`),
  get: (id: string) => fetchApi<User>(`/users/${id}`),
  create: (data: UserCreate) =>
    fetchApi<User>('/users', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: UserUpdate) =>
    fetchApi<User>(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) =>
    fetchApi<void>(`/users/${id}`, { method: 'DELETE' }),
}
```

## Separation from Hooks

This layer contains **pure fetch functions only**. TanStack Query hooks live in `src/hooks/`. This separation allows API functions to be used outside React components (tests, scripts, MSW handlers).
