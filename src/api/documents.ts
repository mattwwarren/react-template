import { fetchApi } from './client';
import type { Document } from './types';

export const documentsApi = {
  upload: async (file: File, organizationId: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('organization_id', organizationId);

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const response = await fetch(`${apiUrl}/documents`, {
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
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    return `${apiUrl}/documents/${id}`;
  },
};
