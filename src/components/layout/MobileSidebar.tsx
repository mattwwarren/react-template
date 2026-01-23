import { NavLink } from 'react-router-dom';
import { Home, Users, Building2, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SheetHeader, SheetTitle } from '@/components/ui/sheet';

const navigation = [
  { name: 'Dashboard', to: '/', icon: Home },
  { name: 'Users', to: '/users', icon: Users },
  { name: 'Organizations', to: '/organizations', icon: Building2 },
  { name: 'Documents', to: '/documents', icon: FileText },
];

export function MobileSidebar(): React.ReactElement {
  return (
    <div className="flex h-full flex-col">
      <SheetHeader className="border-b px-6 py-4">
        <SheetTitle className="text-left text-xl font-bold">
          React Template
        </SheetTitle>
      </SheetHeader>
      <nav className="space-y-1 p-4">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )
            }
          >
            <item.icon className="h-5 w-5" />
            {item.name}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
