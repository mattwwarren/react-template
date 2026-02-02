import { faker } from '@faker-js/faker'
import type { Document, Membership, Organization, User } from '@/api/types'
import { createDocument } from './documents'
import { createMembership } from './memberships'
import { createOrganization, createOrganizationInfo } from './organizations'
import { createUser, createUserInfo } from './users'

// Generate consistent dataset with relationships
function generateDataset() {
  // Reset seed for consistent generation
  faker.seed(12345)

  // Create 5 organizations
  const organizations: Organization[] = Array.from({ length: 5 }, () => createOrganization())

  // Create 25 users
  const users: User[] = Array.from({ length: 25 }, () => createUser())

  // Create memberships linking users to organizations
  const memberships: Membership[] = []

  // Each org has 1 owner, 2 admins, and 2 members (5 users per org)
  organizations.forEach((org, orgIndex) => {
    const orgUsers = users.slice(orgIndex * 5, orgIndex * 5 + 5)

    // First user is owner
    if (orgUsers[0]) {
      memberships.push(
        createMembership({
          user_id: orgUsers[0].id,
          organization_id: org.id,
          role: 'owner',
        })
      )
    }

    // Next 2 are admins
    orgUsers.slice(1, 3).forEach((user) => {
      memberships.push(
        createMembership({
          user_id: user.id,
          organization_id: org.id,
          role: 'admin',
        })
      )
    })

    // Rest are members
    orgUsers.slice(3).forEach((user) => {
      memberships.push(
        createMembership({
          user_id: user.id,
          organization_id: org.id,
          role: 'member',
        })
      )
    })
  })

  // Update users with their organization info
  users.forEach((user) => {
    const userMemberships = memberships.filter((m) => m.user_id === user.id)
    user.organizations = userMemberships
      .map((m) => {
        const org = organizations.find((o) => o.id === m.organization_id)
        return org ? createOrganizationInfo({ id: org.id, name: org.name }) : null
      })
      .filter((org): org is ReturnType<typeof createOrganizationInfo> => org !== null)
  })

  // Update organizations with their user info
  organizations.forEach((org) => {
    const orgMemberships = memberships.filter((m) => m.organization_id === org.id)
    org.users = orgMemberships
      .map((m) => {
        const user = users.find((u) => u.id === m.user_id)
        return user ? createUserInfo({ id: user.id, email: user.email, name: user.name }) : null
      })
      .filter((user): user is ReturnType<typeof createUserInfo> => user !== null)
  })

  // Create 50 documents spread across organizations
  const documents: Document[] = organizations.flatMap((org) =>
    Array.from({ length: 10 }, () => createDocument({ organization_id: org.id }))
  )

  return { users, organizations, memberships, documents }
}

// Export pre-generated dataset
export const mockDataset = generateDataset()

// Convenience exports
export const mockUsers = mockDataset.users
export const mockOrganizations = mockDataset.organizations
export const mockMemberships = mockDataset.memberships
export const mockDocuments = mockDataset.documents
