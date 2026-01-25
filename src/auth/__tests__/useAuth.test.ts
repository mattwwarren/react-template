import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderHookWithProviders } from '@/test/utils'
import { useAuth } from '../useAuth'

describe('useAuth', () => {
  it('throws error when used outside AuthProvider', () => {
    // Suppress console.error for expected error
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      renderHook(() => useAuth())
    }).toThrow('useAuth must be used within an AuthProvider')

    consoleSpy.mockRestore()
  })

  it('returns auth state when inside AuthProvider', async () => {
    const { result } = renderHookWithProviders(() => useAuth())

    // Wait for the async provider to load
    await waitFor(() => {
      expect(result.current).not.toBeNull()
    })

    expect(result.current).toHaveProperty('user')
    expect(result.current).toHaveProperty('isAuthenticated')
    expect(result.current).toHaveProperty('isLoading')
    expect(result.current).toHaveProperty('error')
    expect(result.current).toHaveProperty('login')
    expect(result.current).toHaveProperty('logout')
  })

  it('provides login function', async () => {
    const { result } = renderHookWithProviders(() => useAuth())

    await waitFor(() => {
      expect(result.current).not.toBeNull()
    })

    expect(typeof result.current.login).toBe('function')
  })

  it('provides logout function', async () => {
    const { result } = renderHookWithProviders(() => useAuth())

    await waitFor(() => {
      expect(result.current).not.toBeNull()
    })

    expect(typeof result.current.logout).toBe('function')
  })

  it('has null error by default', async () => {
    const { result } = renderHookWithProviders(() => useAuth())

    await waitFor(() => {
      expect(result.current).not.toBeNull()
    })

    expect(result.current.error).toBeNull()
  })
})
