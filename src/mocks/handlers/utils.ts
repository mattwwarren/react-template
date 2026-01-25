/**
 * Shared utilities for MSW handlers.
 * Centralizes pagination logic to avoid DRY violations across handlers.
 */

import { getPaginationFromUrl, PAGINATION_DEFAULTS } from '@/lib/pagination'

// Re-export for handler use
export { getPaginationFromUrl as extractPaginationFromUrl, PAGINATION_DEFAULTS }

/**
 * Generic paginated response type matching backend Page_* schemas.
 */
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  size: number
  pages: number
}

/**
 * Paginate an array of items.
 * @param items - The full array of items
 * @param page - Page number (1-indexed)
 * @param size - Page size
 */
export function paginateArray<T>(items: T[], page: number, size: number): PaginatedResponse<T> {
  const start = (page - 1) * size
  return {
    items: items.slice(start, start + size),
    total: items.length,
    page,
    size,
    pages: Math.ceil(items.length / size),
  }
}
