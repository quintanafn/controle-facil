import { SidebarNav } from '@/components/dashboard/sidebar-nav'
import { Toaster } from '@/components/ui/sonner'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden md:flex w-64 flex-col border-r bg-white dark:bg-gray-950 dark:border-gray-800">
        <SidebarNav />
      </aside>
      <div className="flex flex-col flex-1">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-white px-6 dark:bg-gray-950 dark:border-gray-800">
          <div className="flex-1">
            <h1 className="text-lg font-semibold">Controle Fácil</h1>
          </div>
        </header>
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
      <Toaster />
    </div>
  )
}
