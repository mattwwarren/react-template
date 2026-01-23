import { http, HttpResponse } from 'msw'
import { mockOrganizations, createOrganization } from '../factories'
import type { OrganizationCreate, OrganizationUpdate } from '@/api/types'

// Mutable copy for CRUD operations
let organizations = [...mockOrganizations]

export const organizationHandlers = [
  // List (paginated)
  http.get('*/organizations', ({ request }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const size = parseInt(url.searchParams.get('size') || '10')
    const start = (page - 1) * size

    return HttpResponse.json({
      items: organizations.slice(start, start + size),
      total: organizations.length,
      page,
      size,
      pages: Math.ceil(organizations.length / size),
    })
  }),

  // Get single
  http.get('*/organizations/:id', ({ params }) => {
    const org = organizations.find((o) => o.id === params.id)
    if (!org) {
      return new HttpResponse(null, { status: 404 })
    }
    return HttpResponse.json(org)
  }),

  // Create
  http.post('*/organizations', async ({ request }) => {
    const body = (await request.json()) as OrganizationCreate
    const org = createOrganization({ ...body })
    organizations.push(org)
    return HttpResponse.json(org, { status: 201 })
  }),

  // Update
  http.patch('*/organizations/:id', async ({ params, request }) => {
    const idx = organizations.findIndex((o) => o.id === params.id)
    if (idx === -1) {
      return new HttpResponse(null, { status: 404 })
    }
    const body = (await request.json()) as OrganizationUpdate
    // Non-null assertion safe: idx !== -1 check above guarantees element exists
    const current = organizations[idx]!
    organizations[idx] = {
      id: current.id,
      name: body.name ?? current.name,
      created_at: current.created_at,
      updated_at: new Date().toISOString(),
      ...(current.users && { users: current.users }),
    }
    return HttpResponse.json(organizations[idx])
  }),

  // Delete
  http.delete('*/organizations/:id', ({ params }) => {
    const idx = organizations.findIndex((o) => o.id === params.id)
    if (idx === -1) {
      return new HttpResponse(null, { status: 404 })
    }
    organizations.splice(idx, 1)
    return new HttpResponse(null, { status: 204 })
  }),
]

// Reset function for testing
export function resetOrganizations() {
  organizations = [...mockOrganizations]
}
