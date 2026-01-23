import type { ReactElement, ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, type MemoryRouterProps } from 'react-router-dom'
import { render, type RenderOptions, renderHook, type RenderHookOptions } from '@testing-library/react'

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
}

/**
 * Creates a wrapper component with QueryClient and Router providers.
 * Each call creates a new QueryClient for test isolation.
 */
export function createWrapper(options: WrapperOptions = {}) {
  const queryClient = options.queryClient ?? createTestQueryClient()

  return function Wrapper({ children }: { children: ReactNode }): ReactElement {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter {...(options.routerProps ?? {})}>
          {children}
        </MemoryRouter>
      </QueryClientProvider>
    )
  }
}

interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient
  routerProps?: MemoryRouterProps
}

/**
 * Renders a component with QueryClient and Router providers.
 * Returns render result plus the queryClient for assertions.
 */
export function renderWithProviders(
  ui: ReactElement,
  options: RenderWithProvidersOptions = {}
) {
  const { queryClient = createTestQueryClient(), routerProps, ...renderOptions } = options

  const Wrapper = createWrapper({ queryClient, routerProps })

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  }
}

interface RenderHookWithProvidersOptions<TProps> extends Omit<RenderHookOptions<TProps>, 'wrapper'> {
  queryClient?: QueryClient
  routerProps?: MemoryRouterProps
}

/**
 * Renders a hook with QueryClient and Router providers.
 * Returns renderHook result plus the queryClient for assertions.
 */
export function renderHookWithProviders<TResult, TProps>(
  hook: (props: TProps) => TResult,
  options: RenderHookWithProvidersOptions<TProps> = {}
) {
  const { queryClient = createTestQueryClient(), routerProps, ...hookOptions } = options

  const Wrapper = createWrapper({ queryClient, routerProps })

  return {
    ...renderHook(hook, { wrapper: Wrapper, ...hookOptions }),
    queryClient,
  }
}
