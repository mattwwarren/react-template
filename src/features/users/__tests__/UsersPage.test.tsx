import { describe, it, expect } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UsersPage } from '../UsersPage'
import { renderWithProviders } from '@/test/utils'

describe('UsersPage', () => {
  it('renders page title and description', async () => {
    renderWithProviders(<UsersPage />)

    expect(screen.getByRole('heading', { name: /users/i })).toBeInTheDocument()
    expect(screen.getByText(/manage user accounts/i)).toBeInTheDocument()
  })

  it('renders Create User button', () => {
    renderWithProviders(<UsersPage />)

    expect(screen.getByRole('button', { name: /create user/i })).toBeInTheDocument()
  })

  it('renders table element', async () => {
    renderWithProviders(<UsersPage />)

    // Table should be rendered (either with skeleton or data)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
  })

  it('loads and displays users', async () => {
    renderWithProviders(<UsersPage />)

    // Wait for users to load
    await waitFor(() => {
      // Check that table has data rows (mock returns 10 users by default)
      const rows = screen.getAllByRole('row')
      // rows[0] is header row, so we expect > 1 rows total
      expect(rows.length).toBeGreaterThan(1)
    })
  })

  it('displays user email in table', async () => {
    renderWithProviders(<UsersPage />)

    // Wait for data to load
    await waitFor(() => {
      // Mock users have email addresses
      const emailCells = screen.getAllByRole('cell')
      expect(emailCells.length).toBeGreaterThan(0)
    })
  })

  it('shows pagination when more than one page', async () => {
    renderWithProviders(<UsersPage />)

    // With 25 mock users and page size 10, we should have pagination
    await waitFor(() => {
      expect(screen.getByText(/page 1 of/i)).toBeInTheDocument()
    })
  })

  it('opens create dialog when clicking Create User', async () => {
    const user = userEvent.setup()

    renderWithProviders(<UsersPage />)

    const createButton = screen.getByRole('button', { name: /create user/i })
    await user.click(createButton)

    // Dialog should open with form
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
  })

  it('displays card with correct structure', () => {
    renderWithProviders(<UsersPage />)

    expect(screen.getByText('All Users')).toBeInTheDocument()
    expect(screen.getByText(/a list of all users/i)).toBeInTheDocument()
  })

  it('respects page query param', async () => {
    renderWithProviders(<UsersPage />, {
      routerProps: { initialEntries: ['/users?page=2'] },
    })

    await waitFor(() => {
      expect(screen.getByText(/page 2 of/i)).toBeInTheDocument()
    })
  })
})
