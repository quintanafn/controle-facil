'use server'

import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowUpIcon, ArrowDownIcon, TrendingUpIcon, WalletIcon } from 'lucide-react'
import { startOfMonth, endOfMonth, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export async function DashboardStats() {
  const supabase = await createClient()
  
  // Obter o mês atual
  const now = new Date()
  const firstDay = startOfMonth(now)
  const lastDay = endOfMonth(now)
  const formattedFirstDay = format(firstDay, 'yyyy-MM-dd')
  const formattedLastDay = format(lastDay, 'yyyy-MM-dd')
  
  // Buscar lançamentos do mês atual
  const { data: lancamentos } = await supabase
    .from('lancamentos')
    .select('*')
    .gte('data', formattedFirstDay)
    .lte('data', formattedLastDay)
  
  // Calcular totais
  const receitas = lancamentos
    ?.filter(l => l.tipo === 'entrada')
    .reduce((sum, l) => sum + Number(l.valor), 0) || 0
  
  const despesas = lancamentos
    ?.filter(l => l.tipo === 'saida')
    .reduce((sum, l) => sum + Number(l.valor), 0) || 0
  
  const saldo = receitas - despesas
  
  // Buscar contas a pagar/receber pendentes
  const { data: contasPendentes } = await supabase
    .from('contas_pagar_receber')
    .select('*')
    .eq('status', 'pendente')
  
  const totalPendente = contasPendentes?.length || 0
  
  // Formatar valores para exibição
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }
  
  const mesAtual = format(now, 'MMMM', { locale: ptBR })

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Receitas ({mesAtual})</CardTitle>
          <ArrowUpIcon className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{formatCurrency(receitas)}</div>
          <p className="text-xs text-muted-foreground">
            Total de entradas no mês atual
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Despesas ({mesAtual})</CardTitle>
          <ArrowDownIcon className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{formatCurrency(despesas)}</div>
          <p className="text-xs text-muted-foreground">
            Total de saídas no mês atual
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Saldo ({mesAtual})</CardTitle>
          <TrendingUpIcon className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${saldo >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            {formatCurrency(saldo)}
          </div>
          <p className="text-xs text-muted-foreground">
            Receitas - Despesas
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Contas Pendentes</CardTitle>
          <WalletIcon className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">{totalPendente}</div>
          <p className="text-xs text-muted-foreground">
            Contas a pagar/receber pendentes
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
