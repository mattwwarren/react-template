import { NavLink } from 'react-router-dom'
import { SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { navigation } from './navigation'

export function MobileSidebar(): React.ReactElement {
  return (
    <div className="flex h-full flex-col">
      <SheetHeader className="border-b px-6 py-4">
        <SheetTitle className="text-left text-xl font-bold">__PROJECT_NAME__</SheetTitle>
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
  )
}
