import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * Onboarding page for users with zero organizations.
 * Shown when user logs in but has no organizations yet.
 */
export function WelcomePage(): React.ReactElement {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome!</CardTitle>
          <CardDescription>
            Let's get you started by creating your first organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Organizations help you manage teams, projects, and resources. You'll need to create one
            to get started.
          </p>
          <Button className="w-full" onClick={() => navigate('/organizations/create')}>
            Create Your First Organization
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
