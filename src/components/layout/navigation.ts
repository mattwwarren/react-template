import type { LucideIcon } from 'lucide-react'
import { Building2, FileText, Home, Users } from 'lucide-react'

export interface NavItem {
  name: string
  to: string
  icon: LucideIcon
}

export const navigation: NavItem[] = [
  { name: 'Dashboard', to: '/', icon: Home },
  { name: 'Users', to: '/users', icon: Users },
  { name: 'Organizations', to: '/organizations', icon: Building2 },
  { name: 'Documents', to: '/documents', icon: FileText },
]
