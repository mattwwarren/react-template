import type { User } from '@/api/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { UserForm } from './UserForm'

interface UserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: User
}

export function UserDialog({ open, onOpenChange, user }: UserDialogProps): React.ReactElement {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{user ? 'Edit User' : 'Create User'}</DialogTitle>
          <DialogDescription>
            {user ? 'Update user information below.' : 'Add a new user to the system.'}
          </DialogDescription>
        </DialogHeader>
        <UserForm user={user} onSuccess={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}
