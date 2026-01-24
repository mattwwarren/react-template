import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Pagination } from '@/components/shared';
import { useOrganizations } from '@/hooks';
import { getPaginationParams } from '@/lib/utils';
import { OrganizationsTable } from './OrganizationsTable';
import { OrganizationDialog } from './OrganizationDialog';

export function OrganizationsPage(): React.ReactElement {
  const [searchParams] = useSearchParams();
  const { page, size } = getPaginationParams(searchParams);

  const { data, isLoading } = useOrganizations({ page, size });
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
          <p className="text-muted-foreground">
            Manage organizations and their members
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Organization
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Organizations</CardTitle>
          <CardDescription>
            A list of all organizations in the system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <OrganizationsTable data={data?.items} isLoading={isLoading} />
          {data && data.pages > 1 && (
            <Pagination
              total={data.total}
              page={data.page}
              size={data.size}
              pages={data.pages}
            />
          )}
        </CardContent>
      </Card>

      <OrganizationDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </div>
  );
}

export default OrganizationsPage;
