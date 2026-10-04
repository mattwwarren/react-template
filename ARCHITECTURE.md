# Architecture

This document describes how the React template is put together: the layering
rules, the data and auth flow, the mock/test strategy, and the invariants
that keep generated projects consistent. It mirrors the section structure of
`fastapi-template/ARCHITECTURE.md` — this template is the reference frontend
for that backend.

Stack (as shipped in `package.json`): Vite 7, React 19, react-router-dom 7
(declarative `<BrowserRouter>`/`<Routes>`), TanStack Query 5, Tailwind CSS 4
+ shadcn/ui, react-hook-form + zod, socket.io-client, MSW 2, Biome
(lint + format — there is no ESLint), Vitest + Playwright.

## The template model: runnable-first

The repository is a **directly runnable app** on `main`. There are no
`.jinja` files in the working tree; `scripts/templatize.sh` converts the
repo to a Copier template at release time (name/slug substitutions plus
`__PROJECT_NAME__` placeholders in the layout components, resolved by
`_tasks.py` after generation), and `publish-template.yml` pushes the result
to the `copier` branch.

> **Known gap:** of the Copier variables, only the identity ones
> (`project_name`/`project_slug`) shape the generated **code**.
> `auth_enabled`, `auth_provider`, `use_mocks`, `port`, and `api_url` are
> consumed only by documentation templating (they drive Jinja branches in
> the generated `QUICKSTART.md`) — no application config or source file
> branches on them, so every generated project ships all auth providers and
> the full MSW mock layer regardless of the answers, and `vite.config.ts` /
> `.env.development` keep their hardcoded port/URL. The real switches are
> **runtime env vars**: `VITE_AUTH_PROVIDER`, `VITE_USE_MOCKS`,
> `VITE_API_URL`.

## Layering

```
Route (app shell)
    │
    ▼
features/     route-owned pages + domain components (one dir per domain:
    │         dashboard, users, organizations, documents, auth)
    ▼
hooks/        TanStack Query hooks per resource (query-key factories,
    │         optimistic updates, prefetch helpers)
    ▼
api/          thin hand-written fetch wrappers per resource, typed by
    │         GENERATED OpenAPI types (src/api/generated/, gitignored)
    ▼
fetchApi()    src/api/client.ts — cookie credentials, X-Selected-Org
    │         header, ApiError, 403-org auto-clear
    ▼
FastAPI backend (or MSW, when VITE_USE_MOCKS=true)
```

### Component placement rule

- `src/components/ui/` — unmodified shadcn/ui primitives. No business
  logic; excluded from coverage.
- `src/components/layout/` — app chrome (Header, Sidebar, MobileSidebar,
  Layout, navigation).
- `src/components/shared/` — cross-feature composed components with app
  logic (DataTable, Pagination, ErrorBoundary, OrganizationSwitcher,
  UserMenu, …).
- `src/features/<domain>/` — everything owned by one route/domain,
  including its page, forms, dialogs, and tests. If only one feature uses
  it, it lives in that feature.

### Types are generated, not written

`src/api/types.ts` aliases types out of `src/api/generated/types.ts`, which
is produced by `npm run generate:types` from `../specs/openapi.json` — the
spec **exported by the sibling fastapi-template**. The generated directory
is gitignored; hand-writing API types is a convention violation.

> **Known gap:** `src/realtime/useTaskEvents.ts` hand-writes its event
> payload interfaces even though the backend publishes exactly these schemas
> through `GET /realtime/events` for `openapi-typescript` to generate. The
> contract-sync mechanism exists but isn't consumed on the client yet, so
> those interfaces can drift silently.

## App shell and routing

Provider nesting (outer → inner): `ErrorBoundary` → `QueryClientProvider` →
`AuthProvider` → `SocketProvider` → `BrowserRouter` → `Suspense` → `Routes`.

- The `QueryClient` is created with `useMemo` inside the component for
  StrictMode safety (module scope would double-create in dev). Defaults:
  `staleTime` 5 min, `gcTime` 10 min, no refetch-on-focus, retry 3 with
  exponential backoff.
- Routes split into a public group (`/login`, `/auth/callback`) and a
  protected group wrapped in `<ProtectedRoute>` (auth guard: spinner while
  loading, redirect to `/login` preserving destination, else `<Outlet/>`)
  and `<Layout>` (sidebar + header + `<main>`).
- Feature pages are `React.lazy()`-loaded via direct file imports —
  deliberately bypassing feature barrels so tree shaking works.
- Cross-tab org sync: a `storage` listener on `selectedOrganizationId`
  hard-reloads the page when another tab switches organization.

> **Known gap:** the route tree sets `errorElement`/`RouteErrorBoundary`,
> which only functions under a data router (`createBrowserRouter`); with the
> declarative `<Routes>` used here it is inert, and only the top-level class
> `ErrorBoundary` actually catches render errors.

## Data flow

One hook module per resource in `src/hooks/` (users, organizations,
memberships, documents), each with a hierarchical query-key factory
(`userKeys.all/lists()/list(params)/details()/detail(id)`), CRUD mutations
that invalidate the right keys, optimistic updates with
snapshot-and-rollback where it matters (`useUpdateUser`), and a
`usePrefetch*` helper for hover/focus preloading. No manual
`useEffect`+`fetch` anywhere — server state belongs to TanStack Query.

Errors surface as a typed `ApiError` thrown by `handleResponse()`. One
special case lives in the client itself: a 403 whose detail mentions
"organization" clears the selected org from localStorage and dispatches an
`org:cleared` CustomEvent for the UI.

## Auth architecture

Cookie/session-based, provider-pluggable:

- Every request sends `credentials: 'include'`; the Socket.IO connection
  uses `withCredentials: true`. No tokens are stored client-side (the mock
  provider persists a fake user object — not a token — for dev).
- `AuthProvider` reads `VITE_AUTH_PROVIDER` at runtime and builds the
  provider via a factory that dynamically `import()`s the SDK-specific
  module (ory / auth0 / keycloak / cognito), **falling back to mock** if the
  SDK isn't installed. Mock loads synchronously to avoid a loading flash;
  real providers load async.
- The Ory provider is redirect-based (Kratos self-service flows) and
  requires `VITE_ORY_SDK_URL`. Ory, Keycloak, and Cognito share a
  `useSyncExternalStore` external-store factory (`createExternalStore.ts`);
  Auth0 currently hand-rolls an equivalent store — a candidate for
  migrating onto the shared factory.
- There is deliberately no client-side token refresh — session lifetime is
  the IdP/backend's problem, carried by the httpOnly cookie.
- Multi-tenancy: the selected organization lives in localStorage
  (`src/lib/organization.ts`), is injected on every request as a validated
  (UUID-checked) `X-Selected-Org` header, and is cleared on logout and on
  org-403s.

## Realtime

`SocketProvider` opens a Socket.IO connection only while authenticated
(path `/ws/socket.io/`, cookie auth, websocket + polling fallback,
reconnection with capped backoff) and tears it down on logout.
`useTaskEvents()` subscribes to the task lifecycle events emitted by the
backend/worker (`task_status_changed`, `task_progress`, `task_completed`,
`task_failed`) and folds server push back into client state by invalidating
the relevant TanStack Query keys.

## Mocks

MSW is the single mock layer, used identically in the browser and in tests:

- `src/mocks/factories/` — faker factories seeded with `faker.seed(12345)`,
  plus a pre-generated linked dataset.
- `src/mocks/handlers/` — one module per resource holding **mutable
  in-memory state** for full CRUD simulation; `resetAllHandlers()` restores
  the dataset.
- Browser: `main.tsx` starts the service worker only when
  `VITE_USE_MOCKS === 'true'` (`npm run dev:mock`). Tests: `msw/node`
  server in `src/test/setup.ts`, reset after each test.

## Testing architecture

Three tiers with an important asymmetry — "e2e" does not mean "real
backend":

- **Unit/component** (`vitest.config.ts`) — jsdom + Testing Library + MSW.
  Coverage thresholds 80/80/80/80, excluding shadcn `ui/` and mocks.
- **E2E** (`tests/e2e/`, `playwright.config.ts`) — full browser against
  `npm run dev:mock`, i.e. still MSW-backed. Chromium locally; all browsers
  in CI.
- **Integration** (`tests/integration/`,
  `playwright.integration.config.ts`) — the only tier that hits a real
  backend: DevSpace port-forwards the deployed frontend in k3d
  (`devspace run integration-tests`), serial workers, no `webServer`.

## Deployment

- Multi-stage Dockerfile: `dev` target runs Vite; `prod` target is
  nginx-alpine serving the built SPA as a non-root user with SPA fallback,
  gzip, security headers, long-cache static assets, a `/health` endpoint,
  and an `/api/` reverse proxy to a runtime-configurable `$API_URL`
  (envsubst'd at container start).
- DevSpace + k3d for local Kubernetes; `API_URL` defaults to the in-cluster
  DNS of the sibling `fastapi-template` service. Dependency-aware pipelines
  let the repo deploy standalone or as part of the meta-workspace.
- `deployment/` holds only a PodDisruptionBudget; Deployment/Service objects
  are DevSpace-generated.

## Invariants (the short list)

The rationale behind each of these, and the failure modes they exist to prevent, are spelled out below in [§7 Principles](#7-principles) and [§8 Anti-patterns](#8-anti-patterns).

1. Server state lives in TanStack Query; no hand-rolled fetch/useEffect.
2. API types are generated from the backend's OpenAPI spec; `api/` modules
   stay thin wrappers over `fetchApi()`.
3. Auth is cookie-based; provider choice is a runtime env switch with a
   safe mock fallback; no client-held tokens or refresh logic.
4. Tenancy is explicit: validated `X-Selected-Org` header, cleared on
   logout/403.
5. shadcn primitives in `ui/` stay unmodified; feature-owned code lives in
   its feature directory.
6. MSW is the only mock layer; factories are seeded and deterministic.
7. Only the integration Playwright tier talks to a real backend.
8. Biome is the lint/format authority (pinned exact; enforced by lint-staged
   and a Claude PostToolUse hook).

## 7. Principles

1. **Server state ownership** — TanStack Query owns all server state (caching, invalidation, retries) so no feature reinvents that machinery via hand-rolled `useEffect`+`fetch`. Governs `src/hooks/*.ts`, `src/features/**`. Cross-refs Invariant 1.
2. **Generated contracts** — `src/api/types.ts` only ever aliases `src/api/generated/types.ts` (built by `npm run generate:types` from the sibling fastapi-template's OpenAPI spec) because the backend is the single source of truth for the wire shape. Governs `src/api/generated/` (gitignored), `src/api/types.ts`. Cross-refs Invariant 2 and §8.1.
3. **CLI-refreshed primitives** — shadcn/ui primitives are added/upgraded only via the shadcn CLI, never hand-edited, because a hand-edit silently forks the primitive from upstream and the next regenerate either clobbers the fix or freezes the primitive in place forever. Governs `src/components/ui/`. Cross-refs Invariant 5 and §8.2.
4. **Deliberate tooling bumps** — Biome is pinned exact and bumped only in a change that also fixes whatever the new default ruleset newly flags, so a minor release can't fail CI on an unrelated PR days later. Governs `package.json` (`"//biome"` comment), `biome.json`; precedent `d333fa9` (#7/#27). Cross-refs Invariant 8 and §8.3.
5. **Single mock layer** — MSW is the only mock implementation, shared byte-for-byte between the browser (`main.tsx`, gated on `VITE_USE_MOCKS`) and tests (`src/test/setup.ts`), seeded via `faker.seed(12345)`, so dev and test data can't silently diverge. Governs `src/mocks/factories/`, `src/mocks/handlers/`. Cross-refs Invariant 6 and §8.4.

## 8. Anti-patterns

1. **Hand-written types mirroring a generated contract** — `src/realtime/useTaskEvents.ts` hand-writes interfaces for `task_status_changed`/`task_progress`/`task_completed`/`task_failed` even though the backend exposes exactly these payloads via `GET /realtime/events` for `openapi-typescript` to generate (see the existing "Known gap" at ARCHITECTURE.md's "Types are generated, not written" subsection). Do not add a second hand-written interface for a schema the backend already exposes for generation. Governs `src/realtime/useTaskEvents.ts`.
2. **Hand-edited shadcn primitives** — editing a file under `src/components/ui/` directly (business logic, prop renames, style overrides) instead of composing around it from `src/components/shared/` or a feature directory. Governs `src/components/ui/`.
3. **Undeliberate pinned-dependency bumps** — bumping Biome (or any future pinned-exact tool) in a commit that doesn't also resolve what the new version newly flags, deferring fallout to an unrelated PR's CI run. Governs `package.json`, `biome.json`.
4. **A second mock/fixture mechanism** — per-test `fetch` mocks, a second faker seed, or any handler bypassing `src/mocks/handlers/`, because it immediately diverges from the dataset every other test and the dev-mode session share. Governs `src/mocks/`, `tests/`.
5. **Template variables with no code branch** — a new Copier variable in `copier.yaml`/`_tasks.py` that only branches documentation templating (Jinja in `QUICKSTART.md`) without a corresponding runtime env var or source-file branch, per the existing "Known gap" under "The template model: runnable-first" (today only `project_name`/`project_slug` shape generated code; `auth_enabled`, `auth_provider`, `use_mocks`, `port`, `api_url` do not). Governs `copier.yaml`, `_tasks.py`, `QUICKSTART.md`.
