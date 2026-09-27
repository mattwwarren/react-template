import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '@/test/utils'
import { UploadDialog } from '../UploadDialog'

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    promise: vi.fn(),
  },
}))

describe('UploadDialog', () => {
  it('renders a labelled file input', () => {
    renderWithProviders(<UploadDialog open onOpenChange={vi.fn()} />)

    const fileInput = screen.getByLabelText('File')
    expect(fileInput).toBeInstanceOf(HTMLInputElement)
    expect(fileInput).toHaveAttribute('type', 'file')
  })
})
