import { http, HttpResponse } from 'msw'
import { z } from 'zod'
import { DEFAULT_USER, type AuthUser } from '@/auth/providers/mock'

// Validation schema for login
const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
})

// Mock session state
let currentUser: AuthUser | null = null

export const authHandlers = [
  // Get current session
  http.get('*/auth/session', () => {
    if (!currentUser) {
      return new HttpResponse(null, { status: 401 })
    }
    return HttpResponse.json({ user: currentUser })
  }),

  // Login
  http.post('*/auth/login', async ({ request }) => {
    const body = await request.json()
    const result = LoginSchema.safeParse(body)

    if (!result.success) {
      return HttpResponse.json(
        { detail: result.error.issues.map((i) => ({ loc: [i.path[0]], msg: i.message })) },
        { status: 422 }
      )
    }

    // Create user from email (use default name or derive from email)
    const emailName = result.data.email.split('@')[0] || 'User'
    const userName = emailName.charAt(0).toUpperCase() + emailName.slice(1)

    currentUser = {
      id: crypto.randomUUID(),
      email: result.data.email,
      name: result.data.email === DEFAULT_USER.email ? DEFAULT_USER.name : userName,
    }

    return HttpResponse.json({
      user: currentUser,
      token: 'mock-session-token',
    })
  }),

  // Logout
  http.post('*/auth/logout', () => {
    currentUser = null
    return new HttpResponse(null, { status: 204 })
  }),
]

// Reset auth state for test isolation
export function resetAuth(): void {
  currentUser = null
}

// Set auth state for tests
export function setCurrentUser(user: AuthUser | null): void {
  currentUser = user
}

// Re-export for backward compatibility
export { DEFAULT_USER }
