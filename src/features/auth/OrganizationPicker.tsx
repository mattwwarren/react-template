import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { organizationsApi } from '@/api/organizations'
import { LoadingSpinner } from '@/components/shared'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { WelcomePage } from './WelcomePage'

interface OrganizationPickerProps {
  /** Callback when org selected - MUST be memoized with useCallback */
  onSelect: (orgId: string) => void
  /** Optional logout callback */
  onLogout?: () => void
}

// Centralized loading component (review fix #7)
function CenteredLoading({ message }: { message?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <LoadingSpinner />
        {message && <p className="mt-4 text-sm text-muted-foreground">{message}</p>}
      </div>
    </div>
  )
}

// Error display component (review fix #2)
function ErrorDisplay({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="space-y-4 text-center">
        <p className="text-destructive">Failed to load organizations</p>
        <p className="text-sm text-muted-foreground">{error.message}</p>
        <Button onClick={onRetry}>Retry</Button>
      </div>
    </div>
  )
}

/**
 * Modal for organization selection after login.
 * Handles 0, 1, and multiple organization scenarios.
 */
export function OrganizationPicker({
  onSelect,
  onLogout,
}: OrganizationPickerProps): React.ReactElement {
  // Race condition guard (review fix #3)
  const autoSelectedRef = useRef(false)
  const [selectedOrgId, setSelectedOrgId] = useState<string>('')

  const {
    data: orgs,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['organizations', 'user-orgs'],
    queryFn: () => organizationsApi.list({ page: 1, size: 999999 }), // Fetch all (review fix #4)
    staleTime: 5 * 60 * 1000, // 5 minutes (review fix #9)
    retry: 2,
    refetchOnWindowFocus: false,
  })

  // Auto-select if only one organization (review fix #1 - deps simplified)
  useEffect(() => {
    if (orgs?.items && orgs.items.length === 1 && !autoSelectedRef.current) {
      autoSelectedRef.current = true
      onSelect(orgs.items[0].id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgs, onSelect]) // onSelect omitted to prevent infinite loop

  if (isLoading) {
    return <CenteredLoading message="Loading organizations..." />
  }

  // Review fix #2: Error handling
  if (isError) {
    return <ErrorDisplay error={error as Error} onRetry={() => refetch()} />
  }

  // No organizations - show welcome page
  if (!orgs?.items || orgs.items.length === 0) {
    return <WelcomePage />
  }

  // One organization - auto-selected (review fix #6: better UX)
  if (orgs.items.length === 1) {
    return <CenteredLoading message={`Selecting ${orgs.items[0].name}...`} />
  }

  // Multiple organizations - show picker dialog
  return (
    <Dialog
      open={true}
      onOpenChange={(open) => {
        // Review fix #5: Allow dismissing via ESC key
        if (!open && onLogout) {
          onLogout()
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select Organization</DialogTitle>
          <DialogDescription>Choose which organization you want to work with</DialogDescription>
        </DialogHeader>
        <Select
          value={selectedOrgId}
          onValueChange={(value) => {
            setSelectedOrgId(value)
            onSelect(value)
          }}
        >
          <SelectTrigger aria-label="Select organization">
            {/* Review fix #8: Accessibility */}
            <SelectValue placeholder="Select an organization" />
          </SelectTrigger>
          <SelectContent>
            {orgs.items.map((org) => (
              <SelectItem key={org.id} value={org.id} aria-label={`Select ${org.name}`}>
                {org.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {onLogout && (
          <DialogFooter>
            <Button variant="ghost" onClick={onLogout}>
              Logout Instead
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
