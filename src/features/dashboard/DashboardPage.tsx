import { Users, Building2, FileText, Activity } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useUsers, useOrganizations } from '@/hooks';
import { StatsCard } from './StatsCard';

export function DashboardPage(): React.ReactElement {
  const { data: usersData, isLoading: usersLoading } = useUsers({ page: 1, size: 1 });
  const { data: orgsData, isLoading: orgsLoading } = useOrganizations({ page: 1, size: 1 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your application
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Users"
          value={usersData?.total}
          icon={Users}
          description="Active users in the system"
          isLoading={usersLoading}
        />
        <StatsCard
          title="Organizations"
          value={orgsData?.total}
          icon={Building2}
          description="Active organizations"
          isLoading={orgsLoading}
        />
        <StatsCard
          title="Documents"
          value={0}
          icon={FileText}
          description="Uploaded documents"
        />
        <StatsCard
          title="Activity"
          value={0}
          icon={Activity}
          description="Recent actions"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates across the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Activity feed coming soon...
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Quick actions coming soon...
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
