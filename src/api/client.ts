export const API_BASE_URL = import.meta.env.VITE_API_URL ?? '/api'

export class ApiError extends Error {
  status: number
  statusText: string

  constructor(status: number, statusText: string, message?: string) {
    super(message ?? `${status} ${statusText}`)
    this.name = 'ApiError'
    this.status = status
    this.statusText = statusText
  }
}

/**
 * Handles API response - throws ApiError for non-OK status, returns parsed JSON
 * Handles 204 No Content responses by returning undefined
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new ApiError(response.status, response.statusText, body.detail ?? body.message)
  }

  if (response.status === 204) {
    return undefined as unknown as T
  }

  return response.json() as Promise<T>
}

export async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  return handleResponse<T>(response)
}

/**
 * Fetch wrapper for FormData uploads (no Content-Type header - browser sets it with boundary)
 * Handles errors the same way as fetchApi, throwing ApiError on failure
 */
export async function fetchApiFormData<T>(
  endpoint: string,
  formData: FormData,
  options?: Omit<RequestInit, 'body' | 'headers'>
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  const response = await fetch(url, {
    method: 'POST',
    ...options,
    body: formData,
    // No Content-Type header - browser sets it with boundary for FormData
  })

  return handleResponse<T>(response)
}
