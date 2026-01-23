import { userHandlers, resetUsers } from './users'
import { organizationHandlers, resetOrganizations } from './organizations'
import { membershipHandlers, resetMemberships } from './memberships'
import { documentHandlers, resetDocuments } from './documents'

export const handlers = [
  ...userHandlers,
  ...organizationHandlers,
  ...membershipHandlers,
  ...documentHandlers,
]

// Reset all handlers to initial state (for test isolation)
export function resetAllHandlers() {
  resetUsers()
  resetOrganizations()
  resetMemberships()
  resetDocuments()
}

// Re-export individual reset functions for granular control
export { resetUsers, resetOrganizations, resetMemberships, resetDocuments }
