'use server'

import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export async function UpcomingBills() {
  const supabase = await createClient()
  
  // Obter data atual e data limite (próximos 7 dias)
  const today = new Date()
  const nextWeek = addDays(today, 7)
  const formattedToday = format(today, 'yyyy-MM-dd')
  const formattedNextWeek = format(nextWeek, 'yyyy-MM-dd')
  
  // Buscar contas a pagar/receber para os próximos 7 dias
  const { data: contas } = await supabase
    .from('contas_pagar_receber')
    .select('*, categorias(nome, cor)')
    .gte('data_vencimento', formattedToday)
    .lte('data_vencimento', formattedNextWeek)
    .eq('status', 'pendente')
    .order('data_vencimento')
    .limit(5)
  
  // Formatar valores para exibição
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return format(date, 'dd/MM/yyyy', { locale: ptBR })
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Próximos Vencimentos</CardTitle>
      </CardHeader>
      <CardContent>
        {contas && contas.length > 0 ? (
          <div className="space-y-4">
            {contas.map((conta) => (
              <div key={conta.id} className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: conta.categorias?.cor || '#888888' }}
                  />
                  <div>
                    <p className="font-medium">{conta.fornecedor_cliente}</p>
                    <p className="text-sm text-muted-foreground">
                      {conta.categorias?.nome || 'Sem categoria'} • {formatDate(conta.data_vencimento)}
                    </p>
                  </div>
                </div>
                <div className={`font-medium ${conta.tipo === 'pagar' ? 'text-red-600' : 'text-green-600'}`}>
                  {conta.tipo === 'pagar' ? '-' : '+'}{formatCurrency(conta.valor_total)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center py-4 text-muted-foreground">
            Não há contas a vencer nos próximos 7 dias.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
