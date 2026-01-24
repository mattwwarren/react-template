import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentsApi } from '@/api';

export const documentKeys = {
  all: ['documents'] as const,
  lists: () => [...documentKeys.all, 'list'] as const,
  details: () => [...documentKeys.all, 'detail'] as const,
  detail: (id: string) => [...documentKeys.details(), id] as const,
};

export function useDocument(id: string) {
  return useQuery({
    queryKey: documentKeys.detail(id),
    queryFn: () => documentsApi.get(id),
    enabled: !!id,
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, organizationId }: { file: File; organizationId: string }) =>
      documentsApi.upload(file, organizationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: documentKeys.all });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => documentsApi.delete(id),

    // Optimistic delete
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: documentKeys.all });

      // Mark for refetch
      return { id };
    },

    // Invalidate on success
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: documentKeys.all });
    },

    // Rollback on error (refetch all)
    onError: () => {
      void queryClient.invalidateQueries({ queryKey: documentKeys.all });
    },
  });
}

// Helper to get download URL (not a hook, just re-exported utility)
export const getDocumentDownloadUrl = documentsApi.getDownloadUrl;
