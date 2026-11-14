import { getResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { API_BASE_URL } from '@/api/client'
import { mockDocuments, mockOrganizations, mockUsers } from '../factories'
import { handlers } from '../handlers'

const resolve = (url: string, method = 'GET') => getResponse(handlers, new Request(url, { method }))

describe('handler scope', () => {
  describe('Vite module URLs are not intercepted', () => {
    it.each(
      ['http://localhost:5173'].flatMap((origin) =>
        [
          '/src/features/documents/DocumentsPage.tsx',
          '/src/features/users/UsersPage.tsx',
          '/src/features/organizations/OrganizationsPage.tsx',
          '/src/features/documents/DocumentsPage.tsx?t=1700000000000',
        ].map((path) => `${origin}${path}`)
      )
    )('GET %s is not handled', async (url) => {
      expect(await resolve(url)).toBeUndefined()
    })

    it.each([
      ['PATCH', 'http://localhost:5173/src/features/users/UsersPage.tsx'],
      ['DELETE', 'http://localhost:5173/src/features/users/UsersPage.tsx'],
      ['PATCH', 'http://localhost:5173/src/features/memberships/MembersList.tsx'],
      ['DELETE', 'http://localhost:5173/src/features/memberships/MembersList.tsx'],
    ])('%s %s is not handled', async (method, url) => {
      expect(await resolve(url, method)).toBeUndefined()
    })
  })

  describe('real API paths still resolve', () => {
    const firstUser = mockUsers[0]
    const firstOrg = mockOrganizations[0]
    const firstDoc = mockDocuments[0]

    it('lists users with unchanged pagination data', async () => {
      const res = await resolve(`${API_BASE_URL}/users?page=1&size=10`)
      expect(res?.status).toBe(200)
      const body = await res?.json()
      expect(body.total).toBe(25)
      expect(body.items).toHaveLength(10)
    })

    it('returns a single user by id', async () => {
      const res = await resolve(`${API_BASE_URL}/users/${firstUser?.id ?? ''}`)
      expect(res?.status).toBe(200)
      const body = await res?.json()
      expect(body.id).toBe(firstUser?.id)
    })

    it('keeps the 404 for an unknown user', async () => {
      const res = await resolve(`${API_BASE_URL}/users/does-not-exist`)
      expect(res?.status).toBe(404)
    })

    it('returns a single organization by id', async () => {
      const res = await resolve(`${API_BASE_URL}/organizations/${firstOrg?.id ?? ''}`)
      expect(res?.status).toBe(200)
    })

    it('returns a single document by id', async () => {
      const res = await resolve(`${API_BASE_URL}/documents/${firstDoc?.id ?? ''}`)
      expect(res?.status).toBe(200)
    })

    it('serves a document download', async () => {
      const res = await resolve(`${API_BASE_URL}/documents/${firstDoc?.id ?? ''}/download`)
      expect(res?.status).toBe(200)
    })
  })
})
