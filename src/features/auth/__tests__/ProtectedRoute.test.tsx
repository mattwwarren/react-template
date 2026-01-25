import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ProtectedRoute } from '../ProtectedRoute'

// Mock the useAuth hook
const mockUseAuth = vi.fn()

vi.mock('@/auth', () => ({
  useAuth: () => mockUseAuth(),
}))

describe('ProtectedRoute', () => {
  beforeEach(() => {
    mockUseAuth.mockReset()
  })

  it('shows loading spinner when isLoading is true', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      user: null,
      error: null,
      login: vi.fn(),
      logout: vi.fn(),
    })

    const { container } = render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/protected" element={<div>Protected Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    )

    // Should show loading spinner, not content
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()

    // LoadingSpinner renders an animated SVG
    const spinner = container.querySelector('svg.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('redirects to login when not authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      error: null,
      login: vi.fn(),
      logout: vi.fn(),
    })

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/protected" element={<div>Protected Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    )

    // Should redirect to login
    expect(screen.getByText('Login Page')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('renders children when authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: '1', email: 'test@example.com', name: 'Test User' },
      error: null,
      login: vi.fn(),
      logout: vi.fn(),
    })

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/protected" element={<div>Protected Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    )

    // Should show protected content
    expect(screen.getByText('Protected Content')).toBeInTheDocument()
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument()
  })

  it('preserves location state when redirecting to login', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      error: null,
      login: vi.fn(),
      logout: vi.fn(),
    })

    const LocationChecker = (): React.ReactElement => {
      const location = useLocation()
      const state = location.state as { from?: { pathname: string } } | null
      return <div data-testid="location-state">{state?.from?.pathname ?? 'no-state'}</div>
    }

    render(
      <MemoryRouter initialEntries={['/protected/deep/path']}>
        <Routes>
          <Route path="/login" element={<LocationChecker />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/protected/*" element={<div>Protected Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    )

    // Should preserve the original location in state
    expect(screen.getByTestId('location-state')).toHaveTextContent('/protected/deep/path')
  })

  it('renders nested routes when authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: '1', email: 'test@example.com', name: 'Test User' },
      error: null,
      login: vi.fn(),
      logout: vi.fn(),
    })

    render(
      <MemoryRouter initialEntries={['/protected/nested']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/protected" element={<div>Protected Parent</div>}>
              <Route path="nested" element={<div>Nested Content</div>} />
            </Route>
          </Route>
        </Routes>
      </MemoryRouter>
    )

    // Should render nested routes
    expect(screen.getByText('Protected Parent')).toBeInTheDocument()
  })
})
