import type { AuthProviderImplementation, AuthState } from '../types'
import { createExternalAuthStore } from './createExternalStore'

// Ory SDK types (optional dependency)
interface OrySession {
  identity: {
    id: string
    traits: {
      email: string
      name?: { first?: string; last?: string }
    }
  }
}

interface OryFrontendApi {
  toSession(): Promise<OrySession>
  createBrowserLogoutFlow(): Promise<{ logout_url: string }>
}

// External store for auth state (using shared utility)
const store = createExternalAuthStore()

function getOryConfig(): { sdkUrl: string } {
  const sdkUrl = import.meta.env.VITE_ORY_SDK_URL as string
  if (!sdkUrl) {
    throw new Error('VITE_ORY_SDK_URL environment variable is required for Ory authentication')
  }
  return { sdkUrl }
}

async function createOryClient(): Promise<OryFrontendApi | null> {
  try {
    // Dynamically import Ory SDK (only if installed)
    const { FrontendApi, Configuration } = await import('@ory/client-fetch')
    const config = getOryConfig()
    const oryConfig = new Configuration({
      basePath: config.sdkUrl,
      credentials: 'include',
    })
    return new FrontendApi(oryConfig)
  } catch {
    console.error('Ory SDK (@ory/client-fetch) not installed. Please run: npm install @ory/client-fetch')
    return null
  }
}

async function checkSession(): Promise<void> {
  store.setLoading(true)
  store.setState({ error: null })

  try {
    const client = await createOryClient()
    if (!client) {
      store.setError('Ory SDK not available')
      return
    }

    const session = await client.toSession()
    const traits = session.identity.traits
    const firstName = traits.name?.first || ''
    const lastName = traits.name?.last || ''
    const name = [firstName, lastName].filter(Boolean).join(' ') || traits.email.split('@')[0] || 'User'

    store.setUser({
      id: session.identity.id,
      email: traits.email,
      name,
    })
  } catch (err) {
    // No session or error - user is not authenticated
    store.setUser(null)
    if (err instanceof Error && !err.message.includes('401')) {
      store.setError(err.message)
    }
  }
}

async function login(): Promise<void> {
  const config = getOryConfig()
  // Redirect to Ory login UI
  const returnTo = encodeURIComponent(window.location.href)
  window.location.href = `${config.sdkUrl}/self-service/login/browser?return_to=${returnTo}`
}

async function logout(): Promise<void> {
  try {
    const client = await createOryClient()
    if (!client) {
      store.setUser(null)
      return
    }

    const { logout_url } = await client.createBrowserLogoutFlow()
    window.location.href = logout_url
  } catch (err) {
    console.error('Logout error:', err)
    store.setUser(null)
  }
}

// Initialize on first use
let initialized = false
function ensureInitialized(): void {
  if (!initialized) {
    initialized = true
    void checkSession()
  }
}

/**
 * Ory authentication provider.
 * Uses @ory/client-fetch for session management.
 * Redirects to Ory hosted UI for login/logout.
 */
export function createOryProvider(): AuthProviderImplementation {
  ensureInitialized()

  const useAuthState = (): AuthState => {
    const state = store.useStore()
    return {
      user: state.user,
      isAuthenticated: state.user !== null,
      isLoading: state.isLoading,
      error: state.error,
    }
  }

  return {
    useAuthState,
    login,
    logout,
  }
}

// Reset for testing
export function resetOryAuth(): void {
  store.reset()
  initialized = false
}
