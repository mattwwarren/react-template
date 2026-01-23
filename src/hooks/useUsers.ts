import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  usersApi,
  type User,
  type UserCreate,
  type UserUpdate,
  type PaginationParams,
} from '@/api';

export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (params: PaginationParams) => [...userKeys.lists(), params] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};

export function useUsers(params: PaginationParams = {}) {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => usersApi.list(params),
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => usersApi.get(id),
    enabled: !!id,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UserCreate) => usersApi.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UserUpdate }) =>
      usersApi.update(id, data),

    // Optimistic update
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: userKeys.detail(id) });

      // Snapshot current value
      const previousUser = queryClient.getQueryData<User>(userKeys.detail(id));

      // Optimistically update the cache
      if (previousUser) {
        queryClient.setQueryData<User>(userKeys.detail(id), {
          ...previousUser,
          ...data,
          name: data.name ?? previousUser.name,
          email: data.email ?? previousUser.email,
        });
      }

      return { previousUser };
    },

    // Rollback on error
    onError: (_err, { id }, context) => {
      if (context?.previousUser) {
        queryClient.setQueryData(userKeys.detail(id), context.previousUser);
      }
    },

    // Always refetch after success or error
    onSettled: (_data, _error, { id }) => {
      void queryClient.invalidateQueries({ queryKey: userKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => usersApi.delete(id),

    // Optimistic delete from lists
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: userKeys.lists() });

      // We don't have access to all list query keys, so just mark for refetch
      return { id };
    },

    // Invalidate on success
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },

    // Rollback on error (refetch lists)
    onError: () => {
      void queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}
