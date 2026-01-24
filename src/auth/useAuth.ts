import { useContext } from 'react'
import type { AuthContextValue } from './types'
import { AuthContext } from './AuthContext'

/**
 * Hook to access auth state and methods.
 * Must be used within an AuthProvider.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
