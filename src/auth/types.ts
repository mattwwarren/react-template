/**
 * Core authentication types for the auth system.
 * All auth providers must conform to these interfaces.
 */

export interface AuthUser {
  id: string
  email: string
  name: string
}

export interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

export interface AuthContextValue extends AuthState {
  login: () => void | Promise<void>
  logout: () => void | Promise<void>
}

export type AuthProviderType = 'mock' | 'ory' | 'auth0' | 'keycloak' | 'cognito'

/**
 * Interface that all auth provider implementations must follow.
 * The wrapper is optional - used by providers like Auth0 that need their own context.
 */
export interface AuthProviderImplementation {
  useAuthState: () => AuthState
  login: () => void | Promise<void>
  logout: () => void | Promise<void>
  wrapper?: React.ComponentType<{ children: React.ReactNode }>
}
