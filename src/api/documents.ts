import { fetchApi, fetchApiFormData, API_BASE_URL } from './client';
import type { Document, PaginationParams } from './types';

// Generic paginated response type for documents
interface PaginatedDocuments {
  items: Document[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export const documentsApi = {
  list: (params: PaginationParams = {}) =>
    fetchApi<PaginatedDocuments>(`/documents?page=${params.page ?? 1}&size=${params.size ?? 10}`),

  upload: async (file: File, organizationId: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('organization_id', organizationId);

    return fetchApiFormData<Document>('/documents', formData);
  },

  get: (id: string) =>
    fetchApi<Document>(`/documents/${id}`),

  delete: (id: string) =>
    fetchApi<void>(`/documents/${id}`, { method: 'DELETE' }),

  getDownloadUrl: (id: string) => {
    return `${API_BASE_URL}/documents/${id}`;
  },
};
