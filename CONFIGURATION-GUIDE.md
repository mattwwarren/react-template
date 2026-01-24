# Configuration Guide

Complete reference for all environment variables and feature configuration options.

---

## Environment Variables Quick Reference

| Variable | Type | Default | Required | Purpose |
|----------|------|---------|----------|---------|
| `VITE_API_URL` | str | http://localhost:8000 | ❌ | Backend API base URL |
| `VITE_USE_MOCKS` | bool | false | ❌ | Enable MSW mock handlers |
| `VITE_AUTH_ENABLED` | bool | false | ❌ | Enable authentication UI |
| `VITE_AUTH_PROVIDER` | str | mock | ❌ | Auth provider (mock, ory, auth0, keycloak, cognito) |
| `VITE_ORY_URL` | str | - | ⚠️ If ory | Ory API endpoint |
| `VITE_AUTH0_DOMAIN` | str | - | ⚠️ If auth0 | Auth0 tenant domain |
| `VITE_AUTH0_CLIENT_ID` | str | - | ⚠️ If auth0 | Auth0 application client ID |
| `VITE_KEYCLOAK_URL` | str | - | ⚠️ If keycloak | Keycloak server URL |
| `VITE_KEYCLOAK_REALM` | str | - | ⚠️ If keycloak | Keycloak realm name |
| `VITE_KEYCLOAK_CLIENT_ID` | str | - | ⚠️ If keycloak | Keycloak client ID |
| `VITE_COGNITO_USER_POOL_ID` | str | - | ⚠️ If cognito | AWS Cognito user pool ID |
| `VITE_COGNITO_CLIENT_ID` | str | - | ⚠️ If cognito | AWS Cognito app client ID |
| `VITE_COGNITO_REGION` | str | - | ⚠️ If cognito | AWS region |

---

## Development Configuration

### Mock Mode (No Backend Required)

Run the frontend completely standalone with MSW mocks:

```bash
# .env.development
VITE_USE_MOCKS=true
VITE_API_URL=http://localhost:8000

# Start with mocks
npm run dev:mock
```

**Behavior**:
- All API calls intercepted by MSW handlers
- Faker.js generates deterministic test data (seed: 12345)
- Full CRUD operations supported (mutable mock state)
- No backend needed

**When to use**:
- Frontend-only development
- UI prototyping
- Integration testing
- Demo environments

---

### Connected Mode (Real API)

Connect to a running FastAPI backend:

```bash
# .env.development
VITE_USE_MOCKS=false
VITE_API_URL=http://localhost:8000

# Start without mocks
npm run dev
```

**Prerequisites**:
- FastAPI backend running at the configured URL
- Types generated from shared OpenAPI spec

---

## Authentication Configuration

Choose an authentication provider or use mock auth for development.

### Option 1: Mock Auth (Development Only)

For local development without real authentication:

```bash
# .env.development
VITE_AUTH_ENABLED=true
VITE_AUTH_PROVIDER=mock
```

**Behavior**:
- Auto-logged in as test user
- No login/logout UI needed
- Useful for testing protected routes

---

### Option 2: Ory

Ory is an open-source identity platform, recommended for multi-tenant SaaS.

```bash
# .env.production
VITE_AUTH_ENABLED=true
VITE_AUTH_PROVIDER=ory
VITE_ORY_URL=https://your-project.projects.oryapis.com
```

**Prerequisites**:
1. Create Ory project at https://console.ory.sh
2. Configure allowed redirect URIs
3. Get your project URL

---

### Option 3: Auth0

Auth0 is a cloud identity provider with easy setup.

```bash
# .env.production
VITE_AUTH_ENABLED=true
VITE_AUTH_PROVIDER=auth0
VITE_AUTH0_DOMAIN=your-tenant.auth0.com
VITE_AUTH0_CLIENT_ID=your-client-id
```

**Prerequisites**:
1. Create Auth0 application (Single Page Application type)
2. Configure Allowed Callback URLs
3. Configure Allowed Logout URLs
4. Configure Allowed Web Origins

---

### Option 4: Keycloak

Keycloak is an open-source identity provider, good for self-hosted deployments.

```bash
# .env.production
VITE_AUTH_ENABLED=true
VITE_AUTH_PROVIDER=keycloak
VITE_KEYCLOAK_URL=https://keycloak.example.com
VITE_KEYCLOAK_REALM=your-realm
VITE_KEYCLOAK_CLIENT_ID=your-client-id
```

---

### Option 5: AWS Cognito

AWS Cognito integrates well with AWS-hosted applications.

```bash
# .env.production
VITE_AUTH_ENABLED=true
VITE_AUTH_PROVIDER=cognito
VITE_COGNITO_USER_POOL_ID=us-east-1_xxxxx
VITE_COGNITO_CLIENT_ID=your-app-client-id
VITE_COGNITO_REGION=us-east-1
```

---

## Production Configuration

```bash
# .env.production
VITE_USE_MOCKS=false
VITE_API_URL=https://api.example.com
VITE_AUTH_ENABLED=true
VITE_AUTH_PROVIDER=ory
VITE_ORY_URL=https://your-project.projects.oryapis.com
```

---

## Docker Configuration

### Development Image

```bash
# Uses development server with hot reload
npm run docker:dev
```

### Production Image

```bash
# Static nginx build (no Node.js runtime)
npm run docker:prod
```

Environment variables are baked into the build at `npm run build` time. For runtime configuration in Docker, inject variables before build.

---

## DevSpace Configuration

DevSpace supports both standalone frontend and full-stack development.

### Frontend-Only Development

```bash
cd react-template
devspace dev
```

Uses the local `devspace.yaml` to deploy just the frontend to k3d cluster.

### Full-Stack Development

```bash
cd ..  # workspace root
devspace dev
```

Uses workspace-level `devspace.yaml` to deploy both frontend and backend together.

---

## Related Files

- [CLAUDE.md](CLAUDE.md) - Development patterns and conventions
- [AGENTS.md](AGENTS.md) - Quick reference for Claude agents
- [TESTING_GUIDE.md](TESTING_GUIDE.md) - Testing patterns
