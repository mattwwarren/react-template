import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { membershipsApi, type Membership, type MembershipCreate, type MembershipUpdate, type PaginationParams } from '@/api';

export const membershipKeys = {
  all: ['memberships'] as const,
  lists: () => [...membershipKeys.all, 'list'] as const,
  list: (params: PaginationParams) => [...membershipKeys.lists(), params] as const,
  details: () => [...membershipKeys.all, 'detail'] as const,
  detail: (id: string) => [...membershipKeys.details(), id] as const,
};

export function useMemberships(params: PaginationParams = {}) {
  return useQuery({
    queryKey: membershipKeys.list(params),
    queryFn: () => membershipsApi.list(params),
  });
}

export function useCreateMembership() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: MembershipCreate) => membershipsApi.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: membershipKeys.lists() });
    },
  });
}

export function useUpdateMembership() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: MembershipUpdate }) =>
      membershipsApi.update(id, data),

    // Optimistic update
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: membershipKeys.detail(id) });

      // Snapshot current value
      const previousMembership = queryClient.getQueryData<Membership>(
        membershipKeys.detail(id)
      );

      // Optimistically update the cache
      if (previousMembership) {
        queryClient.setQueryData<Membership>(membershipKeys.detail(id), {
          ...previousMembership,
          ...data,
          role: data.role ?? previousMembership.role,
        });
      }

      return { previousMembership };
    },

    // Rollback on error
    onError: (_err, { id }, context) => {
      if (context?.previousMembership) {
        queryClient.setQueryData(membershipKeys.detail(id), context.previousMembership);
      }
    },

    // Always refetch after success or error
    onSettled: (_data, _error, { id }) => {
      void queryClient.invalidateQueries({ queryKey: membershipKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: membershipKeys.lists() });
    },
  });
}

export function useDeleteMembership() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => membershipsApi.delete(id),

    // Optimistic delete from lists
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: membershipKeys.lists() });

      // Mark for refetch
      return { id };
    },

    // Invalidate on success
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: membershipKeys.lists() });
    },

    // Rollback on error (refetch lists)
    onError: () => {
      void queryClient.invalidateQueries({ queryKey: membershipKeys.lists() });
    },
  });
}
