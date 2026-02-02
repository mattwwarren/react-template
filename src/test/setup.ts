import '@testing-library/jest-dom'
import { setupServer } from 'msw/node'
import { handlers, resetAllHandlers } from '@/mocks/handlers'

// Create MSW server for test environment
export const server = setupServer(...handlers)

// Establish API mocking before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

// Reset handlers and mock data after each test for isolation
afterEach(() => {
  server.resetHandlers()
  resetAllHandlers()
})

// Clean up after all tests are done
afterAll(() => server.close())
