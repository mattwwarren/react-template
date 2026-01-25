import type { Organization, OrganizationInfo } from '@/api/types'
import { faker } from './index'

export function createOrganization(overrides?: Partial<Organization>): Organization {
  const createdAt = faker.date.past().toISOString()
  return {
    id: faker.string.uuid(),
    name: faker.company.name(),
    created_at: createdAt,
    updated_at: createdAt,
    users: [],
    ...overrides,
  }
}

export function createOrganizationInfo(overrides?: Partial<OrganizationInfo>): OrganizationInfo {
  const createdAt = faker.date.past().toISOString()
  return {
    id: faker.string.uuid(),
    name: faker.company.name(),
    created_at: createdAt,
    updated_at: createdAt,
    ...overrides,
  }
}

export function createOrganizations(count: number): Organization[] {
  return Array.from({ length: count }, () => createOrganization())
}
