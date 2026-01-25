import { waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderHookWithProviders } from '@/test/utils'
import { userKeys, useUser, useUsers } from '../useUsers'

describe('useUsers', () => {
  describe('useUsers hook', () => {
    it('returns paginated users with default params', async () => {
      const { result } = renderHookWithProviders(() => useUsers())

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toBeDefined()
      expect(result.current.data?.items).toHaveLength(10)
      expect(result.current.data?.page).toBe(1)
      expect(result.current.data?.size).toBe(10)
      expect(result.current.data?.total).toBe(25)
      expect(result.current.data?.pages).toBe(3)
    })

    it('returns paginated users with custom page', async () => {
      const { result } = renderHookWithProviders(() => useUsers({ page: 2, size: 10 }))

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data?.page).toBe(2)
      expect(result.current.data?.items).toHaveLength(10)
    })

    it('returns paginated users with custom size', async () => {
      const { result } = renderHookWithProviders(() => useUsers({ page: 1, size: 5 }))

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data?.size).toBe(5)
      expect(result.current.data?.items).toHaveLength(5)
      expect(result.current.data?.pages).toBe(5)
    })

    it('returns partial page for last page', async () => {
      const { result } = renderHookWithProviders(() => useUsers({ page: 3, size: 10 }))

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data?.page).toBe(3)
      expect(result.current.data?.items).toHaveLength(5) // 25 total, page 3 has 5 items
    })

    it('starts in loading state', () => {
      const { result } = renderHookWithProviders(() => useUsers())

      expect(result.current.isLoading).toBe(true)
      expect(result.current.data).toBeUndefined()
    })

    it('uses correct query key', async () => {
      const params = { page: 1, size: 10 }
      const { result, queryClient } = renderHookWithProviders(() => useUsers(params))

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      const queryState = queryClient.getQueryState(userKeys.list(params))
      expect(queryState).toBeDefined()
      expect(queryState?.status).toBe('success')
    })
  })

  describe('useUser hook', () => {
    it('returns single user by id', async () => {
      // First get a user ID from the list
      const listResult = renderHookWithProviders(() => useUsers())
      await waitFor(() => expect(listResult.result.current.isSuccess).toBe(true))

      const userId = listResult.result.current.data?.items[0]?.id
      expect(userId).toBeDefined()

      const { result } = renderHookWithProviders(() => useUser(userId!))

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toBeDefined()
      expect(result.current.data?.id).toBe(userId)
      expect(result.current.data?.email).toBeDefined()
      expect(result.current.data?.name).toBeDefined()
    })

    it('returns 404 for non-existent user', async () => {
      const { result } = renderHookWithProviders(() => useUser('non-existent-id'))

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(result.current.error).toBeDefined()
    })

    it('does not fetch when id is empty', () => {
      const { result } = renderHookWithProviders(() => useUser(''))

      // Query should not be enabled
      expect(result.current.fetchStatus).toBe('idle')
    })
  })

  describe('userKeys', () => {
    it('generates correct query keys', () => {
      expect(userKeys.all).toEqual(['users'])
      expect(userKeys.lists()).toEqual(['users', 'list'])
      expect(userKeys.list({ page: 1, size: 10 })).toEqual(['users', 'list', { page: 1, size: 10 }])
      expect(userKeys.details()).toEqual(['users', 'detail'])
      expect(userKeys.detail('123')).toEqual(['users', 'detail', '123'])
    })
  })
})
