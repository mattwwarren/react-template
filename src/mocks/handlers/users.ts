import { http, HttpResponse } from 'msw'
import { z } from 'zod'
import { mockUsers, createUser } from '../factories'
import { extractPaginationFromUrl, paginateArray } from './utils'

// Validation schemas for request bodies
const UserCreateSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
})

const UserUpdateSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
})

// Mutable copy for CRUD operations
let users = [...mockUsers]

export const userHandlers = [
  // List (paginated)
  http.get('*/users', ({ request }) => {
    const url = new URL(request.url)
    const { page, size } = extractPaginationFromUrl(url)

    return HttpResponse.json(paginateArray(users, page, size))
  }),

  // Get single
  http.get('*/users/:id', ({ params }) => {
    const user = users.find((u) => u.id === params.id)
    if (!user) {
      return new HttpResponse(null, { status: 404 })
    }
    return HttpResponse.json(user)
  }),

  // Create
  http.post('*/users', async ({ request }) => {
    const body = await request.json()
    const result = UserCreateSchema.safeParse(body)

    if (!result.success) {
      return HttpResponse.json(
        { detail: result.error.issues.map((i) => ({ loc: [i.path[0]], msg: i.message })) },
        { status: 422 }
      )
    }

    const user = createUser({ ...result.data })
    users.push(user)
    return HttpResponse.json(user, { status: 201 })
  }),

  // Update
  http.patch('*/users/:id', async ({ params, request }) => {
    const idx = users.findIndex((u) => u.id === params.id)
    if (idx === -1) {
      return new HttpResponse(null, { status: 404 })
    }

    const body = await request.json()
    const result = UserUpdateSchema.safeParse(body)

    if (!result.success) {
      return HttpResponse.json(
        { detail: result.error.issues.map((i) => ({ loc: [i.path[0]], msg: i.message })) },
        { status: 422 }
      )
    }

    // Non-null assertion safe: idx !== -1 check above guarantees element exists
    const current = users[idx]!
    users[idx] = {
      id: current.id,
      email: result.data.email ?? current.email,
      name: result.data.name ?? current.name,
      created_at: current.created_at,
      updated_at: new Date().toISOString(),
      ...(current.organizations && { organizations: current.organizations }),
    }
    return HttpResponse.json(users[idx])
  }),

  // Delete
  http.delete('*/users/:id', ({ params }) => {
    const idx = users.findIndex((u) => u.id === params.id)
    if (idx === -1) {
      return new HttpResponse(null, { status: 404 })
    }
    users.splice(idx, 1)
    return new HttpResponse(null, { status: 204 })
  }),
]

// Reset function for testing
export function resetUsers() {
  users = [...mockUsers]
}
