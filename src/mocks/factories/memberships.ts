import type { Membership, MembershipRole } from '@/api/types'
import { faker } from './index'

const ROLES: MembershipRole[] = ['owner', 'admin', 'member']

export function createMembership(overrides?: Partial<Membership>): Membership {
  const createdAt = faker.date.past().toISOString()
  return {
    id: faker.string.uuid(),
    user_id: faker.string.uuid(),
    organization_id: faker.string.uuid(),
    role: faker.helpers.arrayElement(ROLES),
    created_at: createdAt,
    updated_at: createdAt,
    ...overrides,
  }
}

export function createMemberships(count: number): Membership[] {
  return Array.from({ length: count }, () => createMembership())
}
