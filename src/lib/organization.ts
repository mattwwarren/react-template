/**
 * Organization selection state management.
 * Stores selected organization ID in localStorage.
 */

const STORAGE_KEY = 'selectedOrganizationId'

/**
 * Retrieve the selected organization ID from localStorage.
 * Returns null if not set or if localStorage is unavailable.
 */
export function getSelectedOrganization(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

/**
 * Store the selected organization ID in localStorage.
 * Dispatches a storage event for cross-tab synchronization.
 */
export function setSelectedOrganization(orgId: string): void {
  localStorage.setItem(STORAGE_KEY, orgId)

  // Dispatch storage event for cross-tab sync
  window.dispatchEvent(
    new StorageEvent('storage', {
      key: STORAGE_KEY,
      newValue: orgId,
    })
  )
}

/**
 * Clear the selected organization ID from localStorage.
 * Dispatches a storage event for cross-tab synchronization.
 */
export function clearSelectedOrganization(): void {
  localStorage.removeItem(STORAGE_KEY)

  window.dispatchEvent(
    new StorageEvent('storage', {
      key: STORAGE_KEY,
      newValue: null,
    })
  )
}
