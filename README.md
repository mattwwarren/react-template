# React Template

React UI template for consuming FastAPI backends.

> **Status:** Under development. See `~/.claude/plans/react-template/main.md` for implementation plan.

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

- **Build:** Vite 5.x
- **Framework:** React 18 + TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **State:** TanStack Query
- **Forms:** React Hook Form + Zod
- **Testing:** Vitest + Playwright

## Documentation

- [CLAUDE.md](./CLAUDE.md) - Development patterns and conventions
- [Plan](~/.claude/plans/react-template/main.md) - Implementation roadmap

## License

MIT
