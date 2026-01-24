import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { LoadingSpinner } from '@/components/shared'

/**
 * OAuth callback handler for real auth providers.
 * Handles the redirect back from SSO providers after authentication.
 * Currently a placeholder - real implementations will handle provider-specific callbacks.
 */
export function AuthCallback(): React.ReactElement {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    // Get the error if any
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    if (error) {
      console.error('Auth callback error:', error, errorDescription)
      navigate('/login', {
        replace: true,
        state: { error: errorDescription || error },
      })
      return
    }

    // For real providers, this would handle the callback
    // For now, just redirect to home (mock provider doesn't use this)
    const returnTo = searchParams.get('return_to') || '/'
    navigate(returnTo, { replace: true })
  }, [navigate, searchParams])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <LoadingSpinner />
        <p className="mt-4 text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  )
}

export default AuthCallback
