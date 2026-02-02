# AGENTS

## Project summary
- React 18 frontend with TypeScript strict mode and Vite 5.x
- TanStack Query for server state management
- MSW 2.x for mock API handlers (seeded Faker data)
- Tailwind CSS + shadcn/ui component library
- Vitest for unit tests, Playwright for E2E

## Key commands
- Install deps: `npm install`
- Run dev (mocks): `npm run dev:mock`
- Run dev (real API): `npm run dev`
- Run tests: `npm test`
- Run E2E tests: `npm run test:e2e`
- Generate types: `npm run generate:types`
- Build production: `npm run build`

## Layout
- `src/api/` API client and generated types
- `src/api/generated/` AUTO-GENERATED from OpenAPI (do not edit)
- `src/auth/` Auth context and provider implementations
- `src/components/ui/` shadcn/ui components
- `src/components/` Layout, shared components
- `src/features/` Feature-based organization (dashboard, users, etc.)
- `src/hooks/` Custom React hooks
- `src/lib/` Utilities (cn, formatters)
- `src/mocks/factories/` Faker.js data factories
- `src/mocks/handlers/` MSW request handlers

## Conventions
- Never hand-write API types - always generate from OpenAPI
- Seed Faker with 12345 for reproducible mocks
- Use shadcn/ui components - don't reinvent UI
- TanStack Query for all API calls (no manual fetch/useEffect)
- Zod schemas mirror backend Pydantic models
- Path alias `@/` maps to `src/`
- MSW handlers support full CRUD with mutable state
- Test components with MSW mocks active
- Run E2E tests against `dev:mock` for consistency
