# AGENTS

## Project summary
- React 19 frontend with TypeScript strict mode and Vite 7 (version authority: `package.json`; see ARCHITECTURE.md)
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
