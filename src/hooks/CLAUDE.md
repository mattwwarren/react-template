# Custom Hooks

TanStack Query hooks for server state management.

## Query Key Factory

Every domain defines a hierarchical key factory:

```typescript
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (params: PaginationParams) => [...userKeys.lists(), params] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
}
```

`as const` ensures literal types. Partial keys enable granular invalidation (e.g., `userKeys.lists()` invalidates all list queries regardless of params).

## Query Hooks

Thin wrappers around `useQuery` + API functions:

```typescript
export function useUsers(params: PaginationParams = {}) {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => usersApi.list(params),
  })
}

export function useUser(id: string) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => usersApi.get(id),
    enabled: !!id,  // Don't fetch until ID is available
  })
}
```

## Mutation Hooks with Optimistic Updates

```typescript
export function useUpdateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => usersApi.update(id, data),

    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: userKeys.detail(id) })
      const previous = queryClient.getQueryData<User>(userKeys.detail(id))
      if (previous) {
        queryClient.setQueryData<User>(userKeys.detail(id), { ...previous, ...data })
      }
      return { previous }
    },

    onError: (_err, { id }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(userKeys.detail(id), context.previous)
      }
    },

    onSettled: (_data, _error, { id }) => {
      void queryClient.invalidateQueries({ queryKey: userKeys.detail(id) })
      void queryClient.invalidateQueries({ queryKey: userKeys.lists() })
    },
  })
}
```

Pattern: cancel queries -> save previous -> set optimistic -> rollback on error -> invalidate on settle.

## Prefetch Hooks

```typescript
export function usePrefetchUser() {
  const queryClient = useQueryClient()
  return useCallback((id: string) => {
    void queryClient.prefetchQuery({
      queryKey: userKeys.detail(id),
      queryFn: () => usersApi.get(id),
    })
  }, [queryClient])
}
```

Used on `onMouseEnter` for instant navigation. `useCallback` ensures stable function reference.
