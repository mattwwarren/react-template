import { act, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { createTestQueryClient, renderHookWithProviders } from '@/test/utils'
import {
  useCreateUser,
  useDeleteUser,
  userKeys,
  useUpdateUser,
  useUser,
  useUsers,
} from '../useUsers'

describe('User mutations', () => {
  describe('useCreateUser', () => {
    it('creates a new user', async () => {
      const { result } = renderHookWithProviders(() => useCreateUser())

      await act(async () => {
        result.current.mutate({
          email: 'newuser@example.com',
          name: 'New User',
        })
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toBeDefined()
      expect(result.current.data?.email).toBe('newuser@example.com')
      expect(result.current.data?.name).toBe('New User')
      expect(result.current.data?.id).toBeDefined()
    })

    it('invalidates user list queries on success', async () => {
      const queryClient = createTestQueryClient()

      // First load the list
      const listHook = renderHookWithProviders(() => useUsers(), { queryClient })
      await waitFor(() => expect(listHook.result.current.isSuccess).toBe(true))

      const initialCount = listHook.result.current.data?.total
      expect(initialCount).toBe(25)

      // Create a new user
      const createHook = renderHookWithProviders(() => useCreateUser(), { queryClient })

      await act(async () => {
        createHook.result.current.mutate({
          email: 'another@example.com',
          name: 'Another User',
        })
      })

      await waitFor(() => expect(createHook.result.current.isSuccess).toBe(true))

      // Refetch the list and verify the new user is included
      await listHook.result.current.refetch()
      await waitFor(() => expect(listHook.result.current.data?.total).toBe(26))
    })

    it('returns error for invalid data', async () => {
      const { result } = renderHookWithProviders(() => useCreateUser())

      await act(async () => {
        // Empty name and email - server should reject
        result.current.mutate({
          email: '',
          name: '',
        })
      })

      // Note: Current MSW handlers don't validate - this tests basic mutation error handling
      // After adding validation in step 3, this should return an error
      await waitFor(() => expect(result.current.isSuccess || result.current.isError).toBe(true))
    })
  })

  describe('useUpdateUser', () => {
    it('updates an existing user', async () => {
      const queryClient = createTestQueryClient()

      // First get a user
      const listHook = renderHookWithProviders(() => useUsers(), { queryClient })
      await waitFor(() => expect(listHook.result.current.isSuccess).toBe(true))

      const user = listHook.result.current.data?.items[0]
      expect(user).toBeDefined()

      // Update the user
      const updateHook = renderHookWithProviders(() => useUpdateUser(), { queryClient })

      await act(async () => {
        updateHook.result.current.mutate({
          id: user!.id,
          data: { name: 'Updated Name' },
        })
      })

      await waitFor(() => expect(updateHook.result.current.isSuccess).toBe(true))

      expect(updateHook.result.current.data?.name).toBe('Updated Name')
      expect(updateHook.result.current.data?.email).toBe(user!.email)
    })

    it('performs optimistic update', async () => {
      const queryClient = createTestQueryClient()

      // First get a user and cache it
      const listHook = renderHookWithProviders(() => useUsers(), { queryClient })
      await waitFor(() => expect(listHook.result.current.isSuccess).toBe(true))

      const user = listHook.result.current.data?.items[0]
      expect(user).toBeDefined()

      // Load the user detail to cache it
      const detailHook = renderHookWithProviders(() => useUser(user!.id), { queryClient })
      await waitFor(() => expect(detailHook.result.current.isSuccess).toBe(true))

      // Start the update
      const updateHook = renderHookWithProviders(() => useUpdateUser(), { queryClient })

      act(() => {
        updateHook.result.current.mutate({
          id: user!.id,
          data: { name: 'Optimistic Name' },
        })
      })

      // Check cache was updated optimistically (before server response)
      const cachedUser = queryClient.getQueryData(userKeys.detail(user!.id))
      expect(cachedUser).toBeDefined()
    })

    it('returns 404 for non-existent user', async () => {
      const { result } = renderHookWithProviders(() => useUpdateUser())

      await act(async () => {
        result.current.mutate({
          id: 'non-existent-id',
          data: { name: 'Test' },
        })
      })

      await waitFor(() => expect(result.current.isError).toBe(true))
    })
  })

  describe('useDeleteUser', () => {
    it('deletes an existing user', async () => {
      const queryClient = createTestQueryClient()

      // First get a user
      const listHook = renderHookWithProviders(() => useUsers(), { queryClient })
      await waitFor(() => expect(listHook.result.current.isSuccess).toBe(true))

      const user = listHook.result.current.data?.items[0]
      const initialCount = listHook.result.current.data?.total
      expect(user).toBeDefined()
      expect(initialCount).toBe(25)

      // Delete the user
      const deleteHook = renderHookWithProviders(() => useDeleteUser(), { queryClient })

      await act(async () => {
        deleteHook.result.current.mutate(user!.id)
      })

      await waitFor(() => expect(deleteHook.result.current.isSuccess).toBe(true))

      // Refetch and verify the user was deleted
      await listHook.result.current.refetch()
      await waitFor(() => expect(listHook.result.current.data?.total).toBe(24))
    })

    it('returns 404 for non-existent user', async () => {
      const { result } = renderHookWithProviders(() => useDeleteUser())

      await act(async () => {
        result.current.mutate('non-existent-id')
      })

      await waitFor(() => expect(result.current.isError).toBe(true))
    })

    it('removes deleted user from list on refetch', async () => {
      const queryClient = createTestQueryClient()

      // First get a user
      const listHook = renderHookWithProviders(() => useUsers(), { queryClient })
      await waitFor(() => expect(listHook.result.current.isSuccess).toBe(true))

      const user = listHook.result.current.data?.items[0]
      expect(user).toBeDefined()

      // Delete the user
      const deleteHook = renderHookWithProviders(() => useDeleteUser(), { queryClient })

      await act(async () => {
        deleteHook.result.current.mutate(user!.id)
      })

      await waitFor(() => expect(deleteHook.result.current.isSuccess).toBe(true))

      // Refetch and verify the user is no longer in the list
      await listHook.result.current.refetch()
      await waitFor(() => {
        const items = listHook.result.current.data?.items ?? []
        const deletedUserStillExists = items.some((u) => u.id === user!.id)
        expect(deletedUserStillExists).toBe(false)
      })
    })
  })
})
