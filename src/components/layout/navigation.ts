import { Home, Users, Building2, FileText } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  name: string;
  to: string;
  icon: LucideIcon;
}

export const navigation: NavItem[] = [
  { name: 'Dashboard', to: '/', icon: Home },
  { name: 'Users', to: '/users', icon: Users },
  { name: 'Organizations', to: '/organizations', icon: Building2 },
  { name: 'Documents', to: '/documents', icon: FileText },
];
