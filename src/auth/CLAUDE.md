# Authentication Layer

Provider-agnostic auth with env-driven provider selection.

## Provider Interface

```typescript
interface AuthProviderImplementation {
  useAuthState: () => AuthState       // Hook returning { user, isAuthenticated, isLoading, error }
  login: () => void | Promise<void>
  logout: () => void | Promise<void>
  wrapper?: React.ComponentType<{ children: React.ReactNode }>  // Optional (e.g., Auth0Provider)
}
```

All providers implement this interface. The `context.tsx` module loads the right provider based on `VITE_AUTH_PROVIDER` env var.

## Provider Selection

```
VITE_AUTH_PROVIDER=mock      # Default - auto-logged-in dev user
VITE_AUTH_PROVIDER=ory       # Ory Kratos
VITE_AUTH_PROVIDER=auth0     # Auth0
VITE_AUTH_PROVIDER=keycloak  # Keycloak
VITE_AUTH_PROVIDER=cognito   # AWS Cognito
```

- Mock provider loads **synchronously** (no loading flash in dev)
- All other providers load **asynchronously** via dynamic import

## Mock Provider

Uses React 18 `useSyncExternalStore` for external state management:

```typescript
const useAuthState = () => {
  const user = useSyncExternalStore(subscribe, () => currentUser)
  return { user, isAuthenticated: user !== null, isLoading, error: null }
}
```

- Default dev user: `{ id: '0000...', email: 'dev@example.com', name: 'Dev User' }`
- Persists to localStorage across reloads
- External store pattern allows login/logout outside component tree

## AuthUser Model

Minimal: `{ id: string, email: string, name: string }`. No roles or permissions at this level.

## Consuming Auth

```tsx
import { useAuth } from '@/auth/context'

function MyComponent() {
  const { user, isAuthenticated, isLoading } = useAuth()
}
```

## Adding a New Provider

1. Create `providers/newprovider.ts` implementing `AuthProviderImplementation`
2. Add case to `createAuthProvider()` in `context.tsx`
3. Add env vars to `.env.example`
