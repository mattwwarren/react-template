import { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { MoreHorizontal, Eye, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DataTable, DeleteConfirmDialog } from '@/components/shared';
import { useDeleteOrganization, useToast, organizationKeys } from '@/hooks';
import { organizationsApi } from '@/api';
import { OrganizationDialog } from './OrganizationDialog';
import type { Organization } from '@/api/types';

interface OrganizationsTableProps {
  data: Organization[] | undefined;
  isLoading: boolean;
}

export function OrganizationsTable({
  data,
  isLoading,
}: OrganizationsTableProps): React.ReactElement {
  const queryClient = useQueryClient();

  const handlePrefetch = useCallback((id: string): void => {
    void queryClient.prefetchQuery({
      queryKey: organizationKeys.detail(id),
      queryFn: () => organizationsApi.get(id),
    });
  }, [queryClient]);

  const columns = useMemo(() => [
    {
      header: 'Name',
      accessor: (org: Organization) => (
        <Link
          to={`/organizations/${org.id}`}
          className="font-medium hover:underline"
          onMouseEnter={() => handlePrefetch(org.id)}
        >
          {org.name}
        </Link>
      ),
    },
    {
      header: 'Members',
      accessor: (org: Organization) => (
        <Badge variant="secondary">{org.users?.length ?? 0} members</Badge>
      ),
    },
    {
      header: 'Created',
      accessor: (org: Organization) =>
        new Date(org.created_at).toLocaleDateString(),
    },
    {
      header: '',
      accessor: (org: Organization) => <OrganizationActions organization={org} />,
      className: 'w-[50px]',
    },
  ], [handlePrefetch]);

  return (
    <DataTable
      columns={columns}
      data={data}
      isLoading={isLoading}
      keyExtractor={(o) => o.id}
      emptyMessage="No organizations found"
    />
  );
}

function OrganizationActions({
  organization,
}: {
  organization: Organization;
}): React.ReactElement {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const deleteMutation = useDeleteOrganization();
  const toast = useToast();

  const handleDelete = (): void => {
    deleteMutation.mutate(organization.id, {
      onSuccess: () => {
        toast.success('Organization deleted successfully');
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
            <Link to={`/organizations/${organization.id}`}>
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

      <OrganizationDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        organization={organization}
      />

      <DeleteConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Delete Organization"
        description={`Are you sure you want to delete ${organization.name}? This will remove all members and cannot be undone.`}
        onConfirm={handleDelete}
        isPending={deleteMutation.isPending}
      />
    </>
  );
}
