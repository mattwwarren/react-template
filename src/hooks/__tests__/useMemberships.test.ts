import { describe, it, expect, vi } from 'vitest'
import { waitFor } from '@testing-library/react'
import { useMemberships, useCreateMembership, useDeleteMembership, membershipKeys } from '../useMemberships'
import { renderHookWithProviders } from '@/test/utils'
import { mockMemberships } from '@/mocks/factories'

describe('useMemberships', () => {
  // Use a real membership ID from mock data
  const testMembershipId = mockMemberships[0]?.id ?? 'test-membership-id'

  describe('useMemberships hook', () => {
    it('returns paginated memberships with default params', async () => {
      const { result } = renderHookWithProviders(() => useMemberships())

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toBeDefined()
      expect(result.current.data?.items).toHaveLength(10)
      expect(result.current.data?.page).toBe(1)
      expect(result.current.data?.size).toBe(10)
      expect(result.current.data?.total).toBe(25)
      expect(result.current.data?.pages).toBe(3)
    })

    it('returns paginated memberships with custom page', async () => {
      const { result } = renderHookWithProviders(() => useMemberships({ page: 2, size: 10 }))

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data?.page).toBe(2)
      expect(result.current.data?.items).toHaveLength(10)
    })

    it('returns paginated memberships with custom size', async () => {
      const { result } = renderHookWithProviders(() => useMemberships({ page: 1, size: 5 }))

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data?.size).toBe(5)
      expect(result.current.data?.items).toHaveLength(5)
      expect(result.current.data?.pages).toBe(5)
    })

    it('returns partial page for last page', async () => {
      const { result } = renderHookWithProviders(() => useMemberships({ page: 3, size: 10 }))

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data?.page).toBe(3)
      expect(result.current.data?.items).toHaveLength(5) // 25 total, page 3 has 5 items
    })

    it('starts in loading state', () => {
      const { result } = renderHookWithProviders(() => useMemberships())

      expect(result.current.isLoading).toBe(true)
      expect(result.current.data).toBeUndefined()
    })

    it('uses correct query key', async () => {
      const params = { page: 1, size: 10 }
      const { result, queryClient } = renderHookWithProviders(() => useMemberships(params))

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      const queryState = queryClient.getQueryState(membershipKeys.list(params))
      expect(queryState).toBeDefined()
      expect(queryState?.status).toBe('success')
    })
  })

  describe('useCreateMembership hook', () => {
    it('successfully creates a membership', async () => {
      const { result } = renderHookWithProviders(() => useCreateMembership())

      const newMembership = {
        user_id: 'user-123',
        organization_id: 'org-456',
        role: 'member' as const,
      }

      result.current.mutate(newMembership)

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toBeDefined()
      expect(result.current.data?.user_id).toBe(newMembership.user_id)
      expect(result.current.data?.organization_id).toBe(newMembership.organization_id)
      expect(result.current.data?.role).toBe(newMembership.role)
    })

    it('starts in idle state', () => {
      const { result } = renderHookWithProviders(() => useCreateMembership())

      expect(result.current.isPending).toBe(false)
      expect(result.current.data).toBeUndefined()
    })

    it('invalidates membership queries on success', async () => {
      const { result, queryClient } = renderHookWithProviders(() => useCreateMembership())

      // Spy on invalidateQueries
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      const newMembership = {
        user_id: 'user-789',
        organization_id: 'org-101',
        role: 'admin' as const,
      }

      result.current.mutate(newMembership)

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: membershipKeys.lists() })
    })
  })

  describe('useDeleteMembership hook', () => {
    it('successfully deletes a membership', async () => {
      const { result } = renderHookWithProviders(() => useDeleteMembership())

      result.current.mutate(testMembershipId)

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      // Response should be undefined for 204 No Content
      expect(result.current.data).toBeUndefined()
    })

    it('returns error for non-existent membership', async () => {
      const { result } = renderHookWithProviders(() => useDeleteMembership())

      result.current.mutate('non-existent-id')

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(result.current.error).toBeDefined()
    })

    it('starts in idle state', () => {
      const { result } = renderHookWithProviders(() => useDeleteMembership())

      expect(result.current.isPending).toBe(false)
      expect(result.current.data).toBeUndefined()
    })

    it('invalidates membership queries on success', async () => {
      const { result, queryClient } = renderHookWithProviders(() => useDeleteMembership())

      // Spy on invalidateQueries
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      result.current.mutate(testMembershipId)

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: membershipKeys.lists() })
    })
  })

  describe('membershipKeys', () => {
    it('generates correct query keys', () => {
      expect(membershipKeys.all).toEqual(['memberships'])
      expect(membershipKeys.lists()).toEqual(['memberships', 'list'])
      expect(membershipKeys.list({ page: 1, size: 10 })).toEqual(['memberships', 'list', { page: 1, size: 10 }])
    })
  })
})
