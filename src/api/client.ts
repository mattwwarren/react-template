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

export async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new ApiError(
      response.status,
      response.statusText,
      body.detail ?? body.message
    )
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}
