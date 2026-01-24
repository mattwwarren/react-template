import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import {
  type Organization,
  type OrganizationCreate,
  type OrganizationUpdate,
  organizationsApi,
  type PaginationParams,
} from '@/api'

export const organizationKeys = {
  all: ['organizations'] as const,
  lists: () => [...organizationKeys.all, 'list'] as const,
  list: (params: PaginationParams) => [...organizationKeys.lists(), params] as const,
  details: () => [...organizationKeys.all, 'detail'] as const,
  detail: (id: string) => [...organizationKeys.details(), id] as const,
}

export function useOrganizations(params: PaginationParams = {}) {
  return useQuery({
    queryKey: organizationKeys.list(params),
    queryFn: () => organizationsApi.list(params),
  })
}

export function useOrganization(id: string) {
  return useQuery({
    queryKey: organizationKeys.detail(id),
    queryFn: () => organizationsApi.get(id),
    enabled: !!id,
  })
}

export function useCreateOrganization() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: OrganizationCreate) => organizationsApi.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: organizationKeys.lists() })
    },
  })
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: OrganizationUpdate }) =>
      organizationsApi.update(id, data),

    // Optimistic update
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: organizationKeys.detail(id) })

      // Snapshot current value
      const previousOrg = queryClient.getQueryData<Organization>(organizationKeys.detail(id))

      // Optimistically update the cache
      if (previousOrg) {
        queryClient.setQueryData<Organization>(organizationKeys.detail(id), {
          ...previousOrg,
          ...data,
          name: data.name ?? previousOrg.name,
        })
      }

      return { previousOrg }
    },

    // Rollback on error
    onError: (_err, { id }, context) => {
      if (context?.previousOrg) {
        queryClient.setQueryData(organizationKeys.detail(id), context.previousOrg)
      }
    },

    // Always refetch after success or error
    onSettled: (_data, _error, { id }) => {
      void queryClient.invalidateQueries({ queryKey: organizationKeys.detail(id) })
      void queryClient.invalidateQueries({ queryKey: organizationKeys.lists() })
    },
  })
}

export function useDeleteOrganization() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => organizationsApi.delete(id),

    // Optimistic delete
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: organizationKeys.lists() })
      await queryClient.cancelQueries({ queryKey: organizationKeys.detail(id) })

      // Snapshot current detail value
      const previousOrg = queryClient.getQueryData<Organization>(organizationKeys.detail(id))

      // Remove from detail cache
      queryClient.removeQueries({ queryKey: organizationKeys.detail(id) })

      return { previousOrg, id }
    },

    // Rollback on error
    onError: (_err, id, context) => {
      if (context?.previousOrg) {
        queryClient.setQueryData(organizationKeys.detail(id), context.previousOrg)
      }
      void queryClient.invalidateQueries({ queryKey: organizationKeys.lists() })
    },

    // Always refetch after success
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: organizationKeys.lists() })
    },
  })
}

/**
 * Returns a stable prefetch function for organization details.
 * Use on hover/focus to preload organization data before navigation.
 * Wrapped in useCallback for memoization stability.
 */
export function usePrefetchOrganization() {
  const queryClient = useQueryClient()

  return useCallback(
    (id: string): void => {
      void queryClient.prefetchQuery({
        queryKey: organizationKeys.detail(id),
        queryFn: () => organizationsApi.get(id),
      })
    },
    [queryClient]
  )
}
