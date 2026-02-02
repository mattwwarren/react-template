import { authHandlers, resetAuth } from './auth'
import { documentHandlers, resetDocuments } from './documents'
import { membershipHandlers, resetMemberships } from './memberships'
import { organizationHandlers, resetOrganizations } from './organizations'
import { resetUsers, userHandlers } from './users'

export const handlers = [
  ...authHandlers,
  ...userHandlers,
  ...organizationHandlers,
  ...membershipHandlers,
  ...documentHandlers,
]

// Reset all handlers to initial state (for test isolation)
export function resetAllHandlers(): void {
  resetAuth()
  resetUsers()
  resetOrganizations()
  resetMemberships()
  resetDocuments()
}

// Re-export individual reset functions for granular control
export { resetAuth, resetUsers, resetOrganizations, resetMemberships, resetDocuments }
