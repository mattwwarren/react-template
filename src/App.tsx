import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { ErrorBoundary, LoadingSpinner } from '@/components/shared';
import { Layout } from '@/components/layout';

const DashboardPage = lazy(() => import('@/features/dashboard').then(m => ({ default: m.DashboardPage })));
const UsersPage = lazy(() => import('@/features/users').then(m => ({ default: m.UsersPage })));
const UserDetailPage = lazy(() => import('@/features/users').then(m => ({ default: m.UserDetailPage })));
const OrganizationsPage = lazy(() => import('@/features/organizations').then(m => ({ default: m.OrganizationsPage })));
const OrganizationDetailPage = lazy(() => import('@/features/organizations').then(m => ({ default: m.OrganizationDetailPage })));
const DocumentsPage = lazy(() => import('@/features/documents').then(m => ({ default: m.DocumentsPage })));
const NotFoundPage = lazy(() => import('@/features/not-found').then(m => ({ default: m.NotFoundPage })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

function App(): React.ReactElement {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Layout>
            <Suspense fallback={<div className="flex h-screen items-center justify-center"><LoadingSpinner /></div>}>
              <Routes>
                <Route
                  path="/"
                  element={
                    <ErrorBoundary>
                      <DashboardPage />
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/users"
                  element={
                    <ErrorBoundary>
                      <UsersPage />
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/users/:id"
                  element={
                    <ErrorBoundary>
                      <UserDetailPage />
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/organizations"
                  element={
                    <ErrorBoundary>
                      <OrganizationsPage />
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/organizations/:id"
                  element={
                    <ErrorBoundary>
                      <OrganizationDetailPage />
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/documents"
                  element={
                    <ErrorBoundary>
                      <DocumentsPage />
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="*"
                  element={
                    <ErrorBoundary>
                      <NotFoundPage />
                    </ErrorBoundary>
                  }
                />
              </Routes>
            </Suspense>
          </Layout>
        </BrowserRouter>
        <Toaster />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
