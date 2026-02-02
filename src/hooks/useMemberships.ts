import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  type Membership,
  type MembershipCreate,
  type MembershipUpdate,
  membershipsApi,
  type PaginationParams,
} from '@/api'

export const membershipKeys = {
  all: ['memberships'] as const,
  lists: () => [...membershipKeys.all, 'list'] as const,
  list: (params: PaginationParams) => [...membershipKeys.lists(), params] as const,
  details: () => [...membershipKeys.all, 'detail'] as const,
  detail: (id: string) => [...membershipKeys.details(), id] as const,
}

export function useMemberships(params: PaginationParams = {}) {
  return useQuery({
    queryKey: membershipKeys.list(params),
    queryFn: () => membershipsApi.list(params),
  })
}

export function useCreateMembership() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: MembershipCreate) => membershipsApi.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: membershipKeys.lists() })
    },
  })
}

export function useUpdateMembership() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: MembershipUpdate }) =>
      membershipsApi.update(id, data),

    // Optimistic update
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: membershipKeys.detail(id) })

      // Snapshot current value
      const previousMembership = queryClient.getQueryData<Membership>(membershipKeys.detail(id))

      // Optimistically update the cache
      if (previousMembership) {
        queryClient.setQueryData<Membership>(membershipKeys.detail(id), {
          ...previousMembership,
          ...data,
          role: data.role ?? previousMembership.role,
        })
      }

      return { previousMembership }
    },

    // Rollback on error
    onError: (_err, { id }, context) => {
      if (context?.previousMembership) {
        queryClient.setQueryData(membershipKeys.detail(id), context.previousMembership)
      }
    },

    // Always refetch after success or error
    onSettled: (_data, _error, { id }) => {
      void queryClient.invalidateQueries({ queryKey: membershipKeys.detail(id) })
      void queryClient.invalidateQueries({ queryKey: membershipKeys.lists() })
    },
  })
}

export function useDeleteMembership() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => membershipsApi.delete(id),

    // Optimistic delete
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: membershipKeys.lists() })
      await queryClient.cancelQueries({ queryKey: membershipKeys.detail(id) })

      // Snapshot current detail value
      const previousMembership = queryClient.getQueryData<Membership>(membershipKeys.detail(id))

      // Remove from detail cache
      queryClient.removeQueries({ queryKey: membershipKeys.detail(id) })

      return { previousMembership, id }
    },

    // Rollback on error
    onError: (_err, id, context) => {
      if (context?.previousMembership) {
        queryClient.setQueryData(membershipKeys.detail(id), context.previousMembership)
      }
      void queryClient.invalidateQueries({ queryKey: membershipKeys.lists() })
    },

    // Always refetch after success
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: membershipKeys.lists() })
    },
  })
}
