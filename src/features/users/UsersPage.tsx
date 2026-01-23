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
import { useUsers } from '@/hooks';
import { UsersTable } from './UsersTable';
import { UserDialog } from './UserDialog';

export function UsersPage(): React.ReactElement {
  const [searchParams] = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;
  const size = Number(searchParams.get('size')) || 10;

  const { data, isLoading } = useUsers({ page, size });
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">Manage user accounts</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>A list of all users in the system</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <UsersTable data={data?.items} isLoading={isLoading} />
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

      <UserDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </div>
  );
}
