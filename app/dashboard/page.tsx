import { DashboardStats } from '@/components/dashboard/stats'
import { RevenueChart } from '@/components/charts/revenue-chart'
import { ExpenseChart } from '@/components/charts/expense-chart'
import { UpcomingBills } from '@/components/dashboard/upcoming-bills'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      
      <DashboardStats />
      
      <div className="grid md:grid-cols-2 gap-6">
        <RevenueChart />
        <ExpenseChart />
      </div>
      
      <UpcomingBills />
    </div>
  )
}
