import type { AuthProviderImplementation, AuthProviderType } from '../types'
import { createMockProvider } from './mock'

/**
 * Synchronous mock provider export for immediate initialization.
 * Used by AuthProvider to avoid loading state for mock auth.
 */
export { createMockProvider as createMockProviderSync }

/**
 * Factory function that creates the appropriate auth provider based on type.
 * Uses dynamic imports to load providers on demand with fallback to mock if SDK unavailable.
 *
 * In a Copier-generated project, only the selected provider SDK is installed.
 * In the template, SDKs may not be installed - we fall back to mock gracefully.
 */
export async function createAuthProvider(type: AuthProviderType): Promise<AuthProviderImplementation> {
  switch (type) {
    case 'mock':
      return createMockProvider()

    case 'ory':
      try {
        const { createOryProvider } = await import('./ory')
        return createOryProvider()
      } catch (e) {
        console.warn('Ory SDK not available, falling back to mock provider:', e)
        return createMockProvider()
      }

    case 'auth0':
      try {
        const { createAuth0Provider } = await import('./auth0')
        return createAuth0Provider()
      } catch (e) {
        console.warn('Auth0 SDK not available, falling back to mock provider:', e)
        return createMockProvider()
      }

    case 'keycloak':
      try {
        const { createKeycloakProvider } = await import('./keycloak')
        return createKeycloakProvider()
      } catch (e) {
        console.warn('Keycloak SDK not available, falling back to mock provider:', e)
        return createMockProvider()
      }

    case 'cognito':
      try {
        const { createCognitoProvider } = await import('./cognito')
        return createCognitoProvider()
      } catch (e) {
        console.warn('Cognito SDK not available, falling back to mock provider:', e)
        return createMockProvider()
      }

    default: {
      const exhaustiveCheck: never = type
      console.warn(`Unknown auth provider: ${exhaustiveCheck}, falling back to mock`)
      return createMockProvider()
    }
  }
}
