import { describe, it, expect } from 'vitest'
import { waitFor } from '@testing-library/react'
import { useOrganizations, useOrganization, organizationKeys } from '../useOrganizations'
import { renderHookWithProviders } from '@/test/utils'

describe('useOrganizations', () => {
  describe('useOrganizations hook', () => {
    it('returns paginated organizations with default params', async () => {
      const { result } = renderHookWithProviders(() => useOrganizations())

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toBeDefined()
      expect(result.current.data?.items).toHaveLength(5)
      expect(result.current.data?.page).toBe(1)
      expect(result.current.data?.size).toBe(10)
      expect(result.current.data?.total).toBe(5)
      expect(result.current.data?.pages).toBe(1)
    })

    it('returns paginated organizations with custom page', async () => {
      const { result } = renderHookWithProviders(() => useOrganizations({ page: 1, size: 3 }))

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data?.page).toBe(1)
      expect(result.current.data?.items).toHaveLength(3)
    })

    it('returns paginated organizations with custom size', async () => {
      const { result } = renderHookWithProviders(() => useOrganizations({ page: 1, size: 2 }))

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data?.size).toBe(2)
      expect(result.current.data?.items).toHaveLength(2)
      expect(result.current.data?.pages).toBe(3)
    })

    it('returns partial page for last page', async () => {
      const { result } = renderHookWithProviders(() => useOrganizations({ page: 3, size: 2 }))

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data?.page).toBe(3)
      expect(result.current.data?.items).toHaveLength(1) // 5 total, page 3 with size 2 has 1 item
    })

    it('starts in loading state', () => {
      const { result } = renderHookWithProviders(() => useOrganizations())

      expect(result.current.isLoading).toBe(true)
      expect(result.current.data).toBeUndefined()
    })

    it('uses correct query key', async () => {
      const params = { page: 1, size: 10 }
      const { result, queryClient } = renderHookWithProviders(() => useOrganizations(params))

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      const queryState = queryClient.getQueryState(organizationKeys.list(params))
      expect(queryState).toBeDefined()
      expect(queryState?.status).toBe('success')
    })
  })

  describe('useOrganization hook', () => {
    it('returns single organization by id', async () => {
      // First get an organization ID from the list
      const listResult = renderHookWithProviders(() => useOrganizations())
      await waitFor(() => expect(listResult.result.current.isSuccess).toBe(true))

      const orgId = listResult.result.current.data?.items[0]?.id
      expect(orgId).toBeDefined()

      const { result } = renderHookWithProviders(() => useOrganization(orgId!))

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toBeDefined()
      expect(result.current.data?.id).toBe(orgId)
      expect(result.current.data?.name).toBeDefined()
    })

    it('returns 404 for non-existent organization', async () => {
      const { result } = renderHookWithProviders(() => useOrganization('non-existent-id'))

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(result.current.error).toBeDefined()
    })

    it('does not fetch when id is empty', () => {
      const { result } = renderHookWithProviders(() => useOrganization(''))

      // Query should not be enabled
      expect(result.current.fetchStatus).toBe('idle')
    })
  })

  describe('organizationKeys', () => {
    it('generates correct query keys', () => {
      expect(organizationKeys.all).toEqual(['organizations'])
      expect(organizationKeys.lists()).toEqual(['organizations', 'list'])
      expect(organizationKeys.list({ page: 1, size: 10 })).toEqual(['organizations', 'list', { page: 1, size: 10 }])
      expect(organizationKeys.details()).toEqual(['organizations', 'detail'])
      expect(organizationKeys.detail('123')).toEqual(['organizations', 'detail', '123'])
    })
  })
})
