import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MoreHorizontal, Eye, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { DataTable } from '@/components/shared';
import { useDeleteUser, useToast } from '@/hooks';
import { UserDialog } from './UserDialog';
import type { User } from '@/api/types';

interface UsersTableProps {
  data: User[] | undefined;
  isLoading: boolean;
}

export function UsersTable({ data, isLoading }: UsersTableProps): React.ReactElement {
  const columns = [
    {
      header: 'Name',
      accessor: (user: User) => (
        <Link
          to={`/users/${user.id}`}
          className="font-medium hover:underline"
        >
          {user.name}
        </Link>
      ),
    },
    {
      header: 'Email',
      accessor: (user: User) => user.email,
    },
    {
      header: 'Organizations',
      accessor: (user: User) => (
        <div className="flex flex-wrap gap-1">
          {user.organizations?.slice(0, 3).map((org) => (
            <Badge key={org.id} variant="secondary">
              {org.name}
            </Badge>
          ))}
          {(user.organizations?.length ?? 0) > 3 && (
            <Badge variant="outline">
              +{(user.organizations?.length ?? 0) - 3}
            </Badge>
          )}
        </div>
      ),
    },
    {
      header: '',
      accessor: (user: User) => <UserActions user={user} />,
      className: 'w-[50px]',
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      isLoading={isLoading}
      keyExtractor={(u) => u.id}
      emptyMessage="No users found"
    />
  );
}

function UserActions({ user }: { user: User }): React.ReactElement {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const deleteMutation = useDeleteUser();
  const toast = useToast();

  const handleDelete = (): void => {
    deleteMutation.mutate(user.id, {
      onSuccess: () => {
        toast.success('User deleted successfully');
        setIsDeleteOpen(false);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link to={`/users/${user.id}`}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setIsEditOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => setIsDeleteOpen(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <UserDialog open={isEditOpen} onOpenChange={setIsEditOpen} user={user} />

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {user.name}? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
