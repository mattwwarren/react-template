import { fetchApi } from './client';
import type { User, UserCreate, UserUpdate, PaginatedUsers, PaginationParams } from './types';

export const usersApi = {
  list: (params: PaginationParams = {}) =>
    fetchApi<PaginatedUsers>(`/users?page=${params.page ?? 1}&size=${params.size ?? 10}`),

  get: (id: string) =>
    fetchApi<User>(`/users/${id}`),

  create: (data: UserCreate) =>
    fetchApi<User>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: UserUpdate) =>
    fetchApi<User>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchApi<void>(`/users/${id}`, { method: 'DELETE' }),
};
