import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/auth'
import { LoadingSpinner } from '@/components/shared'
import { getSelectedOrganization, setSelectedOrganization } from '@/lib/organization'
import { OrganizationPicker } from './OrganizationPicker'

/**
 * OAuth callback handler for real auth providers.
 * Handles the redirect back from SSO providers after authentication.
 * Currently a placeholder - real implementations will handle provider-specific callbacks.
 */
export function AuthCallback(): React.ReactElement {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login, logout } = useAuth()
  const [needsOrgSelection, setNeedsOrgSelection] = useState(false)

  useEffect(() => {
    async function handleCallback() {
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

      // Check for Ory authentication assurance level (aal)
      const aal = searchParams.get('aal')

      if (aal) {
        // Session cookie set by Kratos - validate via login()
        try {
          await login() // Calls toSession() to validate

          // NEW: Check if org already selected
          const selectedOrg = getSelectedOrganization()
          if (!selectedOrg) {
            setNeedsOrgSelection(true)
            return
          }

          const returnTo = searchParams.get('return_to') || '/'
          navigate(returnTo, { replace: true })
        } catch (err) {
          console.error('Session validation failed:', err)
          navigate('/login', {
            replace: true,
            state: { error: 'Failed to validate session' },
          })
        }
      } else {
        // No aal parameter - just redirect
        const returnTo = searchParams.get('return_to') || '/'
        navigate(returnTo, { replace: true })
      }
    }

    void handleCallback()
  }, [navigate, searchParams, login])

  // NEW: Memoized callback (prevents infinite loops)
  const handleOrgSelect = useCallback(
    (orgId: string) => {
      setSelectedOrganization(orgId)
      const returnTo = searchParams.get('return_to') || '/'
      navigate(returnTo, { replace: true })
    },
    [searchParams, navigate]
  )

  // NEW: Logout handler
  const handleLogout = useCallback(() => {
    logout()
  }, [logout])

  // Show org picker if needed
  if (needsOrgSelection) {
    return <OrganizationPicker onSelect={handleOrgSelect} onLogout={handleLogout} />
  }

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
