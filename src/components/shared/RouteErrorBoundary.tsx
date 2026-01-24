import { useRouteError, isRouteErrorResponse, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

/**
 * Error boundary for React Router routes.
 * Uses useRouteError hook to catch errors during route rendering.
 * Provides user-friendly error display with recovery option.
 */
export function RouteErrorBoundary(): React.ReactElement {
  const error = useRouteError();
  const navigate = useNavigate();

  let title = 'Something went wrong';
  let description = 'An unexpected error occurred. Please try again.';
  let errorMessage = 'Unknown error';

  if (isRouteErrorResponse(error)) {
    // Handle React Router error responses (404, etc.)
    title = `${error.status} ${error.statusText}`;
    description = error.status === 404
      ? 'The page you are looking for does not exist.'
      : 'An error occurred while loading this page.';
    errorMessage = error.data?.message || error.statusText;
  } else if (error instanceof Error) {
    // Handle JavaScript errors
    errorMessage = error.message;
  }

  const handleReset = (): void => {
    navigate('/');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <CardTitle>{title}</CardTitle>
          </div>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="overflow-auto rounded bg-muted p-4 text-sm">
            {errorMessage}
          </pre>
        </CardContent>
        <CardFooter>
          <Button onClick={handleReset}>Return to Dashboard</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
