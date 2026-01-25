import { useEffect } from 'react'
import type { AuthProviderImplementation, AuthState } from '../types'
import { createExternalAuthStore } from './createExternalStore'

// Cognito/Amplify types (optional dependency)
interface AuthSession {
  tokens?: {
    idToken?: {
      payload: {
        sub: string
        email?: string
        name?: string
        'cognito:username'?: string
      }
    }
  }
}

// External store for auth state (using shared utility)
const store = createExternalAuthStore()

interface CognitoConfig {
  region: string
  userPoolId: string
  userPoolClientId: string
  domain?: string
}

function getCognitoConfig(): CognitoConfig {
  const region = import.meta.env.VITE_COGNITO_REGION as string
  const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID as string
  const userPoolClientId = import.meta.env.VITE_COGNITO_CLIENT_ID as string
  const domain = import.meta.env.VITE_COGNITO_DOMAIN as string | undefined

  if (!region || !userPoolId || !userPoolClientId) {
    throw new Error(
      'VITE_COGNITO_REGION, VITE_COGNITO_USER_POOL_ID, and VITE_COGNITO_CLIENT_ID environment variables are required for Cognito authentication'
    )
  }

  const config: CognitoConfig = { region, userPoolId, userPoolClientId }
  if (domain) {
    config.domain = domain
  }
  return config
}

async function initCognito(): Promise<void> {
  store.setLoading(true)
  store.setState({ error: null })

  try {
    // Dynamically import Amplify SDK (only if installed)
    const { Amplify } = await import('aws-amplify')
    const { fetchAuthSession } = await import('aws-amplify/auth')

    const config = getCognitoConfig()

    // Configure Amplify
    const cognitoConfig: Record<string, unknown> = {
      userPoolId: config.userPoolId,
      userPoolClientId: config.userPoolClientId,
    }
    if (config.domain) {
      cognitoConfig.loginWith = {
        oauth: {
          domain: config.domain,
          scopes: ['openid', 'email', 'profile'],
          redirectSignIn: [`${window.location.origin}/auth/callback`],
          redirectSignOut: [window.location.origin],
          responseType: 'code',
        },
      }
    }
    Amplify.configure({
      Auth: {
        Cognito: cognitoConfig,
      },
    })

    // Check current session
    const session = (await fetchAuthSession()) as AuthSession
    if (session.tokens?.idToken) {
      const payload = session.tokens.idToken.payload
      store.setUser({
        id: payload.sub,
        email: payload.email || '',
        name: payload.name || payload['cognito:username'] || payload.email?.split('@')[0] || 'User',
      })
    } else {
      store.setUser(null)
    }
  } catch (err) {
    if (err instanceof Error) {
      if (err.message.includes('Cannot find module') || err.message.includes('aws-amplify')) {
        store.setError(
          'AWS Amplify SDK not installed. Please run: npm install aws-amplify @aws-amplify/auth'
        )
      } else if (!err.message.includes('No current user')) {
        // "No current user" is expected when not logged in
        store.setError(err.message)
      }
    }
    store.setUser(null)
  }
}

async function login(): Promise<void> {
  try {
    const { signInWithRedirect } = await import('aws-amplify/auth')
    await signInWithRedirect()
  } catch {
    // Fallback: redirect to Cognito Hosted UI manually
    const config = getCognitoConfig()
    if (config.domain) {
      const returnTo = encodeURIComponent(`${window.location.origin}/auth/callback`)
      window.location.href = `https://${config.domain}/login?client_id=${config.userPoolClientId}&response_type=code&scope=openid+email+profile&redirect_uri=${returnTo}`
    } else {
      console.error('Cognito domain not configured for hosted UI login')
    }
  }
}

async function logout(): Promise<void> {
  try {
    const { signOut } = await import('aws-amplify/auth')
    await signOut()
    store.setUser(null)
  } catch {
    // Fallback: redirect to Cognito logout manually
    const config = getCognitoConfig()
    if (config.domain) {
      const returnTo = encodeURIComponent(window.location.origin)
      window.location.href = `https://${config.domain}/logout?client_id=${config.userPoolClientId}&logout_uri=${returnTo}`
    }
    store.setUser(null)
  }
}

// Initialize on first use
let initialized = false
function ensureInitialized(): void {
  if (!initialized) {
    initialized = true
    void initCognito()
  }
}

/**
 * AWS Cognito authentication provider.
 * Uses aws-amplify for authentication.
 * Supports Cognito Hosted UI for login/logout.
 */
export function createCognitoProvider(): AuthProviderImplementation {
  ensureInitialized()

  const useAuthState = (): AuthState => {
    const state = store.useStore()

    // Listen for auth events
    useEffect(() => {
      let cleanup = (): void => {}

      void import('aws-amplify/auth')
        .then(({ Hub }) => {
          const unsubscribe = Hub.listen('auth', ({ payload }) => {
            switch (payload.event) {
              case 'signedIn':
                void initCognito()
                break
              case 'signedOut':
                store.setUser(null)
                break
            }
          })
          cleanup = unsubscribe
        })
        .catch(() => {
          // SDK not available
        })

      return () => cleanup()
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
export function resetCognitoAuth(): void {
  store.reset()
  initialized = false
}
