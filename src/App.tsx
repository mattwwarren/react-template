import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense, useMemo } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { ErrorBoundary, RouteErrorBoundary, LoadingSpinner } from '@/components/shared';
import { Layout } from '@/components/layout';
import { AuthProvider } from '@/auth';
import { ProtectedRoute } from '@/features/auth';

// Direct file imports for proper tree shaking (avoid barrel imports with lazy())
const DashboardPage = lazy(() => import('@/features/dashboard/DashboardPage'));
const UsersPage = lazy(() => import('@/features/users/UsersPage'));
const UserDetailPage = lazy(() => import('@/features/users/UserDetailPage'));
const OrganizationsPage = lazy(() => import('@/features/organizations/OrganizationsPage'));
const OrganizationDetailPage = lazy(() => import('@/features/organizations/OrganizationDetailPage'));
const DocumentsPage = lazy(() => import('@/features/documents/DocumentsPage'));
const NotFoundPage = lazy(() => import('@/features/not-found/NotFoundPage'));
const LoginPage = lazy(() => import('@/features/auth/LoginPage'));
const AuthCallback = lazy(() => import('@/features/auth/AuthCallback'));

function App(): React.ReactElement {
  // QueryClient created inside component with useMemo for React StrictMode safety.
  // StrictMode double-invokes component functions during development, so using useMemo
  // ensures we create a single stable QueryClient instance rather than creating two.
  const queryClient = useMemo(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 10, // 10 minutes - garbage collection time
        refetchOnWindowFocus: false,
        retry: 3, // Retry failed requests up to 3 times
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
      },
    },
  }), []);
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <Suspense fallback={<div className="flex h-screen items-center justify-center"><LoadingSpinner /></div>}>
              <Routes>
                {/* Public routes - no layout, no auth required */}
                <Route errorElement={<RouteErrorBoundary />}>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />
                </Route>

                {/* Protected routes - require authentication */}
                <Route element={<ProtectedRoute />} errorElement={<RouteErrorBoundary />}>
                  <Route element={<Layout />}>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/users" element={<UsersPage />} />
                    <Route path="/users/:id" element={<UserDetailPage />} />
                    <Route path="/organizations" element={<OrganizationsPage />} />
                    <Route path="/organizations/:id" element={<OrganizationDetailPage />} />
                    <Route path="/documents" element={<DocumentsPage />} />
                    <Route path="*" element={<NotFoundPage />} />
                  </Route>
                </Route>
              </Routes>
            </Suspense>
          </BrowserRouter>
          <Toaster />
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
