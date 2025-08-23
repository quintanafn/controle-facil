'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { startOfMonth, endOfMonth, eachDayOfInterval, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

export function ExpenseChart() {
  const [chartData, setChartData] = useState<{
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor: string;
      borderColor: string;
      borderWidth: number;
    }[];
  }>({
    labels: [],
    datasets: []
  })
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      const supabase = createClient()
      
      // Obter o mês atual
      const now = new Date()
      const firstDay = startOfMonth(now)
      const lastDay = endOfMonth(now)
      const formattedFirstDay = format(firstDay, 'yyyy-MM-dd')
      const formattedLastDay = format(lastDay, 'yyyy-MM-dd')
      
      // Buscar lançamentos do mês atual
      const { data: lancamentos, error } = await supabase
        .from('lancamentos')
        .select('*')
        .eq('tipo', 'saida')
        .gte('data', formattedFirstDay)
        .lte('data', formattedLastDay)
        .order('data')
      
      if (error) {
        console.error('Erro ao buscar dados:', error)
        setIsLoading(false)
        return
      }
      
      // Criar array com todos os dias do mês
      const allDays = eachDayOfInterval({
        start: firstDay,
        end: lastDay
      })
      
      // Agrupar lançamentos por dia
      const dailyTotals = allDays.map(day => {
        const dayFormatted = format(day, 'yyyy-MM-dd')
        const dayLancamentos = lancamentos?.filter(l => l.data === dayFormatted) || []
        const total = dayLancamentos.reduce((sum, l) => sum + Number(l.valor), 0)
        
        return {
          day: format(day, 'dd/MM', { locale: ptBR }),
          total
        }
      })
      
      // Preparar dados para o gráfico
      setChartData({
        labels: dailyTotals.map(d => d.day),
        datasets: [
          {
            label: 'Despesas',
            data: dailyTotals.map(d => d.total),
            backgroundColor: 'rgba(239, 68, 68, 0.6)',
            borderColor: 'rgb(239, 68, 68)',
            borderWidth: 1
          }
        ]
      })
      
      setIsLoading(false)
    }
    
    fetchData()
  }, [])
  
  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Despesas do Mês'
      }
    }
  }

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Despesas</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <p>Carregando dados...</p>
          </div>
        ) : (
          <div className="h-64">
            <Bar options={options} data={chartData} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
