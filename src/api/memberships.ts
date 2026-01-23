import { fetchApi } from './client';
import type { Membership, MembershipCreate, MembershipUpdate, PaginatedMemberships, PaginationParams } from './types';

export const membershipsApi = {
  list: (params: PaginationParams = {}) =>
    fetchApi<PaginatedMemberships>(`/memberships?page=${params.page ?? 1}&size=${params.size ?? 10}`),

  create: (data: MembershipCreate) =>
    fetchApi<Membership>('/memberships', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: MembershipUpdate) =>
    fetchApi<Membership>(`/memberships/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchApi<void>(`/memberships/${id}`, { method: 'DELETE' }),
};
