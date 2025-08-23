import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardStats } from '@/components/dashboard/stats'
import { RevenueChart } from '@/components/charts/revenue-chart'
import { ExpenseChart } from '@/components/charts/expense-chart'
import { UpcomingBills } from '@/components/dashboard/upcoming-bills'
import { SidebarNav } from '@/components/dashboard/sidebar-nav'
import { Toaster } from '@/components/ui/sonner'

export default async function Home() {
  const supabase = await createClient()
  
  // Verificar se o usuário está autenticado
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    // Se não estiver autenticado, redirecionar para a página de login
    return redirect('/login')
  }
  
  // Se estiver autenticado, mostrar o dashboard com a sidebar
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
          <div className="space-y-6">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            
            <DashboardStats />
            
            <div className="grid md:grid-cols-2 gap-6">
              <RevenueChart />
              <ExpenseChart />
            </div>
            
            <UpcomingBills />
          </div>
        </main>
      </div>
      <Toaster />
    </div>
  )
}
