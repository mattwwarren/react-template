# React Template - Claude Code Configuration

React UI template for consuming FastAPI backends. Reference implementation demonstrating API consumption, authentication, and modern React patterns.

## Project Status

**Current Phase:** Not started - scaffolding pending
**Plan:** `~/.claude/plans/react-template/main.md`

## Technology Stack

| Layer | Technology |
|-------|------------|
| Build | Vite 5.x |
| Framework | React 18 |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS 3.x + shadcn/ui |
| State | TanStack Query (server state) |
| Routing | React Router 6 |
| Forms | React Hook Form + Zod |
| Types | Auto-generated from OpenAPI via `openapi-typescript` |
| Mocks | MSW 2.x + @faker-js/faker (seeded) |
| Testing | Vitest + Testing Library (unit), Playwright (E2E) |

## Development Commands

```bash
# Development
npm run dev           # Start with real API (http://localhost:8000)
npm run dev:mock      # Start with MSW mocks (no backend needed)

# Type generation (requires backend running)
npm run generate:types

# Testing
npm test              # Vitest unit tests
npm run test:e2e      # Playwright E2E tests

# Build
npm run build         # Production build
npm run preview       # Preview production build

# Docker
npm run docker:dev    # Build dev image
npm run docker:prod   # Build production image (nginx static)
```

## Project Structure

```
src/
├── api/
│   ├── generated/       # AUTO-GENERATED - do not edit
│   │   └── types.ts     # From openapi-typescript
│   ├── client.ts        # Fetch wrapper with error handling
│   ├── users.ts         # User API functions
│   ├── organizations.ts
│   ├── memberships.ts
│   └── documents.ts
├── auth/
│   ├── context.tsx      # Auth context provider
│   └── providers/       # Auth provider implementations
│       ├── mock.ts      # Dev mode (auto-logged in)
│       ├── ory.ts
│       ├── auth0.ts
│       ├── keycloak.ts
│       └── cognito.ts
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── layout/          # Header, Sidebar, Layout
│   └── shared/          # Pagination, ErrorBoundary
├── features/
│   ├── dashboard/
│   ├── users/
│   ├── organizations/
│   ├── documents/
│   └── auth/            # Login, Logout, ProtectedRoute
├── hooks/               # Custom React hooks
├── lib/                 # Utilities (cn, formatters)
├── mocks/
│   ├── factories/       # Faker.js data factories
│   ├── handlers/        # MSW request handlers
│   └── browser.ts       # MSW browser setup
├── App.tsx
├── main.tsx
└── index.css
```

## Code Patterns

### Type-Safe API Calls

Always use generated types from OpenAPI:

```typescript
import type { components } from '@/api/generated/types';

type User = components['schemas']['UserRead'];
type UserCreate = components['schemas']['UserCreate'];

// TanStack Query with typed responses
const { data } = useQuery<PaginatedResponse<User>>({
  queryKey: ['users', page],
  queryFn: () => api.users.list({ skip: (page - 1) * 10, limit: 10 }),
});
```

### Form Validation (Mirrors Pydantic)

Zod schemas should mirror backend Pydantic models:

```typescript
import { z } from 'zod';

// Matches backend UserCreate schema
const userSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
});
```

### Mock Data Factories

Use seeded Faker for reproducible test data:

```typescript
import { faker } from '@/mocks/factories';

// Faker is seeded globally - same data every run
export function createUser(overrides?: Partial<User>): User {
  return {
    id: faker.string.uuid(),
    email: faker.internet.email(),
    name: faker.person.fullName(),
    ...overrides,
  };
}
```

### MSW Handlers

Mock API responses for development and testing:

```typescript
import { http, HttpResponse } from 'msw';

export const userHandlers = [
  http.get('*/users', ({ request }) => {
    const url = new URL(request.url);
    const skip = parseInt(url.searchParams.get('skip') || '0');
    const limit = parseInt(url.searchParams.get('limit') || '10');

    return HttpResponse.json({
      items: mockUsers.slice(skip, skip + limit),
      total: mockUsers.length,
      page: Math.floor(skip / limit) + 1,
      size: limit,
      pages: Math.ceil(mockUsers.length / limit),
    });
  }),
];
```

### Protected Routes

```tsx
import { useAuth } from '@/auth/context';

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <Outlet />;
}
```

## TypeScript Configuration

- Strict mode enabled
- Path alias: `@/` maps to `src/`
- No implicit any
- Strict null checks

## Testing Guidelines

### Unit Tests (Vitest)

- Test components with MSW mocks active
- Use Testing Library queries (getByRole, findByText)
- Wrap components in QueryClientProvider for hooks

### E2E Tests (Playwright)

- Run against `dev:mock` for consistency
- Test critical user flows (CRUD, navigation, auth)
- Use page object pattern for complex pages

## Environment Variables

```bash
# .env.development
VITE_USE_MOCKS=true
VITE_API_URL=http://localhost:8000

# .env.production
VITE_USE_MOCKS=false
VITE_API_URL=https://api.example.com

# Auth (when enabled)
VITE_ORY_URL=https://your-ory-instance.com
VITE_AUTH0_DOMAIN=your-tenant.auth0.com
VITE_AUTH0_CLIENT_ID=xxx
# etc.
```

## Copier Template

This project uses the same workflow as fastapi-template:

1. **Develop** on real, runnable code
2. **Templatize** via `scripts/templatize.sh` before release
3. **Release** publishes templatized version

Template variables:
- `project_slug` - Package name (hyphens)
- `auth_enabled` - Enable auth UI
- `auth_provider` - ory/auth0/keycloak/cognito

## Related Files

- Main plan: `~/.claude/plans/react-template/main.md`
- Backend template: `/home/matthew/workspace/meta-work/fastapi-template`
- API spec: `http://localhost:8000/openapi.json` (when backend running)

## Key Conventions

1. **Never hand-write API types** - Always generate from OpenAPI
2. **Seed Faker** - Use `faker.seed(12345)` for reproducible mocks
3. **Use shadcn/ui** - Don't create custom components when shadcn has one
4. **TanStack Query for server state** - No manual fetch/useEffect for API calls
5. **Zod for validation** - Mirrors Pydantic schemas from backend
