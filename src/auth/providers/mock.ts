import { useSyncExternalStore } from 'react'
import { clearSelectedOrganization } from '@/lib/organization'
import type { AuthProviderImplementation, AuthState, AuthUser } from '../types'

const STORAGE_KEY = 'mock_auth_user'

const DEFAULT_USER: AuthUser = {
  id: '00000000-0000-0000-0000-000000000000',
  email: 'dev@example.com',
  name: 'Dev User',
}

// External store for auth state (allows sharing between hook and login/logout)
let currentUser: AuthUser | null = null
let isLoading = true
const listeners = new Set<() => void>()

function emitChange(): void {
  for (const listener of listeners) {
    listener()
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot(): AuthUser | null {
  return currentUser
}

function getLoadingSnapshot(): boolean {
  return isLoading
}

// Initialize from localStorage
function initializeAuth(): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      currentUser = JSON.parse(stored) as AuthUser
    }
  } catch {
    // Ignore parse errors
  }
  isLoading = false
  emitChange()
}

// Initialize once
let initialized = false
function ensureInitialized(): void {
  if (!initialized) {
    initialized = true
    // Use setTimeout to avoid calling during render
    setTimeout(initializeAuth, 0)
  }
}

function login(): void {
  currentUser = DEFAULT_USER
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_USER))
  emitChange()
}

function logout(): void {
  clearSelectedOrganization()
  currentUser = null
  localStorage.removeItem(STORAGE_KEY)
  emitChange()
}

/**
 * Mock auth provider for development and testing.
 * Auto-authenticates with a default dev user.
 * User state is persisted in localStorage.
 */
export function createMockProvider(): AuthProviderImplementation {
  ensureInitialized()

  const useAuthState = (): AuthState => {
    const user = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
    const loading = useSyncExternalStore(
      subscribe,
      getLoadingSnapshot,
      () => false // Server snapshot - not loading on server
    )

    return {
      user,
      isAuthenticated: user !== null,
      isLoading: loading,
      error: null,
    }
  }

  return {
    useAuthState,
    login,
    logout,
  }
}

// Reset for testing
export function resetMockAuth(): void {
  currentUser = null
  isLoading = false
  localStorage.removeItem(STORAGE_KEY)
  initialized = false
  emitChange()
}

export { DEFAULT_USER }

// Re-export AuthUser type for use by mock handlers
export type { AuthUser } from '../types'
