# React Template

React UI template for consuming FastAPI backends.

## Overview

This template provides a production-ready React frontend that integrates with the [fastapi-template](../fastapi-template) backend. It demonstrates:

- Type-safe API consumption (generated from OpenAPI)
- Authentication UI (Ory, Auth0, Keycloak, Cognito)
- Mock-first development (MSW + Faker.js)
- Modern React patterns (TanStack Query, React Router 6)
- Full DevOps (Docker, DevSpace)

## Quick Start

```bash
# Development with mocks (no backend needed)
npm install
npm run dev:mock

# Development with real API
npm run generate:types  # Requires backend at localhost:8000
npm run dev
```

## Technology Stack

| Layer | Technology |
|-------|------------|
| Build | Vite 5.x |
| Framework | React 18 + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| State | TanStack Query |
| Forms | React Hook Form + Zod |
| Testing | Vitest + Playwright |
| Container | Docker (multi-stage) |
| Orchestration | DevSpace |

---

## Deployment Options

This template supports two deployment modes:

### Option A: Independent Deployment (Default)

Run the frontend standalone with its own k3d cluster. Best for:
- Frontend-only development with MSW mocks
- CI/CD pipelines testing frontend in isolation
- Teams working primarily on UI

```bash
cd react-template

# Start local k3d cluster with frontend only
devspace dev

# Access at http://localhost:5173
```

**Configuration:**
- Uses own cluster: `react_template`
- API URL defaults to mock service or external URL
- Set `VITE_USE_MOCKS=true` for mock data

### Option B: Full-Stack Deployment

Run alongside the backend in a shared cluster. Best for:
- Integration testing
- E2E development
- Staging/production environments

**Method 1: Shared Cluster (Manual)**
```bash
# Terminal 1: Start backend
cd fastapi-template
CLUSTER_NAME=fullstack devspace dev

# Terminal 2: Start frontend (same cluster)
cd react-template
CLUSTER_NAME=fullstack API_URL=http://fastapi-template.warren-enterprises-ltd.svc.cluster.local devspace dev
```

**Method 2: Workspace DevSpace (Recommended)**
```bash
# From workspace root
cd meta-work
devspace dev

# Starts both services in coordinated cluster
# Frontend: http://localhost:5173
# Backend: http://localhost:8000
```

See [Workspace DevSpace Configuration](#workspace-devspace-configuration) below.

---

## DevSpace Commands

| Command | Description |
|---------|-------------|
| `devspace dev` | Start development with hot reload |
| `devspace run build-prod` | Build production Docker image |
| `devspace run k3d-down` | Delete local k3d cluster |

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `CLUSTER_NAME` | `react_template` | k3d cluster name |
| `NAMESPACE` | `warren-enterprises-ltd` | Kubernetes namespace |
| `API_URL` | (in-cluster service) | Backend API URL |
| `VITE_USE_MOCKS` | `false` | Enable MSW mock handlers |

---

## Docker Builds

### Development Build
```bash
docker build -f docker/Dockerfile --target dev -t react-template:dev .
docker run -p 5173:5173 -v $(pwd)/src:/app/src react-template:dev
```

### Production Build
```bash
docker build -f docker/Dockerfile --target prod -t react-template:prod .
docker run -p 8080:80 -e API_URL=http://api.example.com react-template:prod
```

The production build:
- Multi-stage: builds static assets, serves via nginx
- Runtime API_URL configuration via nginx environment substitution
- Health check endpoint at `/health`
- Gzipped assets with proper cache headers

---

## Workspace DevSpace Configuration

For full-stack development, use the workspace-level `devspace.yaml` at the repository root:

```yaml
# meta-work/devspace.yaml
version: v2beta1
name: "meta_workspace"

# Orchestrates both frontend and backend
# See workspace root for full configuration
```

**Features:**
- Single `devspace dev` command starts both services
- Shared k3d cluster with proper networking
- Coordinated port mapping (5173 for UI, 8000 for API)
- Frontend auto-configured to reach backend via in-cluster DNS

---

## Testing

```bash
# Unit tests with Vitest
npm test

# E2E tests with Playwright
npm run test:e2e

# Coverage report
npm run test:coverage
```

## Documentation

- [CLAUDE.md](./CLAUDE.md) - Development patterns and conventions

## License

MIT
