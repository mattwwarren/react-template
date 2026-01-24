# Quick Start Guide

Welcome! This is a production-ready React template with TypeScript, TanStack Query, and MSW mocks.

## Prerequisites

- Node.js 20+
- npm 10+
- Docker (optional, for containerized deployment)

## Quick Start (2 minutes)

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env.development.local

# Edit .env.development.local:
VITE_API_BASE_URL=http://localhost:8000
```

### 3. Start Development Server

**With MSW mocks (standalone mode):**
```bash
npm run dev:mock
# Opens http://localhost:{{ port }}
```

**Connected to real API:**
```bash
npm run dev
# Opens http://localhost:{{ port }}
# Requires backend at {{ api_url }}
```

Verify the server is running by visiting http://localhost:{{ port }} in your browser.

---

## Configuration Options

All configuration is done via environment variables in `.env.*` files.

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `{{ api_url }}` | Backend API URL |
| `VITE_USE_MOCKS` | `false` | Enable MSW mocks |

### Environment Files

| File | Purpose |
|------|---------|
| `.env.development` | Development defaults |
| `.env.production` | Production defaults |
| `.env.development.local` | Local overrides (git-ignored) |

---

{% if auth_enabled %}
## Authentication

**Provider**: {{ auth_provider }}

Authentication is enabled with the {{ auth_provider }} provider.

### Configuration

Set these environment variables:

{% if auth_provider == 'ory' %}
```bash
VITE_ORY_SDK_URL=https://your-project.projects.oryapis.com
```
{% elif auth_provider == 'auth0' %}
```bash
VITE_AUTH0_DOMAIN=your-tenant.auth0.com
VITE_AUTH0_CLIENT_ID=your-client-id
VITE_AUTH0_AUDIENCE=https://your-api-identifier
```
{% elif auth_provider == 'keycloak' %}
```bash
VITE_KEYCLOAK_URL=https://your-keycloak.example.com
VITE_KEYCLOAK_REALM=your-realm
VITE_KEYCLOAK_CLIENT_ID=your-client-id
```
{% elif auth_provider == 'cognito' %}
```bash
VITE_COGNITO_REGION=us-east-1
VITE_COGNITO_USER_POOL_ID=us-east-1_xxxxxxxx
VITE_COGNITO_CLIENT_ID=your-client-id
```
{% endif %}

### Protected Routes

All routes except `/login` require authentication. The `ProtectedRoute` component handles redirects.

{% else %}
## Authentication

**Status**: Disabled

To enable authentication, regenerate the project with `auth_enabled=true`:

```bash
copier update --data auth_enabled=true --data auth_provider=ory
```

{% endif %}

---

{% if use_mocks %}
## Mock Data (MSW)

MSW (Mock Service Worker) provides realistic API mocks for standalone development.

### Available Mock Data

| Resource | Count | Description |
|----------|-------|-------------|
| Users | 25 | Seeded with Faker.js |
| Organizations | 10 | With member counts |
| Documents | 50 | Various file types |

### Running with Mocks

```bash
npm run dev:mock
```

All CRUD operations work against in-memory data that resets on page refresh.

### Disabling Mocks

Set `VITE_USE_MOCKS=false` in your environment or run:

```bash
npm run dev
```

{% endif %}

---

## Running Tests

```bash
# Unit tests (Vitest)
npm test

# Watch mode
npm run test:ui

# With coverage
npm run test:coverage

# E2E tests (Playwright)
npm run test:e2e
```

---

## Code Quality

```bash
# ESLint
npm run lint

# TypeScript type check
npm run typecheck

# Build (includes type check)
npm run build
```

---

## Type Generation

Generate TypeScript types from your backend's OpenAPI spec:

```bash
# Ensure backend is running at {{ api_url }}
npm run generate:types

# Types are written to src/api/generated/types.ts
```

---

## Docker Deployment

### Development Container

```bash
npm run docker:dev
npm run docker:run:dev
# Opens http://localhost:{{ port }}
```

### Production Build

```bash
npm run docker:prod
npm run docker:run:prod
# Opens http://localhost:8080
```

The production image:
- Serves static files via nginx
- Proxies `/api/*` to `API_URL` environment variable
- Includes health check at `/health`

### Runtime Configuration

Pass `API_URL` at container runtime:

```bash
docker run -p 8080:80 \
  -e API_URL={{ api_url }} \
  {{ project_slug }}:prod
```

---

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server (real API) |
| `npm run dev:mock` | Start dev server (MSW mocks) |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm test` | Run unit tests |
| `npm run test:e2e` | Run E2E tests |
| `npm run lint` | ESLint check |
| `npm run typecheck` | TypeScript check |
| `npm run generate:types` | Generate types from OpenAPI |
| `npm run docker:prod` | Build production image |

---

## Project Structure

```
{{ project_slug }}/
├── src/
│   ├── api/                 # API client & generated types
│   │   ├── generated/       # AUTO-GENERATED (do not edit)
│   │   ├── client.ts        # Fetch wrapper
│   │   └── *.ts             # Resource-specific API functions
│   ├── components/
│   │   ├── ui/              # shadcn/ui components
│   │   ├── layout/          # Header, Sidebar, Layout
│   │   └── shared/          # Reusable components
│   ├── features/            # Feature modules (users, orgs, docs)
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utilities
│   └── mocks/               # MSW handlers & Faker factories
├── tests/
│   ├── unit/                # Vitest unit tests
│   └── e2e/                 # Playwright E2E tests
├── docker/
│   ├── Dockerfile           # Multi-stage build
│   └── nginx.conf           # Production static serving
└── scripts/
    └── generate-types.sh    # OpenAPI type generation
```

---

## Troubleshooting

### "Cannot find module '@/...'"

**Problem**: Path alias not resolving

**Solution**:
1. Restart TypeScript server in your IDE
2. Verify `tsconfig.json` has correct paths
3. Run `npm run typecheck` to verify

### "CORS errors when connecting to API"

**Problem**: Backend not allowing frontend origin

**Solution**:
1. Configure CORS on backend: `http://localhost:{{ port }}`
2. Or use MSW mocks: `npm run dev:mock`

### "MSW not intercepting requests"

**Problem**: Mocks not loading

**Solution**:
1. Check `VITE_USE_MOCKS=true` is set
2. Look for MSW initialization in browser console
3. Verify service worker registered in DevTools > Application

### "Type errors after generating types"

**Problem**: API types changed

**Solution**:
```bash
# Regenerate types
npm run generate:types

# Check for breaking changes
npm run typecheck
```

---

## Next Steps

1. **Explore the Dashboard**: View sample data and components
2. **Read Component Docs**: Check shadcn/ui documentation
3. **Customize Theme**: Edit `tailwind.config.js` and `src/index.css`
4. **Add Features**: Create new pages in `src/features/`
5. **Connect Backend**: Update `VITE_API_BASE_URL` and generate types

---

## Additional Resources

- [React Documentation](https://react.dev/)
- [TanStack Query](https://tanstack.com/query/latest)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [MSW Documentation](https://mswjs.io/)
- [Vite Guide](https://vite.dev/guide/)

---

Happy coding!
