import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/auth'
import { LoadingSpinner } from '@/components/shared'

/**
 * Route wrapper that redirects unauthenticated users to login.
 * Shows a loading spinner while checking auth state.
 * Preserves the intended destination for post-login redirect.
 */
export function ProtectedRoute(): React.ReactElement {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!isAuthenticated) {
    // Redirect to login, preserving intended destination
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}

export default ProtectedRoute
