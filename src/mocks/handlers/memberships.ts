import { http, HttpResponse } from 'msw'
import { mockMemberships, createMembership } from '../factories'
import type { MembershipCreate, MembershipUpdate } from '@/api/types'

// Mutable copy for CRUD operations
let memberships = [...mockMemberships]

export const membershipHandlers = [
  // List (paginated)
  http.get('*/memberships', ({ request }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const size = parseInt(url.searchParams.get('size') || '10')
    const start = (page - 1) * size

    return HttpResponse.json({
      items: memberships.slice(start, start + size),
      total: memberships.length,
      page,
      size,
      pages: Math.ceil(memberships.length / size),
    })
  }),

  // Create
  http.post('*/memberships', async ({ request }) => {
    const body = (await request.json()) as MembershipCreate
    const membership = createMembership({ ...body })
    memberships.push(membership)
    return HttpResponse.json(membership, { status: 201 })
  }),

  // Update (role only)
  http.patch('*/memberships/:id', async ({ params, request }) => {
    const idx = memberships.findIndex((m) => m.id === params.id)
    if (idx === -1) {
      return new HttpResponse(null, { status: 404 })
    }
    const body = (await request.json()) as MembershipUpdate
    // Non-null assertion safe: idx !== -1 check above guarantees element exists
    const current = memberships[idx]!
    if (body.role) {
      memberships[idx] = {
        id: current.id,
        user_id: current.user_id,
        organization_id: current.organization_id,
        role: body.role,
        created_at: current.created_at,
        updated_at: new Date().toISOString(),
      }
    }
    return HttpResponse.json(memberships[idx])
  }),

  // Delete
  http.delete('*/memberships/:id', ({ params }) => {
    const idx = memberships.findIndex((m) => m.id === params.id)
    if (idx === -1) {
      return new HttpResponse(null, { status: 404 })
    }
    memberships.splice(idx, 1)
    return new HttpResponse(null, { status: 204 })
  }),
]

// Reset function for testing
export function resetMemberships() {
  memberships = [...mockMemberships]
}
