/**
 * Default pagination parameters
 */
export const PAGINATION_DEFAULTS = {
  page: 1,
  size: 10,
} as const

/**
 * Extracts pagination parameters from URL search params.
 * Used by page components to read pagination from URL.
 */
export function getPaginationFromSearchParams(searchParams: URLSearchParams): {
  page: number
  size: number
} {
  return {
    page: parseInt(searchParams.get('page') || String(PAGINATION_DEFAULTS.page), 10),
    size: parseInt(searchParams.get('size') || String(PAGINATION_DEFAULTS.size), 10),
  }
}

/**
 * Extracts pagination parameters from a URL object.
 * Used by mock handlers to parse request URLs.
 */
export function getPaginationFromUrl(url: URL): {
  page: number
  size: number
} {
  return getPaginationFromSearchParams(url.searchParams)
}
