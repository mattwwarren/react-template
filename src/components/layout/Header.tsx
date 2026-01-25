import { Menu } from 'lucide-react'
import { UserMenu } from '@/components/shared'
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
      <span className="ml-2 text-xl font-bold md:hidden">React Template</span>

      {/* Spacer */}
      <div className="flex-1" />

      {/* User menu */}
      <UserMenu />
    </header>
  )
}
