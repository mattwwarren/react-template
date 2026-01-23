import { faker } from '@faker-js/faker'

// Seed for reproducible data across test runs
faker.seed(12345)

export { faker }

// Re-export factories
export * from './users'
export * from './organizations'
export * from './memberships'
export * from './documents'
export * from './dataset'
