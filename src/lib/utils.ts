import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Re-export pagination utilities for backward compatibility
export { getPaginationFromSearchParams as getPaginationParams, PAGINATION_DEFAULTS } from './pagination'

/**
 * Format a date string or Date object for display.
 * @param date - The date to format
 * @param format - 'short' (default) or 'long'
 */
export function formatDate(date: string | Date, format: 'short' | 'long' = 'short'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format === 'short'
    ? d.toLocaleDateString()
    : d.toLocaleDateString(undefined, { dateStyle: 'long' });
}
