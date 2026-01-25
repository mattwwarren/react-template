import { useEffect } from 'react'
import type { AuthProviderImplementation, AuthState } from '../types'
import { createExternalAuthStore } from './createExternalStore'

// Keycloak types (optional dependency)
interface KeycloakInstance {
  authenticated?: boolean
  token?: string
  tokenParsed?: {
    sub: string
    email?: string
    name?: string
    preferred_username?: string
  }
  init(options: { onLoad: string; checkLoginIframe: boolean }): Promise<boolean>
  login(): Promise<void>
  logout(options?: { redirectUri?: string }): Promise<void>
  updateToken(minValidity: number): Promise<boolean>
}

interface KeycloakConfig {
  url: string
  realm: string
  clientId: string
}

// External store for auth state (using shared utility)
const store = createExternalAuthStore()
let keycloakInstance: KeycloakInstance | null = null

function getKeycloakConfig(): KeycloakConfig {
  const url = import.meta.env.VITE_KEYCLOAK_URL as string
  const realm = import.meta.env.VITE_KEYCLOAK_REALM as string
  const clientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID as string

  if (!url || !realm || !clientId) {
    throw new Error(
      'VITE_KEYCLOAK_URL, VITE_KEYCLOAK_REALM, and VITE_KEYCLOAK_CLIENT_ID environment variables are required for Keycloak authentication'
    )
  }

  return { url, realm, clientId }
}

async function initKeycloak(): Promise<void> {
  store.setLoading(true)
  store.setState({ error: null })

  try {
    // Dynamically import Keycloak SDK (only if installed)
    const KeycloakModule = await import('keycloak-js')
    const Keycloak = KeycloakModule.default
    const config = getKeycloakConfig()

    const kc = new Keycloak({
      url: config.url,
      realm: config.realm,
      clientId: config.clientId,
    })
    keycloakInstance = kc

    const authenticated = await kc.init({
      onLoad: 'check-sso',
      checkLoginIframe: false,
    })

    if (authenticated && kc.tokenParsed) {
      const token = kc.tokenParsed
      store.setUser({
        id: token.sub,
        email: token.email || '',
        name: token.name || token.preferred_username || token.email?.split('@')[0] || 'User',
      })
    } else {
      store.setUser(null)
    }
  } catch (err) {
    console.error('Keycloak initialization error:', err)
    if (err instanceof Error) {
      if (err.message.includes('Cannot find module')) {
        store.setError(
          'Keycloak SDK (keycloak-js) not installed. Please run: npm install keycloak-js'
        )
      } else {
        store.setError(err.message)
      }
    }
    store.setUser(null)
  }
}

async function login(): Promise<void> {
  if (keycloakInstance) {
    await keycloakInstance.login()
  } else {
    // Fallback: redirect to Keycloak login manually
    const config = getKeycloakConfig()
    const returnTo = encodeURIComponent(window.location.href)
    window.location.href = `${config.url}/realms/${config.realm}/protocol/openid-connect/auth?client_id=${config.clientId}&redirect_uri=${returnTo}&response_type=code&scope=openid%20profile%20email`
  }
}

async function logout(): Promise<void> {
  if (keycloakInstance) {
    await keycloakInstance.logout({
      redirectUri: window.location.origin,
    })
  } else {
    // Fallback: redirect to Keycloak logout manually
    const config = getKeycloakConfig()
    const returnTo = encodeURIComponent(window.location.origin)
    window.location.href = `${config.url}/realms/${config.realm}/protocol/openid-connect/logout?redirect_uri=${returnTo}`
  }
  store.setUser(null)
}

// Initialize on first use
let initialized = false
function ensureInitialized(): void {
  if (!initialized) {
    initialized = true
    void initKeycloak()
  }
}

/**
 * Keycloak authentication provider.
 * Uses keycloak-js for authentication.
 * Redirects to Keycloak hosted UI for login/logout.
 */
export function createKeycloakProvider(): AuthProviderImplementation {
  ensureInitialized()

  const useAuthState = (): AuthState => {
    const state = store.useStore()

    // Set up token refresh
    useEffect(() => {
      if (!keycloakInstance || !keycloakInstance.authenticated) return

      const refreshInterval = setInterval(() => {
        void keycloakInstance?.updateToken(60).catch(() => {
          // Token refresh failed - user needs to re-authenticate
          store.setUser(null)
        })
      }, 60000) // Check every minute

      return () => clearInterval(refreshInterval)
    }, [])

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
export function resetKeycloakAuth(): void {
  store.reset()
  keycloakInstance = null
  initialized = false
}
