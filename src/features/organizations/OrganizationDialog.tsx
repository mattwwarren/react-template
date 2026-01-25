import type { Organization } from '@/api/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { OrganizationForm } from './OrganizationForm'

interface OrganizationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organization?: Organization
}

export function OrganizationDialog({
  open,
  onOpenChange,
  organization,
}: OrganizationDialogProps): React.ReactElement {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{organization ? 'Edit Organization' : 'Create Organization'}</DialogTitle>
          <DialogDescription>
            {organization
              ? 'Update organization information below.'
              : 'Add a new organization to the system.'}
          </DialogDescription>
        </DialogHeader>
        <OrganizationForm organization={organization} onSuccess={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}
