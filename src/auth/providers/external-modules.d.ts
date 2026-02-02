/**
 * Type declarations for optional auth provider SDKs.
 * These declarations allow TypeScript to compile even when the SDKs are not installed.
 * The actual runtime behavior gracefully handles missing modules via dynamic imports.
 */

declare module '@ory/client-fetch' {
  export class Configuration {
    constructor(options: { basePath: string; credentials?: string })
  }

  export class FrontendApi {
    constructor(config: Configuration)
    toSession(): Promise<{
      identity: {
        id: string
        traits: {
          email: string
          name?: { first?: string; last?: string }
        }
      }
    }>
    createBrowserLogoutFlow(): Promise<{ logout_url: string }>
  }
}

declare module '@auth0/auth0-react' {
  import type { ComponentType, ReactNode } from 'react'

  export interface Auth0ProviderProps {
    domain: string
    clientId: string
    authorizationParams?: {
      redirect_uri?: string
      audience?: string
    }
    children: ReactNode
  }

  export const Auth0Provider: ComponentType<Auth0ProviderProps>

  export interface User {
    sub: string
    email?: string
    name?: string
    nickname?: string
  }

  export function useAuth0(): {
    isAuthenticated: boolean
    isLoading: boolean
    user?: User
    error?: Error
    loginWithRedirect: () => Promise<void>
    logout: (options?: { logoutParams?: { returnTo?: string } }) => void
  }
}

declare module 'keycloak-js' {
  interface KeycloakConfig {
    url: string
    realm: string
    clientId: string
  }

  interface KeycloakInitOptions {
    onLoad: string
    checkLoginIframe: boolean
  }

  class Keycloak {
    authenticated?: boolean
    token?: string
    tokenParsed?: {
      sub: string
      email?: string
      name?: string
      preferred_username?: string
    }
    constructor(config: KeycloakConfig)
    init(options: KeycloakInitOptions): Promise<boolean>
    login(): Promise<void>
    logout(options?: { redirectUri?: string }): Promise<void>
    updateToken(minValidity: number): Promise<boolean>
  }

  export default Keycloak
}

declare module 'aws-amplify' {
  interface AmplifyConfig {
    Auth?: {
      Cognito?: {
        userPoolId: string
        userPoolClientId: string
        loginWith?: {
          oauth?: {
            domain: string
            scopes: string[]
            redirectSignIn: string[]
            redirectSignOut: string[]
            responseType: string
          }
        }
      }
    }
  }

  export const Amplify: {
    configure(config: AmplifyConfig): void
  }
}

declare module 'aws-amplify/auth' {
  export interface AuthSession {
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

  export function fetchAuthSession(): Promise<AuthSession>
  export function signInWithRedirect(): Promise<void>
  export function signOut(): Promise<void>

  export const Hub: {
    listen(channel: string, callback: (data: { payload: { event: string } }) => void): () => void
  }
}
