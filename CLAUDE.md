# React Template - Claude Code Configuration

React UI template for consuming FastAPI backends. Reference implementation demonstrating API consumption, authentication, and modern React patterns.

## Project Status

**Completed:** Phase 1 (Scaffolding), Phase 2 (OpenAPI Types), Phase 3 (Faker Factories), Phase 4 (MSW Handlers)
**Current Phase:** Phase 5 (DevOps - Docker & DevSpace)
**Plan:** `~/.claude/plans/react-template/main.md`

## Technology Stack

| Layer | Technology |
|-------|------------|
| Build | Vite 7 |
| Framework | React 19 |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS 4 + shadcn/ui |
| State | TanStack Query (server state) |
| Routing | React Router 7 (declarative `<Routes>`) |
| Forms | React Hook Form + Zod |
| Types | Auto-generated from OpenAPI via `openapi-typescript` |
| Mocks | MSW 2.x + @faker-js/faker (seeded) |
| Testing | Vitest + Testing Library (unit), Playwright (E2E) |

## Development Commands

```bash
# Development
npm run dev           # Start with real API (http://localhost:8000)
npm run dev:mock      # Start with MSW mocks (no backend needed)

# Type generation (uses shared spec - no backend needed)
npm run generate:types  # Reads from ../specs/openapi.json

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

Use type aliases from `@/api/types` (wraps generated types):

```typescript
import type { User, UserCreate, PaginatedUsers } from '@/api/types';
// Aliases map to: components['schemas']['UserRead'], etc.

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

Factories in `src/mocks/factories/` - seeded (12345) for reproducible data:

```typescript
// Individual factories
import { createUser, createOrganization, createMembership, createDocument } from '@/mocks/factories';

// Pre-generated dataset with relationships
import { mockUsers, mockOrganizations, mockMemberships, mockDocuments } from '@/mocks/factories';
// 25 users, 5 orgs, 25 memberships (linked), 50 documents
```

### MSW Handlers

Mock API responses for development and testing. Handlers support full CRUD with mutable state:

```typescript
import { http, HttpResponse } from 'msw';
import { mockUsers, createUser } from '../factories';
import { apiUrl } from './utils';

// Mutable copy for CRUD operations
let users = [...mockUsers];

export const userHandlers = [
  // List (paginated)
  http.get(apiUrl('/users'), ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const size = parseInt(url.searchParams.get('size') || '10');
    const start = (page - 1) * size;

    return HttpResponse.json({
      items: users.slice(start, start + size),
      total: users.length,
      page,
      size,
      pages: Math.ceil(users.length / size),
    });
  }),

  // Create
  http.post(apiUrl('/users'), async ({ request }) => {
    const body = await request.json();
    const user = createUser({ ...body });
    users.push(user);
    return HttpResponse.json(user, { status: 201 });
  }),
];
```

Anchor every handler path with `apiUrl('/…')` (from `./utils`), which resolves against `API_BASE_URL`. Do not use a leading-wildcard `'*/…'` path: it also matches Vite module requests such as `/src/features/users/UsersPage.tsx`, and an unknown id then returns 404 where the lazy import needs the module.

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

## Interface development and review

Read [ARCHITECTURE.md](./ARCHITECTURE.md), [UX-CONVENTIONS.md](./UX-CONVENTIONS.md) and
[docs/ux-baseline.md](./docs/ux-baseline.md) before planning, implementing or reviewing any change under
`src/`, including small additions. Treat them as acceptance criteria. Then follow the change loop in
[.claude/skills/ui-change/SKILL.md](./.claude/skills/ui-change/SKILL.md) (a plain file): restate the request
as acceptance criteria, reuse before inventing, write the e2e flow first, read the screenshots, run
`scripts/ci-local.sh`, and report what was and was not verified. Reviews use `.claude/agents/ux-reviewer.md`.
It is read-only, so it names the applicable specialists for you to run: `.claude/agents/accessibility-reviewer.md`,
`.claude/agents/component-reviewer.md` and `.claude/agents/tailwind-reviewer.md`. `UX-CONVENTIONS.md`,
`docs/ux-baseline.md` and the gates win over a specialist's examples.
Never raise a ratchet file, add an axe allowlist entry, or add a suppression comment without the operator's
explicit approval.
Before creating or editing any file under `src/`, run the new spec and confirm it fails for the right reason.

## Testing Guidelines

### Unit Tests (Vitest)

- Test components with MSW mocks active
- Use Testing Library queries (getByRole, findByText)
- Wrap components in QueryClientProvider for hooks

### E2E Tests (Playwright)

- Run against `dev:mock` for consistency
- Test critical user flows (CRUD, navigation, auth)
- Use page object pattern for complex pages
- Specs import `test` and `expect` from `tests/e2e/utils/fixtures`; the `signedIn` fixture is auto and signs in through the real Sign in form
- `E2E_PORT=<free port> npm run test:e2e` runs on a free port (default 5173, `--strictPort`, never reuses an existing server)
- `CI=1 npm run test:e2e` is the CI-equivalent run (3 browsers, retries 2, 1 worker)
- There is no Vite warm-up step. On a cold dependency cache (no `node_modules/.vite`) Vite's optimizer can reload the page mid-test, so a first local run (0 retries) can fail sign-in; re-run, or use `CI=1` (retries 2)

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
- Shared OpenAPI spec: `../specs/openapi.json` (exported by fastapi-template)
- Pre-seeded mock dataset: `src/mocks/factories/dataset.ts` (25 users, 5 orgs, 50 docs)

## Key Conventions

1. **Never hand-write API types** - Always generate from OpenAPI
2. **Seed Faker** - Use `faker.seed(12345)` for reproducible mocks
3. **Use shadcn/ui** - Don't create custom components when shadcn has one
4. **TanStack Query for server state** - No manual fetch/useEffect for API calls
5. **Zod for validation** - Mirrors Pydantic schemas from backend
