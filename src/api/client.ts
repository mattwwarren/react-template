import { clearSelectedOrganization, getSelectedOrganization } from '@/lib/organization'

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4455'

/**
 * Branded type for UUID strings to prevent accidental mixing with regular strings.
 * Provides compile-time safety for UUID values.
 */
type UUID = string & { readonly __brand: 'UUID' }

/**
 * Type-safe error response interface.
 * Handles various backend error response formats.
 */
interface ErrorResponse {
  detail?: string | string[]
  message?: string
  code?: string
}

/**
 * Validate organization ID format (UUID v4).
 * Ensures the organization ID matches the expected UUID v4 pattern.
 * Returns a branded UUID type for stronger type safety.
 */
function isValidOrgId(value: unknown): value is UUID {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  )
}

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
 * Handles organization-related errors (403) by clearing localStorage and emitting event
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ErrorResponse

    // Handle organization-related errors (type-safe)
    if (response.status === 403) {
      const detail = Array.isArray(body.detail) ? body.detail[0] : body.detail

      if (typeof detail === 'string' && detail.toLowerCase().includes('organization')) {
        clearSelectedOrganization()

        // Emit event for UI to handle
        window.dispatchEvent(
          new CustomEvent('org:cleared', {
            detail: { reason: 'access_denied' },
          })
        )
      }
    }

    const detail = Array.isArray(body.detail) ? body.detail.join(', ') : body.detail
    throw new ApiError(response.status, response.statusText, detail ?? body.message)
  }

  if (response.status === 204) {
    return undefined as unknown as T
  }

  return response.json() as Promise<T>
}

export async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`

  // Inject organization header (validated)
  const selectedOrg = getSelectedOrganization()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  }

  // Validate before injection
  if (selectedOrg && isValidOrgId(selectedOrg)) {
    headers['X-Selected-Org'] = selectedOrg
  } else if (selectedOrg) {
    console.warn('Invalid organization ID in localStorage, clearing:', selectedOrg)
    clearSelectedOrganization()
  }

  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers,
  })

  return handleResponse<T>(response)
}

/**
 * Fetch wrapper for FormData uploads (no Content-Type header - browser sets it with boundary)
 * Handles errors the same way as fetchApi, throwing ApiError on failure
 * Injects X-Selected-Org header if organization is selected
 */
export async function fetchApiFormData<T>(
  endpoint: string,
  formData: FormData,
  options?: Omit<RequestInit, 'body' | 'headers'>
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`

  // Inject organization header (validated)
  const selectedOrg = getSelectedOrganization()
  const headers: Record<string, string> = {}

  if (selectedOrg && isValidOrgId(selectedOrg)) {
    headers['X-Selected-Org'] = selectedOrg
  } else if (selectedOrg) {
    console.warn('Invalid organization ID in localStorage, clearing:', selectedOrg)
    clearSelectedOrganization()
  }

  const response = await fetch(url, {
    method: 'POST',
    ...options,
    body: formData,
    credentials: 'include',
    headers,
    // No Content-Type header - browser sets it with boundary for FormData
  })

  return handleResponse<T>(response)
}
