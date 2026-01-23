import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { membershipsApi, type MembershipCreate, type MembershipUpdate, type PaginationParams } from '@/api';

export const membershipKeys = {
  all: ['memberships'] as const,
  lists: () => [...membershipKeys.all, 'list'] as const,
  list: (params: PaginationParams) => [...membershipKeys.lists(), params] as const,
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
    mutationFn: ({ id, data }: { id: string; data: MembershipUpdate }) => membershipsApi.update(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: membershipKeys.lists() });
    },
  });
}

export function useDeleteMembership() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => membershipsApi.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: membershipKeys.lists() });
    },
  });
}
