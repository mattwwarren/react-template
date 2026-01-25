import { waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { mockDocuments } from '@/mocks/factories'
import { renderHookWithProviders } from '@/test/utils'
import { documentKeys, useDeleteDocument, useDocument, useUploadDocument } from '../useDocuments'

describe('useDocuments', () => {
  // Use a real document ID from mock data
  const testDocId = mockDocuments[0]?.id ?? 'test-doc-id'

  describe('useDocument hook', () => {
    it('returns single document by id', async () => {
      const { result } = renderHookWithProviders(() => useDocument(testDocId))

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toBeDefined()
      expect(result.current.data?.id).toBe(testDocId)
      expect(result.current.data?.filename).toBeDefined()
      expect(result.current.data?.content_type).toBeDefined()
    })

    it('returns 404 for non-existent document', async () => {
      const { result } = renderHookWithProviders(() => useDocument('non-existent-id'))

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(result.current.error).toBeDefined()
    })

    it('does not fetch when id is empty', () => {
      const { result } = renderHookWithProviders(() => useDocument(''))

      // Query should not be enabled
      expect(result.current.fetchStatus).toBe('idle')
    })

    it('starts in loading state', () => {
      const { result } = renderHookWithProviders(() => useDocument('doc-1'))

      expect(result.current.isLoading).toBe(true)
      expect(result.current.data).toBeUndefined()
    })

    it('uses correct query key', async () => {
      const { result, queryClient } = renderHookWithProviders(() => useDocument(testDocId))

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      const queryState = queryClient.getQueryState(documentKeys.detail(testDocId))
      expect(queryState).toBeDefined()
      expect(queryState?.status).toBe('success')
    })
  })

  describe('useUploadDocument hook', () => {
    it('successfully uploads a document', async () => {
      const { result } = renderHookWithProviders(() => useUploadDocument())

      const file = new File(['test content'], 'test.txt', { type: 'text/plain' })
      const organizationId = 'org-1'

      result.current.mutate({ file, organizationId })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toBeDefined()
      expect(result.current.data?.filename).toBeDefined()
      expect(result.current.data?.content_type).toBeDefined()
      expect(result.current.data?.organization_id).toBeDefined()
    })

    it('starts in idle state', () => {
      const { result } = renderHookWithProviders(() => useUploadDocument())

      expect(result.current.isPending).toBe(false)
      expect(result.current.data).toBeUndefined()
    })

    it('invalidates document queries on success', async () => {
      const { result, queryClient } = renderHookWithProviders(() => useUploadDocument())

      // Spy on invalidateQueries
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      const file = new File(['test'], 'test.txt', { type: 'text/plain' })
      const organizationId = 'org-1'

      result.current.mutate({ file, organizationId })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: documentKeys.all })
    })
  })

  describe('useDeleteDocument hook', () => {
    it('successfully deletes a document', async () => {
      const { result } = renderHookWithProviders(() => useDeleteDocument())

      result.current.mutate(testDocId)

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      // Response should be undefined for 204 No Content
      expect(result.current.data).toBeUndefined()
    })

    it('returns error for non-existent document', async () => {
      const { result } = renderHookWithProviders(() => useDeleteDocument())

      result.current.mutate('non-existent-id')

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(result.current.error).toBeDefined()
    })

    it('starts in idle state', () => {
      const { result } = renderHookWithProviders(() => useDeleteDocument())

      expect(result.current.isPending).toBe(false)
      expect(result.current.data).toBeUndefined()
    })

    it('invalidates document queries on success', async () => {
      const { result, queryClient } = renderHookWithProviders(() => useDeleteDocument())

      // Spy on invalidateQueries
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      result.current.mutate(testDocId)

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: documentKeys.all })
    })
  })

  describe('documentKeys', () => {
    it('generates correct query keys', () => {
      expect(documentKeys.all).toEqual(['documents'])
      expect(documentKeys.details()).toEqual(['documents', 'detail'])
      expect(documentKeys.detail('123')).toEqual(['documents', 'detail', '123'])
    })
  })
})
