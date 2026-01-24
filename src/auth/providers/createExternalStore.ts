import { useSyncExternalStore } from 'react'
import type { AuthUser } from '../types'

/**
 * State shape for external auth store
 */
export interface ExternalAuthState {
  user: AuthUser | null
  isLoading: boolean
  error: string | null
}

/**
 * Creates an external store for auth state management.
 * Uses React's useSyncExternalStore for safe concurrent rendering.
 *
 * This pattern is shared across all auth providers to reduce duplication.
 */
export function createExternalAuthStore(initialState: ExternalAuthState = {
  user: null,
  isLoading: true,
  error: null,
}) {
  let state = { ...initialState }
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

  function getSnapshot(): ExternalAuthState {
    return state
  }

  function getServerSnapshot(): ExternalAuthState {
    return { user: null, isLoading: false, error: null }
  }

  function setState(updates: Partial<ExternalAuthState>): void {
    state = { ...state, ...updates }
    emitChange()
  }

  function setUser(user: AuthUser | null): void {
    setState({ user, isLoading: false })
  }

  function setLoading(isLoading: boolean): void {
    setState({ isLoading })
  }

  function setError(error: string | null): void {
    setState({ error, isLoading: false })
  }

  function reset(): void {
    state = { ...initialState }
    emitChange()
  }

  /**
   * React hook to subscribe to store state changes.
   * Must be called unconditionally in a React component.
   */
  function useStore(): ExternalAuthState {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  }

  return {
    subscribe,
    getSnapshot,
    getServerSnapshot,
    setState,
    setUser,
    setLoading,
    setError,
    reset,
    useStore,
    emitChange,
  }
}

export type ExternalAuthStore = ReturnType<typeof createExternalAuthStore>
