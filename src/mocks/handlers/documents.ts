import { http, HttpResponse } from 'msw'
import { mockDocuments, mockOrganizations, createDocument } from '../factories'

// Mutable copy for CRUD operations
let documents = [...mockDocuments]

export const documentHandlers = [
  // Upload (multipart/form-data)
  http.post('*/documents', async ({ request }) => {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return HttpResponse.json(
        { detail: [{ loc: ['body', 'file'], msg: 'Field required', type: 'missing' }] },
        { status: 422 }
      )
    }

    // Use first organization for mock uploads
    const orgId = mockOrganizations[0]?.id ?? 'mock-org-id'

    const doc = createDocument({
      filename: file.name,
      content_type: file.type || 'application/octet-stream',
      file_size: file.size,
      organization_id: orgId,
    })
    documents.push(doc)
    return HttpResponse.json(doc, { status: 201 })
  }),

  // Get metadata
  http.get('*/documents/:id', ({ params }) => {
    const doc = documents.find((d) => d.id === params.id)
    if (!doc) {
      return new HttpResponse(null, { status: 404 })
    }
    return HttpResponse.json(doc)
  }),

  // Download (returns mock file content)
  http.get('*/documents/:id/download', ({ params }) => {
    const doc = documents.find((d) => d.id === params.id)
    if (!doc) {
      return new HttpResponse(null, { status: 404 })
    }

    // Return a simple text response as mock file content
    const mockContent = `Mock file content for ${doc.filename}`
    return new HttpResponse(mockContent, {
      headers: {
        'Content-Type': doc.content_type,
        'Content-Disposition': `attachment; filename="${doc.filename}"`,
      },
    })
  }),

  // Delete
  http.delete('*/documents/:id', ({ params }) => {
    const idx = documents.findIndex((d) => d.id === params.id)
    if (idx === -1) {
      return new HttpResponse(null, { status: 404 })
    }
    documents.splice(idx, 1)
    return new HttpResponse(null, { status: 204 })
  }),
]

// Reset function for testing
export function resetDocuments() {
  documents = [...mockDocuments]
}
