'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PlusCircle, ArrowUpCircle, ArrowDownCircle, Trash2, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { format, parseISO, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Lancamento {
  id: string
  descricao: string
  valor: number
  data: string
  tipo: 'entrada' | 'saida'
  categoria_id: string | null
  conta_id: string | null
  comprovante_url: string | null
  user_id: string
  created_at: string
  categorias?: {
    nome: string
    cor: string
  }
  contas?: {
    nome: string
  }
}

interface Categoria {
  id: string
  nome: string
  cor: string
  tipo: 'receita' | 'despesa'
}

interface Conta {
  id: string
  nome: string
  saldo: number
}

export default function FluxoCaixa() {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [contas, setContas] = useState<Conta[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingLancamento, setEditingLancamento] = useState<Lancamento | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'entrada' | 'saida'>('todos')
  
  // Form state
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [data, setData] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [tipo, setTipo] = useState<'entrada' | 'saida'>('entrada')
  const [categoriaId, setCategoriaId] = useState<string>('')
  const [contaId, setContaId] = useState<string>('')
  const [comprovante, setComprovante] = useState<File | null>(null)
  
  const supabase = createClient()

  // Carregar lançamentos com base no mês selecionado e filtros
  const fetchLancamentos = useCallback(async () => {
    try {
      const firstDay = startOfMonth(currentMonth)
      const lastDay = endOfMonth(currentMonth)
      
      let query = supabase
        .from('lancamentos')
        .select('*, categorias(nome, cor), contas(nome)')
        .gte('data', format(firstDay, 'yyyy-MM-dd'))
        .lte('data', format(lastDay, 'yyyy-MM-dd'))
        .order('data', { ascending: false })
      
      if (filtroTipo !== 'todos') {
        query = query.eq('tipo', filtroTipo)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      setLancamentos(data || [])
    } catch (error) {
      console.error('Erro ao carregar lançamentos:', error)
      toast.error('Erro ao carregar lançamentos')
    }
  }, [supabase, currentMonth, filtroTipo])

  // Carregar dados iniciais
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      
      try {
        // Carregar categorias
        const { data: categoriasData, error: categoriasError } = await supabase
          .from('categorias')
          .select('*')
          .order('nome')
        
        if (categoriasError) throw categoriasError
        setCategorias(categoriasData || [])
        
        // Carregar contas
        const { data: contasData, error: contasError } = await supabase
          .from('contas')
          .select('id, nome, saldo')
          .order('nome')
        
        if (contasError) throw contasError
        setContas(contasData || [])
        
        // Carregar lançamentos do mês atual
        await fetchLancamentos()
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
        toast.error('Erro ao carregar dados')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  
  // Atualizar lançamentos quando mudar o mês ou filtro
  useEffect(() => {
    fetchLancamentos()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonth, filtroTipo])
  
  // Resetar formulário
  const resetForm = () => {
    setDescricao('')
    setValor('')
    setData(format(new Date(), 'yyyy-MM-dd'))
    setTipo('entrada')
    setCategoriaId('')
    setContaId('')
    setComprovante(null)
    setEditingLancamento(null)
  }
  
  // Abrir modal para edição
  const handleEdit = (lancamento: Lancamento) => {
    setEditingLancamento(lancamento)
    setDescricao(lancamento.descricao)
    setValor(lancamento.valor.toString())
    setData(lancamento.data)
    setTipo(lancamento.tipo)
    setCategoriaId(lancamento.categoria_id || '')
    setContaId(lancamento.conta_id || '')
    setIsDialogOpen(true)
  }
  
  // Upload de comprovante
  const handleFileUpload = async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `comprovantes/${fileName}`
      
      const { error: uploadError } = await supabase.storage
        .from('comprovantes')
        .upload(filePath, file)
      
      if (uploadError) throw uploadError
      
      // Obter URL pública
      const { data } = supabase.storage
        .from('comprovantes')
        .getPublicUrl(filePath)
      
      return data.publicUrl
    } catch (error) {
      console.error('Erro ao fazer upload:', error)
      throw error
    }
  }
  
  // Salvar lançamento (criar ou atualizar)
  const handleSave = async () => {
    if (!descricao.trim()) {
      toast.error('Descrição é obrigatória')
      return
    }
    
    if (!valor || isNaN(Number(valor)) || Number(valor) <= 0) {
      toast.error('Valor deve ser um número positivo')
      return
    }
    
    if (!data) {
      toast.error('Data é obrigatória')
      return
    }
    
    if (!contaId) {
      toast.error('Selecione uma conta')
      return
    }
    
    try {
      let comprovanteUrl = null
      
      // Upload de comprovante se houver
      if (comprovante) {
        comprovanteUrl = await handleFileUpload(comprovante)
      }
      
      if (editingLancamento) {
        // Atualizar lançamento existente
        const { error } = await supabase
          .from('lancamentos')
          .update({
            descricao,
            valor: Number(valor),
            data,
            tipo,
            categoria_id: categoriaId || null,
            conta_id: contaId,
            comprovante_url: comprovanteUrl || editingLancamento.comprovante_url
          })
          .eq('id', editingLancamento.id)
        
        if (error) throw error
        
        // Atualizar lista local
        await fetchLancamentos()
        
        toast.success('Lançamento atualizado com sucesso')
      } else {
        // Criar novo lançamento
        const { data: userData, error: userError } = await supabase.auth.getUser()
        if (userError) throw userError
        
        const { error } = await supabase
          .from('lancamentos')
          .insert({
            descricao,
            valor: Number(valor),
            data,
            tipo,
            categoria_id: categoriaId || null,
            conta_id: contaId,
            comprovante_url: comprovanteUrl,
            user_id: userData.user.id
          })
        
        if (error) throw error
        
        // Atualizar lista local
        await fetchLancamentos()
        
        toast.success('Lançamento criado com sucesso')
      }
      
      // Atualizar saldo da conta
      await atualizarSaldoConta(contaId, Number(valor), tipo, editingLancamento)
      
      // Fechar modal e resetar form
      setIsDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error('Erro ao salvar lançamento:', error)
      toast.error('Erro ao salvar lançamento')
    }
  }
  
  // Atualizar saldo da conta
  const atualizarSaldoConta = async (
    contaId: string, 
    valor: number, 
    tipo: 'entrada' | 'saida',
    lancamentoAntigo: Lancamento | null
  ) => {
    try {
      // Obter saldo atual da conta
      const { data: contaData, error: contaError } = await supabase
        .from('contas')
        .select('saldo')
        .eq('id', contaId)
        .single()
      
      if (contaError) throw contaError
      
      let novoSaldo = contaData.saldo
      
      // Se for edição, reverter o lançamento anterior
      if (lancamentoAntigo && lancamentoAntigo.conta_id === contaId) {
        if (lancamentoAntigo.tipo === 'entrada') {
          novoSaldo -= lancamentoAntigo.valor
        } else {
          novoSaldo += lancamentoAntigo.valor
        }
      }
      
      // Aplicar o novo lançamento
      if (tipo === 'entrada') {
        novoSaldo += valor
      } else {
        novoSaldo -= valor
      }
      
      // Atualizar saldo da conta
      const { error: updateError } = await supabase
        .from('contas')
        .update({ saldo: novoSaldo })
        .eq('id', contaId)
      
      if (updateError) throw updateError
      
      // Atualizar lista local de contas
      setContas(prev => 
        prev.map(c => 
          c.id === contaId 
            ? { ...c, saldo: novoSaldo } 
            : c
        )
      )
    } catch (error) {
      console.error('Erro ao atualizar saldo da conta:', error)
      throw error
    }
  }
  
  // Excluir lançamento
  const handleDelete = async (lancamento: Lancamento) => {
    if (!confirm('Tem certeza que deseja excluir este lançamento?')) {
      return
    }
    
    try {
      const { error } = await supabase
        .from('lancamentos')
        .delete()
        .eq('id', lancamento.id)
      
      if (error) throw error
      
      // Atualizar saldo da conta (reverter o lançamento)
      if (lancamento.conta_id) {
        const tipoReverso = lancamento.tipo === 'entrada' ? 'saida' : 'entrada'
        await atualizarSaldoConta(lancamento.conta_id, lancamento.valor, tipoReverso, null)
      }
      
      // Remover da lista local
      setLancamentos(prev => prev.filter(l => l.id !== lancamento.id))
      
      toast.success('Lançamento excluído com sucesso')
    } catch (error) {
      console.error('Erro ao excluir lançamento:', error)
      toast.error('Erro ao excluir lançamento')
    }
  }
  
  // Formatar valores para exibição
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }
  
  const formatDate = (dateString: string) => {
    const date = parseISO(dateString)
    return format(date, 'dd/MM/yyyy', { locale: ptBR })
  }
  
  // Navegar entre meses
  const handlePreviousMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1))
  }
  
  const handleNextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1))
  }
  
  // Calcular totais
  const totalEntradas = lancamentos
    .filter(l => l.tipo === 'entrada')
    .reduce((sum, l) => sum + l.valor, 0)
  
  const totalSaidas = lancamentos
    .filter(l => l.tipo === 'saida')
    .reduce((sum, l) => sum + l.valor, 0)
  
  const saldo = totalEntradas - totalSaidas

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Fluxo de Caixa</h1>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Novo Lançamento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingLancamento ? 'Editar Lançamento' : 'Novo Lançamento'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Input 
                  id="descricao" 
                  value={descricao} 
                  onChange={(e) => setDescricao(e.target.value)} 
                  placeholder="Ex: Pagamento de Cliente X"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="valor">Valor</Label>
                  <Input 
                    id="valor" 
                    type="number"
                    step="0.01"
                    value={valor} 
                    onChange={(e) => setValor(e.target.value)} 
                    placeholder="0,00"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="data">Data</Label>
                  <Input 
                    id="data" 
                    type="date"
                    value={data} 
                    onChange={(e) => setData(e.target.value)} 
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="tipo"
                      value="entrada"
                      checked={tipo === 'entrada'}
                      onChange={() => setTipo('entrada')}
                      className="w-4 h-4 text-green-600"
                    />
                    <span className="text-sm">Entrada</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="tipo"
                      value="saida"
                      checked={tipo === 'saida'}
                      onChange={() => setTipo('saida')}
                      className="w-4 h-4 text-red-600"
                    />
                    <span className="text-sm">Saída</span>
                  </label>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="categoria">Categoria</Label>
                <select
                  id="categoria"
                  value={categoriaId}
                  onChange={(e) => setCategoriaId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Selecione uma categoria</option>
                  {categorias
                    .filter(c => (tipo === 'entrada' && c.tipo === 'receita') || (tipo === 'saida' && c.tipo === 'despesa'))
                    .map(categoria => (
                      <option key={categoria.id} value={categoria.id}>
                        {categoria.nome}
                      </option>
                    ))
                  }
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="conta">Conta</Label>
                <select
                  id="conta"
                  value={contaId}
                  onChange={(e) => setContaId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Selecione uma conta</option>
                  {contas.map(conta => (
                    <option key={conta.id} value={conta.id}>
                      {conta.nome} ({formatCurrency(conta.saldo)})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="comprovante">Comprovante (opcional)</Label>
                <Input 
                  id="comprovante" 
                  type="file"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setComprovante(e.target.files[0])
                    }
                  }} 
                  accept="image/*,.pdf"
                />
                {editingLancamento?.comprovante_url && !comprovante && (
                  <p className="text-xs text-muted-foreground">
                    Já existe um comprovante. Envie um novo para substituir.
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                Salvar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entradas</CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalEntradas)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saídas</CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalSaidas)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${saldo >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {formatCurrency(saldo)}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
            <span className="sr-only">Mês anterior</span>
            &lt;
          </Button>
          <div className="text-lg font-medium min-w-[150px] text-center">
            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
          </div>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <span className="sr-only">Próximo mês</span>
            &gt;
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Label htmlFor="filtro" className="mr-2">Filtrar:</Label>
          <select
            id="filtro"
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value as 'todos' | 'entrada' | 'saida')}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="todos">Todos</option>
            <option value="entrada">Entradas</option>
            <option value="saida">Saídas</option>
          </select>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <p>Carregando lançamentos...</p>
        </div>
      ) : (
        <div className="border rounded-md">
          {lancamentos.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="p-3 text-left font-medium text-sm">Data</th>
                    <th className="p-3 text-left font-medium text-sm">Descrição</th>
                    <th className="p-3 text-left font-medium text-sm">Categoria</th>
                    <th className="p-3 text-left font-medium text-sm">Conta</th>
                    <th className="p-3 text-right font-medium text-sm">Valor</th>
                    <th className="p-3 text-center font-medium text-sm">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {lancamentos.map((lancamento) => (
                    <tr key={lancamento.id} className="border-t hover:bg-muted/50">
                      <td className="p-3 text-sm">{formatDate(lancamento.data)}</td>
                      <td className="p-3 text-sm">{lancamento.descricao}</td>
                      <td className="p-3 text-sm">
                        {lancamento.categorias ? (
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: lancamento.categorias.cor }}
                            />
                            {lancamento.categorias.nome}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Sem categoria</span>
                        )}
                      </td>
                      <td className="p-3 text-sm">
                        {lancamento.contas?.nome || 'N/A'}
                      </td>
                      <td className={`p-3 text-sm text-right font-medium ${
                        lancamento.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {lancamento.tipo === 'entrada' ? '+' : '-'}{formatCurrency(lancamento.valor)}
                      </td>
                      <td className="p-3 text-sm text-center">
                        <div className="flex justify-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleEdit(lancamento)}
                          >
                            <span className="sr-only">Editar</span>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDelete(lancamento)}
                          >
                            <span className="sr-only">Excluir</span>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Nenhum lançamento encontrado para o período selecionado.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
