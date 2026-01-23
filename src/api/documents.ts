import { fetchApi, API_BASE_URL } from './client';
import type { Document } from './types';

export const documentsApi = {
  upload: async (file: File, organizationId: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('organization_id', organizationId);

    const response = await fetch(`${API_BASE_URL}/documents`, {
      method: 'POST',
      body: formData, // No Content-Type header - browser sets it with boundary
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return response.json() as Promise<Document>;
  },

  get: (id: string) =>
    fetchApi<Document>(`/documents/${id}`),

  delete: (id: string) =>
    fetchApi<void>(`/documents/${id}`, { method: 'DELETE' }),

  getDownloadUrl: (id: string) => {
    return `${API_BASE_URL}/documents/${id}`;
  },
};
