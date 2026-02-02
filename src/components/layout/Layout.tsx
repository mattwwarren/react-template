import type { ReactNode } from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

interface LayoutProps {
  children?: ReactNode
}

export function Layout({ children }: LayoutProps): React.ReactElement {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-muted/30 p-4 md:p-6">
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  )
}
