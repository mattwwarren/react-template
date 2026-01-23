import { faker } from './index'
import type { User, UserInfo } from '@/api/types'

export function createUser(overrides?: Partial<User>): User {
  const createdAt = faker.date.past().toISOString()
  return {
    id: faker.string.uuid(),
    email: faker.internet.email(),
    name: faker.person.fullName(),
    created_at: createdAt,
    updated_at: createdAt,
    organizations: [],
    ...overrides,
  }
}

export function createUserInfo(overrides?: Partial<UserInfo>): UserInfo {
  const createdAt = faker.date.past().toISOString()
  return {
    id: faker.string.uuid(),
    email: faker.internet.email(),
    name: faker.person.fullName(),
    created_at: createdAt,
    updated_at: createdAt,
    ...overrides,
  }
}

export function createUsers(count: number): User[] {
  return Array.from({ length: count }, () => createUser())
}
