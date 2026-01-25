import type { Document } from '@/api/types'
import { faker } from './index'

const FILE_TYPES = [
  { ext: 'pdf', mime: 'application/pdf' },
  { ext: 'docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
  { ext: 'xlsx', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
  { ext: 'png', mime: 'image/png' },
  { ext: 'jpg', mime: 'image/jpeg' },
]

export function createDocument(overrides?: Partial<Document>): Document {
  const fileType = faker.helpers.arrayElement(FILE_TYPES)
  const createdAt = faker.date.past().toISOString()
  const id = faker.string.uuid()

  return {
    id,
    filename: `${faker.system.fileName()}.${fileType.ext}`,
    content_type: fileType.mime,
    file_size: faker.number.int({ min: 1024, max: 10485760 }), // 1KB - 10MB
    organization_id: faker.string.uuid(),
    storage_url: `/documents/${id}/download`,
    created_at: createdAt,
    updated_at: createdAt,
    ...overrides,
  }
}

export function createDocuments(count: number): Document[] {
  return Array.from({ length: count }, () => createDocument())
}
