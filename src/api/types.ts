// Re-export generated types with convenient aliases
import type { components } from './generated/types'

// Schema type aliases
export type User = components['schemas']['UserRead']
export type UserCreate = components['schemas']['UserCreate']
export type UserUpdate = components['schemas']['UserUpdate']

export type Organization = components['schemas']['OrganizationRead']
export type OrganizationCreate = components['schemas']['OrganizationCreate']
export type OrganizationUpdate = components['schemas']['OrganizationUpdate']

export type Membership = components['schemas']['MembershipRead']
export type MembershipCreate = components['schemas']['MembershipCreate']
export type MembershipUpdate = components['schemas']['MembershipUpdate']
export type MembershipRole = components['schemas']['MembershipRole']

export type Document = components['schemas']['DocumentRead']

// Pagination types
export type PaginatedUsers = components['schemas']['Page_UserRead_']
export type PaginatedOrganizations = components['schemas']['Page_OrganizationRead_']
export type PaginatedMemberships = components['schemas']['Page_MembershipRead_']

// Nested info types (used in relationships)
export type OrganizationInfo = components['schemas']['OrganizationInfo']
export type UserInfo = components['schemas']['UserInfo']

// Common pagination params (API uses page/size, not skip/limit)
export interface PaginationParams {
  page?: number
  size?: number
}
