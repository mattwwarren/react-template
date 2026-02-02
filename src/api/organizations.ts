import { fetchApi } from './client'
import type {
  Organization,
  OrganizationCreate,
  OrganizationUpdate,
  PaginatedOrganizations,
  PaginationParams,
} from './types'

export const organizationsApi = {
  list: (params: PaginationParams = {}) =>
    fetchApi<PaginatedOrganizations>(
      `/organizations?page=${params.page ?? 1}&size=${params.size ?? 10}`
    ),

  get: (id: string) => fetchApi<Organization>(`/organizations/${id}`),

  create: (data: OrganizationCreate) =>
    fetchApi<Organization>('/organizations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: OrganizationUpdate) =>
    fetchApi<Organization>(`/organizations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) => fetchApi<void>(`/organizations/${id}`, { method: 'DELETE' }),
}
