import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  type RenderHookOptions,
  type RenderOptions,
  render,
  renderHook,
} from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { MemoryRouter, type MemoryRouterProps } from 'react-router-dom'
import { AuthProvider } from '@/auth'

/**
 * Creates a new QueryClient configured for tests:
 * - No retries (fail fast)
 * - No garbage collection time (clean up immediately)
 * - Errors thrown for easier test assertions
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

interface WrapperOptions {
  queryClient?: QueryClient
  routerProps?: MemoryRouterProps
  withAuth?: boolean
}

/**
 * Creates a wrapper component with QueryClient, Router, and optionally Auth providers.
 * Each call creates a new QueryClient for test isolation.
 */
export function createWrapper(options: WrapperOptions = {}) {
  const { queryClient = createTestQueryClient(), routerProps, withAuth = true } = options

  return function Wrapper({ children }: { children: ReactNode }): ReactElement {
    const content = (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter {...(routerProps ?? {})}>{children}</MemoryRouter>
      </QueryClientProvider>
    )

    // Wrap in AuthProvider for tests that need auth
    return withAuth ? <AuthProvider>{content}</AuthProvider> : content
  }
}

interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient
  routerProps?: MemoryRouterProps
  withAuth?: boolean
}

/**
 * Renders a component with QueryClient, Router, and Auth providers.
 * Returns render result plus the queryClient for assertions.
 */
export function renderWithProviders(ui: ReactElement, options: RenderWithProvidersOptions = {}) {
  const {
    queryClient = createTestQueryClient(),
    routerProps,
    withAuth = true,
    ...renderOptions
  } = options

  const Wrapper = createWrapper({ queryClient, routerProps, withAuth })

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  }
}

interface RenderHookWithProvidersOptions<TProps>
  extends Omit<RenderHookOptions<TProps>, 'wrapper'> {
  queryClient?: QueryClient
  routerProps?: MemoryRouterProps
  withAuth?: boolean
}

/**
 * Renders a hook with QueryClient, Router, and Auth providers.
 * Returns renderHook result plus the queryClient for assertions.
 */
export function renderHookWithProviders<TResult, TProps>(
  hook: (props: TProps) => TResult,
  options: RenderHookWithProvidersOptions<TProps> = {}
) {
  const {
    queryClient = createTestQueryClient(),
    routerProps,
    withAuth = true,
    ...hookOptions
  } = options

  const Wrapper = createWrapper({ queryClient, routerProps, withAuth })

  return {
    ...renderHook(hook, { wrapper: Wrapper, ...hookOptions }),
    queryClient,
  }
}
