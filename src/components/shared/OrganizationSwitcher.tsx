import { useQuery } from '@tanstack/react-query'
import { Building2, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { organizationsApi } from '@/api/organizations'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getSelectedOrganization, setSelectedOrganization } from '@/lib/organization'

/**
 * Organization switcher dropdown for header.
 * Shows current organization and allows switching.
 */
export function OrganizationSwitcher(): React.ReactElement | null {
  const [isSwitching, setIsSwitching] = useState(false)

  const { data: orgs } = useQuery({
    queryKey: ['organizations', 'user-orgs'],
    queryFn: () => organizationsApi.list({ page: 1, size: 100 }),
  })

  const selectedOrgId = getSelectedOrganization()
  const selectedOrg = orgs?.items.find((org) => org.id === selectedOrgId)

  function handleSwitch(newOrgId: string): void {
    setIsSwitching(true)
    setSelectedOrganization(newOrgId)
    // Full page reload to reset all tenant-scoped state
    window.location.reload()
  }

  // Don't show if no orgs available
  if (!orgs?.items || orgs.items.length === 0) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2" disabled={isSwitching}>
          {isSwitching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Building2 className="h-4 w-4" />
          )}
          <span>{isSwitching ? 'Switching...' : (selectedOrg?.name ?? 'Select Organization')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Switch Organization</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {orgs.items.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => handleSwitch(org.id)}
            className={org.id === selectedOrgId ? 'bg-accent' : ''}
            disabled={isSwitching}
          >
            {org.name}
            {org.id === selectedOrgId && (
              <span className="ml-auto text-xs text-muted-foreground">Current</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
