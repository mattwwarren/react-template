import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { UserInfo } from '@/api/types';

interface MembersListProps {
  members: UserInfo[] | undefined;
}

export function MembersList({ members }: MembersListProps): React.ReactElement {
  if (!members || members.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No members in this organization
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Joined</TableHead>
          <TableHead className="w-[100px]">Role</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((member) => (
          <TableRow key={member.id}>
            <TableCell>
              <Link
                to={`/users/${member.id}`}
                className="font-medium hover:underline"
              >
                {member.name}
              </Link>
            </TableCell>
            <TableCell>{member.email}</TableCell>
            <TableCell>
              {new Date(member.created_at).toLocaleDateString()}
            </TableCell>
            <TableCell>
              <Badge variant="secondary">Member</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
