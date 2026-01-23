import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background p-8">
        <div className="mx-auto max-w-2xl space-y-8">
          <h1 className="text-4xl font-bold text-foreground">
            React Template
          </h1>

          <p className="text-muted-foreground">
            Project scaffolding complete. Tailwind CSS and shadcn/ui are working.
          </p>

          <div className="flex gap-4">
            <Button>Default Button</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="destructive">Destructive</Button>
          </div>

          <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
            <h2 className="text-lg font-semibold">Card Component</h2>
            <p className="text-sm text-muted-foreground">
              This card uses Tailwind utilities and CSS variables.
            </p>
          </div>
        </div>
      </div>
    </QueryClientProvider>
  )
}

export default App
