import { useState, useEffect, useMemo } from 'react'
import type { AuthContextValue, AuthProviderImplementation, AuthProviderType } from './types'
import { createAuthProvider, createMockProviderSync } from './providers'
import { AuthContext } from './AuthContext'

function getAuthProviderType(): AuthProviderType {
  const envValue = import.meta.env.VITE_AUTH_PROVIDER as string | undefined
  if (!envValue || envValue === 'mock') {
    return 'mock'
  }
  const validProviders: AuthProviderType[] = ['mock', 'ory', 'auth0', 'keycloak', 'cognito']
  if (validProviders.includes(envValue as AuthProviderType)) {
    return envValue as AuthProviderType
  }
  console.warn(`Invalid VITE_AUTH_PROVIDER: ${envValue}, falling back to mock`)
  return 'mock'
}

interface AuthProviderProps {
  children: React.ReactNode
}

/**
 * Internal component that renders once provider is loaded.
 * Separated to ensure hooks are called unconditionally.
 */
function AuthProviderContent({
  provider,
  children,
}: {
  provider: AuthProviderImplementation
  children: React.ReactNode
}): React.ReactElement {
  const authState = provider.useAuthState()

  const value: AuthContextValue = useMemo(
    () => ({
      ...authState,
      login: provider.login,
      logout: provider.logout,
    }),
    [authState, provider.login, provider.logout]
  )

  const content = <AuthContext.Provider value={value}>{children}</AuthContext.Provider>

  // Wrap in provider-specific wrapper if needed (e.g., Auth0Provider)
  if (provider.wrapper) {
    const Wrapper = provider.wrapper
    return <Wrapper>{content}</Wrapper>
  }

  return content
}

/**
 * Auth provider that wraps the app and provides authentication state.
 * Provider type is determined by VITE_AUTH_PROVIDER environment variable.
 * Mock provider loads synchronously; other providers load asynchronously.
 */
export function AuthProvider({ children }: AuthProviderProps): React.ReactElement {
  const providerType = getAuthProviderType()

  // Mock provider is always bundled and can be loaded synchronously
  // This avoids a loading flash for the most common case (development)
  const initialProvider = providerType === 'mock' ? createMockProviderSync() : null
  const [provider, setProvider] = useState<AuthProviderImplementation | null>(initialProvider)

  useEffect(() => {
    // Skip async loading if we already have the mock provider
    if (providerType === 'mock') return

    let mounted = true

    createAuthProvider(providerType).then((loadedProvider) => {
      if (mounted) {
        setProvider(loadedProvider)
      }
    })

    return () => {
      mounted = false
    }
  }, [providerType])

  // Show loading state while non-mock provider is being loaded
  if (!provider) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return <AuthProviderContent provider={provider}>{children}</AuthProviderContent>
}
