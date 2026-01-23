import { http, HttpResponse } from 'msw'
import { mockUsers, createUser } from '../factories'
import type { UserCreate, UserUpdate } from '@/api/types'

// Mutable copy for CRUD operations
let users = [...mockUsers]

export const userHandlers = [
  // List (paginated)
  http.get('*/users', ({ request }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const size = parseInt(url.searchParams.get('size') || '10')
    const start = (page - 1) * size

    return HttpResponse.json({
      items: users.slice(start, start + size),
      total: users.length,
      page,
      size,
      pages: Math.ceil(users.length / size),
    })
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
    const body = (await request.json()) as UserCreate
    const user = createUser({ ...body })
    users.push(user)
    return HttpResponse.json(user, { status: 201 })
  }),

  // Update
  http.patch('*/users/:id', async ({ params, request }) => {
    const idx = users.findIndex((u) => u.id === params.id)
    if (idx === -1) {
      return new HttpResponse(null, { status: 404 })
    }
    const body = (await request.json()) as UserUpdate
    // Non-null assertion safe: idx !== -1 check above guarantees element exists
    const current = users[idx]!
    users[idx] = {
      id: current.id,
      email: body.email ?? current.email,
      name: body.name ?? current.name,
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
