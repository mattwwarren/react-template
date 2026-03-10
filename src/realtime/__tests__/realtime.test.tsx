import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, renderHook, screen } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// ---------------------------------------------------------------------------
// Mock socket.io-client
// ---------------------------------------------------------------------------
type SocketEventHandler = (...args: unknown[]) => void

const mockSocket = {
  on: vi.fn(),
  off: vi.fn(),
  disconnect: vi.fn(),
  connect: vi.fn(),
  connected: false,
  id: 'test-socket-id',
}

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket),
}))

// ---------------------------------------------------------------------------
// Mock @/auth
// ---------------------------------------------------------------------------
const mockUseAuth = vi.fn()

vi.mock('@/auth', () => ({
  useAuth: () => mockUseAuth(),
}))

// ---------------------------------------------------------------------------
// Imports (after mocks are registered)
// ---------------------------------------------------------------------------
import { io } from 'socket.io-client'
import { SocketProvider } from '../SocketContext'
import { useSocket } from '../useSocket'
import { useTaskEvents } from '../useTaskEvents'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })
}

function createWrapper(queryClient?: QueryClient) {
  const qc = queryClient ?? createTestQueryClient()
  return function Wrapper({ children }: { children: ReactNode }): ReactElement {
    return (
      <QueryClientProvider client={qc}>
        <SocketProvider>{children}</SocketProvider>
      </QueryClientProvider>
    )
  }
}

function renderWithSocket(ui: ReactElement, queryClient?: QueryClient) {
  const qc = queryClient ?? createTestQueryClient()
  const Wrapper = createWrapper(qc)
  return { ...render(ui, { wrapper: Wrapper }), queryClient: qc }
}

/**
 * Extracts the **last** handler registered for a given event name via `socket.on()`.
 * Throws if no handler was registered so callers never need a non-null assertion.
 */
function getRegisteredHandler(eventName: string): SocketEventHandler {
  // Iterate in reverse so that the useTaskEvents handler (registered after SocketProvider) wins.
  const calls = [...mockSocket.on.mock.calls].reverse()
  const call = calls.find((c: [string, SocketEventHandler]) => c[0] === eventName)
  if (!call) {
    throw new Error(`No handler registered for event "${eventName}"`)
  }
  return call[1] as SocketEventHandler
}

// ---------------------------------------------------------------------------
// SocketProvider + useSocket
// ---------------------------------------------------------------------------
describe('SocketProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSocket.on.mockReset()
    mockSocket.off.mockReset()
    mockSocket.disconnect.mockReset()
    mockSocket.connected = false
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: '1', email: 'test@example.com', name: 'Test' },
      error: null,
      login: vi.fn(),
      logout: vi.fn(),
    })
  })

  it('creates a socket connection when user is authenticated', () => {
    renderWithSocket(<TestConsumer />)

    expect(io).toHaveBeenCalledTimes(1)
    expect(io).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        path: '/ws/socket.io/',
        withCredentials: true,
      })
    )
  })

  it('does not create a socket connection when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      error: null,
      login: vi.fn(),
      logout: vi.fn(),
    })

    renderWithSocket(<TestConsumer />)

    expect(io).not.toHaveBeenCalled()
    expect(screen.getByTestId('socket-status')).toHaveTextContent('disconnected')
  })

  it('disconnects existing socket when user logs out', () => {
    const { rerender } = render(<TestConsumer />, {
      wrapper: createWrapper(),
    })

    // First render: authenticated — socket created
    expect(io).toHaveBeenCalledTimes(1)

    // Simulate logout
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      error: null,
      login: vi.fn(),
      logout: vi.fn(),
    })

    rerender(<TestConsumer />)

    // The cleanup from the previous effect should disconnect
    expect(mockSocket.disconnect).toHaveBeenCalled()
  })

  it('disconnects the socket on unmount', () => {
    const { unmount } = renderWithSocket(<TestConsumer />)

    unmount()

    expect(mockSocket.disconnect).toHaveBeenCalled()
  })

  it('registers connect, connect_error, and disconnect listeners', () => {
    renderWithSocket(<TestConsumer />)

    const registeredEvents = mockSocket.on.mock.calls.map((c: [string, SocketEventHandler]) => c[0])
    expect(registeredEvents).toContain('connect')
    expect(registeredEvents).toContain('connect_error')
    expect(registeredEvents).toContain('disconnect')
  })
})

// ---------------------------------------------------------------------------
// useSocket (standalone)
// ---------------------------------------------------------------------------
describe('useSocket', () => {
  it('returns null when used outside SocketProvider', () => {
    const queryClient = createTestQueryClient()
    const { result } = renderHook(() => useSocket(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    })

    expect(result.current).toBeNull()
  })

  it('returns the socket when inside SocketProvider', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: '1', email: 'test@example.com', name: 'Test' },
      error: null,
      login: vi.fn(),
      logout: vi.fn(),
    })

    const { result } = renderHook(() => useSocket(), { wrapper: createWrapper() })

    // The provider sets the socket created by io()
    expect(result.current).toBe(mockSocket)
  })
})

// ---------------------------------------------------------------------------
// useTaskEvents
// ---------------------------------------------------------------------------
describe('useTaskEvents', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSocket.on.mockReset()
    mockSocket.off.mockReset()
    mockSocket.disconnect.mockReset()
    mockSocket.connected = true
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: '1', email: 'test@example.com', name: 'Test' },
      error: null,
      login: vi.fn(),
      logout: vi.fn(),
    })
  })

  it('subscribes to all task events on mount', () => {
    renderHook(() => useTaskEvents(), { wrapper: createWrapper() })

    const registeredEvents = mockSocket.on.mock.calls.map((c: [string, SocketEventHandler]) => c[0])
    expect(registeredEvents).toContain('task_status_changed')
    expect(registeredEvents).toContain('task_progress')
    expect(registeredEvents).toContain('task_completed')
    expect(registeredEvents).toContain('task_failed')
  })

  it('subscribes to connect and disconnect events', () => {
    renderHook(() => useTaskEvents(), { wrapper: createWrapper() })

    const registeredEvents = mockSocket.on.mock.calls.map((c: [string, SocketEventHandler]) => c[0])
    // useTaskEvents registers its own connect/disconnect listeners
    // plus SocketProvider registers connect/connect_error/disconnect
    expect(registeredEvents.filter((e: string) => e === 'connect').length).toBeGreaterThanOrEqual(2)
    expect(
      registeredEvents.filter((e: string) => e === 'disconnect').length
    ).toBeGreaterThanOrEqual(2)
  })

  it('unsubscribes from all events on unmount', () => {
    const { unmount } = renderHook(() => useTaskEvents(), { wrapper: createWrapper() })

    unmount()

    const unregisteredEvents = mockSocket.off.mock.calls.map(
      (c: [string, SocketEventHandler]) => c[0]
    )
    expect(unregisteredEvents).toContain('connect')
    expect(unregisteredEvents).toContain('disconnect')
    expect(unregisteredEvents).toContain('task_status_changed')
    expect(unregisteredEvents).toContain('task_progress')
    expect(unregisteredEvents).toContain('task_completed')
    expect(unregisteredEvents).toContain('task_failed')
  })

  it('reports isConnected based on socket.connected', () => {
    mockSocket.connected = true

    const { result } = renderHook(() => useTaskEvents(), { wrapper: createWrapper() })

    expect(result.current.isConnected).toBe(true)
  })

  it('reports isConnected false when socket is disconnected', () => {
    mockSocket.connected = false

    const { result } = renderHook(() => useTaskEvents(), { wrapper: createWrapper() })

    expect(result.current.isConnected).toBe(false)
  })

  it('returns null lastEvent initially', () => {
    const { result } = renderHook(() => useTaskEvents(), { wrapper: createWrapper() })

    expect(result.current.lastEvent).toBeNull()
  })

  it('reports isConnected false when no socket exists', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      error: null,
      login: vi.fn(),
      logout: vi.fn(),
    })

    const { result } = renderHook(() => useTaskEvents(), { wrapper: createWrapper() })

    expect(result.current.isConnected).toBe(false)
    expect(result.current.lastEvent).toBeNull()
  })

  it('calls onCompleted callback when task_completed fires', () => {
    const onCompleted = vi.fn()
    renderHook(() => useTaskEvents({ onCompleted }), { wrapper: createWrapper() })

    const handler = getRegisteredHandler('task_completed')
    act(() => {
      handler({ task_id: '123', task_name: 'test-task', result_url: null, tenant_id: 'org1' })
    })

    expect(onCompleted).toHaveBeenCalledWith(
      expect.objectContaining({ task_id: '123', task_name: 'test-task' })
    )
  })

  it('calls onFailed callback when task_failed fires', () => {
    const onFailed = vi.fn()
    renderHook(() => useTaskEvents({ onFailed }), { wrapper: createWrapper() })

    const handler = getRegisteredHandler('task_failed')
    act(() => {
      handler({
        task_id: 'fail-1',
        task_name: 'failing-task',
        error_detail: 'something broke',
        tenant_id: 'org1',
      })
    })

    expect(onFailed).toHaveBeenCalledWith(
      expect.objectContaining({ task_id: 'fail-1', error_detail: 'something broke' })
    )
  })

  it('calls onStatusChange callback when task_status_changed fires', () => {
    const onStatusChange = vi.fn()
    renderHook(() => useTaskEvents({ onStatusChange }), { wrapper: createWrapper() })

    const handler = getRegisteredHandler('task_status_changed')
    act(() => {
      handler({
        task_id: 'status-1',
        task_name: 'status-task',
        status: 'running',
        total_steps: 5,
        completed_steps: 2,
        status_message: 'Processing...',
        error_detail: null,
        tenant_id: 'org1',
      })
    })

    expect(onStatusChange).toHaveBeenCalledWith(
      expect.objectContaining({ task_id: 'status-1', status: 'running' })
    )
  })

  it('calls onProgress callback when task_progress fires', () => {
    const onProgress = vi.fn()
    renderHook(() => useTaskEvents({ onProgress }), { wrapper: createWrapper() })

    const handler = getRegisteredHandler('task_progress')
    act(() => {
      handler({
        task_id: 'prog-1',
        completed_steps: 3,
        total_steps: 10,
        status_message: 'Step 3 of 10',
      })
    })

    expect(onProgress).toHaveBeenCalledWith(
      expect.objectContaining({ task_id: 'prog-1', completed_steps: 3 })
    )
  })

  it('updates lastEvent when an event fires', () => {
    const { result } = renderHook(() => useTaskEvents(), { wrapper: createWrapper() })

    const handler = getRegisteredHandler('task_completed')

    act(() => {
      handler({ task_id: 'evt-1', task_name: 'test', result_url: null, tenant_id: 'org1' })
    })

    expect(result.current.lastEvent).toEqual(expect.objectContaining({ task_id: 'evt-1' }))
  })

  it('filters events by taskId when specified', () => {
    const onCompleted = vi.fn()
    renderHook(() => useTaskEvents({ taskId: '123', onCompleted }), { wrapper: createWrapper() })

    const handler = getRegisteredHandler('task_completed')

    // Event with non-matching task_id should be filtered
    act(() => {
      handler({ task_id: '456', task_name: 'other', result_url: null, tenant_id: 'org1' })
    })

    expect(onCompleted).not.toHaveBeenCalled()
  })

  it('passes through events matching the specified taskId', () => {
    const onCompleted = vi.fn()
    renderHook(() => useTaskEvents({ taskId: '123', onCompleted }), { wrapper: createWrapper() })

    const handler = getRegisteredHandler('task_completed')

    act(() => {
      handler({ task_id: '123', task_name: 'match', result_url: null, tenant_id: 'org1' })
    })

    expect(onCompleted).toHaveBeenCalledWith(expect.objectContaining({ task_id: '123' }))
  })

  it('filters task_status_changed events by taskId', () => {
    const onStatusChange = vi.fn()
    renderHook(() => useTaskEvents({ taskId: 'abc', onStatusChange }), {
      wrapper: createWrapper(),
    })

    const handler = getRegisteredHandler('task_status_changed')

    // Non-matching
    act(() => {
      handler({
        task_id: 'xyz',
        task_name: 'other',
        status: 'running',
        total_steps: null,
        completed_steps: 0,
        status_message: null,
        error_detail: null,
        tenant_id: 'org1',
      })
    })

    expect(onStatusChange).not.toHaveBeenCalled()

    // Matching
    act(() => {
      handler({
        task_id: 'abc',
        task_name: 'target',
        status: 'running',
        total_steps: null,
        completed_steps: 0,
        status_message: null,
        error_detail: null,
        tenant_id: 'org1',
      })
    })

    expect(onStatusChange).toHaveBeenCalledTimes(1)
  })

  it('invalidates task queries on task_status_changed', () => {
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    renderHook(() => useTaskEvents(), { wrapper: createWrapper(queryClient) })

    const handler = getRegisteredHandler('task_status_changed')

    act(() => {
      handler({
        task_id: 'inv-1',
        task_name: 'test',
        status: 'completed',
        total_steps: 1,
        completed_steps: 1,
        status_message: null,
        error_detail: null,
        tenant_id: 'org1',
      })
    })

    expect(invalidateSpy).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ['tasks'] }))
  })

  it('invalidates task queries on task_completed', () => {
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    renderHook(() => useTaskEvents(), { wrapper: createWrapper(queryClient) })

    const handler = getRegisteredHandler('task_completed')

    act(() => {
      handler({ task_id: 'inv-2', task_name: 'test', result_url: null, tenant_id: 'org1' })
    })

    expect(invalidateSpy).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ['tasks'] }))
  })

  it('invalidates task queries on task_failed', () => {
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    renderHook(() => useTaskEvents(), { wrapper: createWrapper(queryClient) })

    const handler = getRegisteredHandler('task_failed')

    act(() => {
      handler({
        task_id: 'inv-3',
        task_name: 'test',
        error_detail: 'oops',
        tenant_id: 'org1',
      })
    })

    expect(invalidateSpy).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ['tasks'] }))
  })

  it('does not invalidate queries on task_progress', () => {
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    renderHook(() => useTaskEvents(), { wrapper: createWrapper(queryClient) })

    const handler = getRegisteredHandler('task_progress')

    act(() => {
      handler({
        task_id: 'no-inv',
        completed_steps: 1,
        total_steps: 5,
        status_message: null,
      })
    })

    expect(invalidateSpy).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// Test consumer component
// ---------------------------------------------------------------------------
function TestConsumer() {
  const socket = useSocket()
  return <div data-testid="socket-status">{socket ? 'connected' : 'disconnected'}</div>
}
