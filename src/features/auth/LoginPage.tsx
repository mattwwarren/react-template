import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth'
import { LoadingSpinner } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoginForm } from './components/LoginForm'

const PROVIDER_LABELS: Record<string, string> = {
  mock: 'Development Mode',
  ory: 'Ory',
  auth0: 'Auth0',
  keycloak: 'Keycloak',
  cognito: 'AWS Cognito',
}

/**
 * Login page with provider-specific UI.
 * - Mock provider: Shows LoginForm with email input
 * - Real providers: Shows button to redirect to SSO
 */
export function LoginPage(): React.ReactElement {
  const { isAuthenticated, isLoading, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const providerType = (import.meta.env.VITE_AUTH_PROVIDER as string) || 'mock'
  const providerLabel = PROVIDER_LABELS[providerType] || providerType

  // Redirect to intended destination after login
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/'
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, navigate, location])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  const handleMockLogin = (): void => {
    void login()
  }

  const handleSsoLogin = (): void => {
    void login()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Sign In</CardTitle>
          <CardDescription>
            {providerType === 'mock'
              ? 'Development mode - automatic login'
              : `Sign in with ${providerLabel} to continue`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {providerType === 'mock' ? (
            <LoginForm onSubmit={handleMockLogin} />
          ) : (
            <Button onClick={handleSsoLogin} className="w-full">
              Sign in with {providerLabel}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default LoginPage
