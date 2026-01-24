import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { type Document, documentsApi } from '@/api'

export const documentKeys = {
  all: ['documents'] as const,
  details: () => [...documentKeys.all, 'detail'] as const,
  detail: (id: string) => [...documentKeys.details(), id] as const,
}

export function useDocument(id: string) {
  return useQuery({
    queryKey: documentKeys.detail(id),
    queryFn: () => documentsApi.get(id),
    enabled: !!id,
  })
}

export function useUploadDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ file, organizationId }: { file: File; organizationId: string }) =>
      documentsApi.upload(file, organizationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: documentKeys.all })
    },
  })
}

export function useDeleteDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => documentsApi.delete(id),

    // Optimistic delete
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: documentKeys.all })
      await queryClient.cancelQueries({ queryKey: documentKeys.detail(id) })

      // Snapshot current detail value
      const previousDocument = queryClient.getQueryData<Document>(documentKeys.detail(id))

      // Remove from detail cache
      queryClient.removeQueries({ queryKey: documentKeys.detail(id) })

      return { previousDocument, id }
    },

    // Rollback on error
    onError: (_err, id, context) => {
      if (context?.previousDocument) {
        queryClient.setQueryData(documentKeys.detail(id), context.previousDocument)
      }
      void queryClient.invalidateQueries({ queryKey: documentKeys.all })
    },

    // Always refetch after success
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: documentKeys.all })
    },
  })
}

// Helper to get download URL (not a hook, just re-exported utility)
export const getDocumentDownloadUrl = documentsApi.getDownloadUrl
