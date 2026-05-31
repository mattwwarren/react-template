# Components

Reusable UI components organized by scope.

## Directory Structure

```
components/
  ui/          # shadcn/ui primitives (Button, Card, Dialog, Input, etc.)
  layout/      # App shell (Layout, Header, Sidebar)
  shared/      # Cross-feature components (DataTable, Pagination, ErrorBoundary)
```

## shadcn/ui (`ui/`)

Installed via CLI, customized with Tailwind theme:

```bash
npx shadcn-ui add button card dialog
```

**Prefer shadcn/ui components over custom implementations.** Check the shadcn/ui catalog before building a new component.

## Layout (`layout/`)

```tsx
export function Layout({ children }: { children?: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-muted/30 p-4 md:p-6">
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  )
}
```

- Fixed sidebar + header, scrollable main content
- `children ?? <Outlet />` supports both direct children and React Router outlet

## Shared (`shared/`)

Cross-feature reusable components:

- **DataTable** - Generic table with typed columns, loading states, key extraction
- **Pagination** - URL-driven via `useSearchParams` (modifies search params directly)
- **ErrorBoundary** - Catches render errors with fallback UI

## Utilities

`cn()` from `@/lib/utils` for className merging:

```typescript
import { cn } from '@/lib/utils'

<div className={cn("base-class", isActive && "active-class", className)} />
```

Uses `clsx` + `tailwind-merge` to handle Tailwind class conflicts.
