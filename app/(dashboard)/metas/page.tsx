'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PlusCircle, Target, Pencil, Trash2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Meta {
  id: string
  titulo: string
  descricao: string | null
  valor_meta: number
  valor_atual: number
  data_inicio: string
  data_fim: string | null
  concluida: boolean
  user_id: string
  created_at: string
}

export default function Metas() {
  const [metas, setMetas] = useState<Meta[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingMeta, setEditingMeta] = useState<Meta | null>(null)
  
  // Form state
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [valorMeta, setValorMeta] = useState('')
  const [valorAtual, setValorAtual] = useState('')
  const [dataInicio, setDataInicio] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [dataFim, setDataFim] = useState('')
  
  const supabase = createClient()
  
  // Carregar metas
  useEffect(() => {
    const fetchMetas = async () => {
      setIsLoading(true)
      
      const { data, error } = await supabase
        .from('metas_financeiras')
        .select('*')
        .order('concluida', { ascending: true })
        .order('data_fim', { ascending: true })
      
      if (error) {
        toast.error('Erro ao carregar metas')
        console.error(error)
      } else {
        setMetas(data || [])
      }
      
      setIsLoading(false)
    }
    
    fetchMetas()
  }, [])
  
  // Resetar formulário
  const resetForm = () => {
    setTitulo('')
    setDescricao('')
    setValorMeta('')
    setValorAtual('')
    setDataInicio(format(new Date(), 'yyyy-MM-dd'))
    setDataFim('')
    setEditingMeta(null)
  }
  
  // Abrir modal para edição
  const handleEdit = (meta: Meta) => {
    setEditingMeta(meta)
    setTitulo(meta.titulo)
    setDescricao(meta.descricao || '')
    setValorMeta(meta.valor_meta.toString())
    setValorAtual(meta.valor_atual.toString())
    setDataInicio(meta.data_inicio)
    setDataFim(meta.data_fim || '')
    setIsDialogOpen(true)
  }
  
  // Salvar meta (criar ou atualizar)
  const handleSave = async () => {
    if (!titulo.trim()) {
      toast.error('Título da meta é obrigatório')
      return
    }
    
    if (!valorMeta || isNaN(Number(valorMeta)) || Number(valorMeta) <= 0) {
      toast.error('Valor da meta deve ser um número positivo')
      return
    }
    
    if (!valorAtual || isNaN(Number(valorAtual))) {
      toast.error('Valor atual deve ser um número válido')
      return
    }
    
    if (!dataInicio) {
      toast.error('Data de início é obrigatória')
      return
    }
    
    try {
      const metaData = {
        titulo,
        descricao: descricao || null,
        valor_meta: Number(valorMeta),
        valor_atual: Number(valorAtual),
        data_inicio: dataInicio,
        data_fim: dataFim || null,
        concluida: Number(valorAtual) >= Number(valorMeta)
      }
      
      if (editingMeta) {
        // Atualizar meta existente
        const { error } = await supabase
          .from('metas_financeiras')
          .update(metaData)
          .eq('id', editingMeta.id)
        
        if (error) throw error
        
        // Atualizar lista local
        setMetas(prev => 
          prev.map(m => 
            m.id === editingMeta.id 
              ? { ...m, ...metaData } 
              : m
          )
        )
        
        toast.success('Meta atualizada com sucesso')
      } else {
        // Criar nova meta
        const { data, error } = await supabase
          .from('metas_financeiras')
          .insert(metaData)
          .select()
        
        if (error) throw error
        
        // Adicionar à lista local
        if (data) {
          setMetas(prev => [...prev, data[0]])
        }
        
        toast.success('Meta criada com sucesso')
      }
      
      // Fechar modal e resetar form
      setIsDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error('Erro ao salvar meta:', error)
      toast.error('Erro ao salvar meta')
    }
  }
  
  // Excluir meta
  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta meta?')) {
      return
    }
    
    try {
      const { error } = await supabase
        .from('metas_financeiras')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      // Remover da lista local
      setMetas(prev => prev.filter(m => m.id !== id))
      
      toast.success('Meta excluída com sucesso')
    } catch (error) {
      console.error('Erro ao excluir meta:', error)
      toast.error('Erro ao excluir meta')
    }
  }
  
  // Marcar meta como concluída
  const handleToggleConcluida = async (meta: Meta) => {
    try {
      const novoStatus = !meta.concluida
      
      const { error } = await supabase
        .from('metas_financeiras')
        .update({ concluida: novoStatus })
        .eq('id', meta.id)
      
      if (error) throw error
      
      // Atualizar lista local
      setMetas(prev => 
        prev.map(m => 
          m.id === meta.id 
            ? { ...m, concluida: novoStatus } 
            : m
        )
      )
      
      toast.success(novoStatus ? 'Meta marcada como concluída' : 'Meta reaberta')
    } catch (error) {
      console.error('Erro ao atualizar status da meta:', error)
      toast.error('Erro ao atualizar status da meta')
    }
  }
  
  // Formatar valores para exibição
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Não definida'
    const date = parseISO(dateString)
    return format(date, 'dd/MM/yyyy', { locale: ptBR })
  }
  
  // Calcular progresso da meta
  const calcularProgresso = (valorAtual: number, valorMeta: number) => {
    const progresso = (valorAtual / valorMeta) * 100
    return Math.min(Math.max(progresso, 0), 100) // Limitar entre 0 e 100
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Metas Financeiras</h1>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nova Meta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingMeta ? 'Editar Meta' : 'Nova Meta'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="titulo">Título</Label>
                <Input 
                  id="titulo" 
                  value={titulo} 
                  onChange={(e) => setTitulo(e.target.value)} 
                  placeholder="Ex: Comprar um carro"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição (opcional)</Label>
                <Input 
                  id="descricao" 
                  value={descricao} 
                  onChange={(e) => setDescricao(e.target.value)} 
                  placeholder="Detalhes sobre sua meta"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="valorMeta">Valor da Meta</Label>
                  <Input 
                    id="valorMeta" 
                    type="number"
                    step="0.01"
                    value={valorMeta} 
                    onChange={(e) => setValorMeta(e.target.value)} 
                    placeholder="0,00"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="valorAtual">Valor Atual</Label>
                  <Input 
                    id="valorAtual" 
                    type="number"
                    step="0.01"
                    value={valorAtual} 
                    onChange={(e) => setValorAtual(e.target.value)} 
                    placeholder="0,00"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dataInicio">Data de Início</Label>
                  <Input 
                    id="dataInicio" 
                    type="date"
                    value={dataInicio} 
                    onChange={(e) => setDataInicio(e.target.value)} 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dataFim">Data de Término (opcional)</Label>
                  <Input 
                    id="dataFim" 
                    type="date"
                    value={dataFim} 
                    onChange={(e) => setDataFim(e.target.value)} 
                  />
                </div>
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
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <p>Carregando metas...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {metas.length > 0 ? (
            metas.map((meta) => {
              const progresso = calcularProgresso(meta.valor_atual, meta.valor_meta)
              
              return (
                <Card key={meta.id} className={meta.concluida ? 'border-green-500' : ''}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg font-medium">
                      <div className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        {meta.titulo}
                        {meta.concluida && (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                    </CardTitle>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleEdit(meta)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDelete(meta.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {meta.descricao && (
                      <p className="text-sm text-muted-foreground">{meta.descricao}</p>
                    )}
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Progresso:</span>
                        <span className="font-medium">{progresso.toFixed(0)}%</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${meta.concluida ? 'bg-green-500' : 'bg-blue-500'}`}
                          style={{ width: `${progresso}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Valor Atual</p>
                        <p className="font-medium">{formatCurrency(meta.valor_atual)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Valor Meta</p>
                        <p className="font-medium">{formatCurrency(meta.valor_meta)}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Início</p>
                        <p className="font-medium">{formatDate(meta.data_inicio)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Término</p>
                        <p className="font-medium">{formatDate(meta.data_fim)}</p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      variant={meta.concluida ? "outline" : "default"}
                      size="sm"
                      className="w-full"
                      onClick={() => handleToggleConcluida(meta)}
                    >
                      {meta.concluida ? 'Reabrir Meta' : 'Marcar como Concluída'}
                    </Button>
                  </CardFooter>
                </Card>
              )
            })
          ) : (
            <div className="col-span-full text-center py-8">
              <p className="text-muted-foreground">
                Nenhuma meta encontrada. Crie sua primeira meta financeira!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
