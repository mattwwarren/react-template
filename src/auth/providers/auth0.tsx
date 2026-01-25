/* eslint-disable react-refresh/only-export-components */
// This file exports both factory functions and components, which is expected for auth providers
import { useEffect, useState, useSyncExternalStore } from 'react'
import type { AuthProviderImplementation, AuthState, AuthUser } from '../types'

// Auth0 SDK types (optional dependency)
interface Auth0User {
  sub: string
  email?: string
  name?: string
  nickname?: string
}

interface Auth0Context {
  isAuthenticated: boolean
  isLoading: boolean
  user?: Auth0User
  error?: Error
  loginWithRedirect: () => Promise<void>
  logout: (options?: { logoutParams?: { returnTo?: string } }) => void
}

interface Auth0ProviderProps {
  domain: string
  clientId: string
  authorizationParams?: {
    redirect_uri?: string
    audience?: string
  }
  children: React.ReactNode
}

// External store for auth state
let currentState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
}
const listeners = new Set<() => void>()

function emitChange(): void {
  for (const listener of listeners) {
    listener()
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot(): AuthState {
  return currentState
}

// Store for auth0 context and SDK
let auth0Context: Auth0Context | null = null
let useAuth0Hook: (() => Auth0Context) | null = null
let Auth0ProviderComponent: React.ComponentType<Auth0ProviderProps> | null = null

interface Auth0Config {
  domain: string
  clientId: string
  audience?: string
}

function getAuth0Config(): Auth0Config {
  const domain = import.meta.env.VITE_AUTH0_DOMAIN as string
  const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID as string
  const audience = import.meta.env.VITE_AUTH0_AUDIENCE as string | undefined

  if (!domain || !clientId) {
    throw new Error(
      'VITE_AUTH0_DOMAIN and VITE_AUTH0_CLIENT_ID environment variables are required for Auth0 authentication'
    )
  }

  const config: Auth0Config = { domain, clientId }
  if (audience) {
    config.audience = audience
  }
  return config
}

async function loadAuth0Sdk(): Promise<boolean> {
  try {
    const auth0React = await import('@auth0/auth0-react')
    useAuth0Hook = auth0React.useAuth0
    Auth0ProviderComponent = auth0React.Auth0Provider
    return true
  } catch {
    console.error(
      'Auth0 SDK (@auth0/auth0-react) not installed. Please run: npm install @auth0/auth0-react'
    )
    currentState = {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: 'Auth0 SDK not available',
    }
    emitChange()
    return false
  }
}

// Try to load SDK on module init
let sdkLoaded = false
let sdkLoadPromise: Promise<boolean> | null = null

function ensureSdkLoaded(): Promise<boolean> {
  if (sdkLoaded) return Promise.resolve(true)
  if (!sdkLoadPromise) {
    sdkLoadPromise = loadAuth0Sdk().then((loaded) => {
      sdkLoaded = loaded
      return loaded
    })
  }
  return sdkLoadPromise
}

function updateStateFromAuth0Context(): void {
  if (!auth0Context) return

  const { isAuthenticated, isLoading, user, error } = auth0Context
  const authUser: AuthUser | null = user
    ? {
        id: user.sub,
        email: user.email || '',
        name: user.name || user.nickname || user.email?.split('@')[0] || 'User',
      }
    : null

  currentState = {
    user: authUser,
    isAuthenticated,
    isLoading,
    error: error?.message || null,
  }
  emitChange()
}

/**
 * Auth0 authentication provider.
 * Uses @auth0/auth0-react for authentication.
 * Provides Auth0Provider wrapper for the app.
 */
export function createAuth0Provider(): AuthProviderImplementation {
  const useAuthState = (): AuthState => {
    return useSyncExternalStore(subscribe, getSnapshot, () => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    }))
  }

  const login = async (): Promise<void> => {
    if (auth0Context) {
      await auth0Context.loginWithRedirect()
    } else {
      // Fallback: redirect to Auth0 login manually
      const config = getAuth0Config()
      const returnTo = encodeURIComponent(window.location.origin + '/auth/callback')
      window.location.href = `https://${config.domain}/authorize?client_id=${config.clientId}&redirect_uri=${returnTo}&response_type=code&scope=openid%20profile%20email`
    }
  }

  const logout = (): void => {
    if (auth0Context) {
      auth0Context.logout({
        logoutParams: { returnTo: window.location.origin },
      })
    } else {
      // Fallback: redirect to Auth0 logout manually
      const config = getAuth0Config()
      const returnTo = encodeURIComponent(window.location.origin)
      window.location.href = `https://${config.domain}/v2/logout?client_id=${config.clientId}&returnTo=${returnTo}`
    }
  }

  // Create wrapper component that provides Auth0 context
  function Auth0Wrapper({ children }: { children: React.ReactNode }): React.ReactElement {
    const [ready, setReady] = useState(false)

    useEffect(() => {
      void ensureSdkLoaded().then((loaded) => setReady(loaded))
    }, [])

    if (!ready || !Auth0ProviderComponent) {
      return <>{children}</>
    }

    const config = getAuth0Config()
    const Provider = Auth0ProviderComponent

    const authParams: { redirect_uri: string; audience?: string } = {
      redirect_uri: window.location.origin + '/auth/callback',
    }
    if (config.audience) {
      authParams.audience = config.audience
    }

    return (
      <Provider domain={config.domain} clientId={config.clientId} authorizationParams={authParams}>
        <Auth0ContextBridge>{children}</Auth0ContextBridge>
      </Provider>
    )
  }

  return {
    useAuthState,
    login,
    logout,
    wrapper: Auth0Wrapper,
  }
}

/**
 * Bridge component that syncs Auth0 context to our external store.
 * This component always calls useAuth0 hook (unconditionally).
 * It should only be rendered when the SDK is loaded and useAuth0Hook is available.
 */
function Auth0ContextBridgeWithHook({
  children,
}: {
  children: React.ReactNode
}): React.ReactElement {
  // useAuth0Hook is guaranteed to be non-null when this component renders
  // (only rendered inside Auth0Provider after SDK loads)
  const context = useAuth0Hook!()

  useEffect(() => {
    auth0Context = context
    updateStateFromAuth0Context()
  }, [context, context.isAuthenticated, context.isLoading, context.user, context.error])

  return <>{children}</>
}

/**
 * Bridge wrapper that conditionally renders the hook-using component.
 * This pattern ensures hooks are called unconditionally within Auth0ContextBridgeWithHook.
 */
function Auth0ContextBridge({ children }: { children: React.ReactNode }): React.ReactElement {
  // Only render the hook-using component if SDK is available
  if (useAuth0Hook) {
    return <Auth0ContextBridgeWithHook>{children}</Auth0ContextBridgeWithHook>
  }
  return <>{children}</>
}

// Reset for testing
export function resetAuth0(): void {
  auth0Context = null
  currentState = {
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  }
  emitChange()
}
