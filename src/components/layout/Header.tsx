import { Menu } from 'lucide-react'
import { OrganizationSwitcher, UserMenu } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { MobileSidebar } from './MobileSidebar'

export function Header(): React.ReactElement {
  return (
    <header className="flex h-16 items-center border-b bg-background px-4 md:px-6">
      {/* Mobile menu button */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <MobileSidebar />
        </SheetContent>
      </Sheet>

      {/* Mobile title */}
      <span className="ml-2 text-xl font-bold md:hidden">__PROJECT_NAME__</span>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Organization switcher and user menu */}
      <div className="flex items-center gap-4">
        <OrganizationSwitcher />
        <UserMenu />
      </div>
    </header>
  )
}
