'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PlusCircle, Pencil, Trash2, CreditCard, Wallet, Building } from 'lucide-react'
import { toast } from 'sonner'

interface Conta {
  id: string
  nome: string
  tipo: 'corrente' | 'poupanca' | 'investimento' | 'dinheiro' | 'outros'
  saldo: number
  instituicao: string | null
  cor: string
  user_id: string
  created_at: string
}

export default function Contas() {
  const [contas, setContas] = useState<Conta[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingConta, setEditingConta] = useState<Conta | null>(null)
  
  // Form state
  const [nome, setNome] = useState('')
  const [tipo, setTipo] = useState<'corrente' | 'poupanca' | 'investimento' | 'dinheiro' | 'outros'>('corrente')
  const [saldo, setSaldo] = useState('')
  const [instituicao, setInstituicao] = useState('')
  const [cor, setCor] = useState('#3B82F6')
  
  const supabase = createClient()
  
  // Carregar contas
  useEffect(() => {
    const fetchContas = async () => {
      setIsLoading(true)
      
      const { data, error } = await supabase
        .from('contas')
        .select('*')
        .order('nome')
      
      if (error) {
        toast.error('Erro ao carregar contas')
        console.error(error)
      } else {
        setContas(data || [])
      }
      
      setIsLoading(false)
    }
    
    fetchContas()
  }, [])
  
  // Resetar formulário
  const resetForm = () => {
    setNome('')
    setTipo('corrente')
    setSaldo('')
    setInstituicao('')
    setCor('#3B82F6')
    setEditingConta(null)
  }
  
  // Abrir modal para edição
  const handleEdit = (conta: Conta) => {
    setEditingConta(conta)
    setNome(conta.nome)
    setTipo(conta.tipo)
    setSaldo(conta.saldo.toString())
    setInstituicao(conta.instituicao || '')
    setCor(conta.cor)
    setIsDialogOpen(true)
  }
  
  // Salvar conta (criar ou atualizar)
  const handleSave = async () => {
    if (!nome.trim()) {
      toast.error('Nome da conta é obrigatório')
      return
    }
    
    if (isNaN(Number(saldo))) {
      toast.error('Saldo deve ser um número válido')
      return
    }
    
    try {
      if (editingConta) {
        // Atualizar conta existente
        const { error } = await supabase
          .from('contas')
          .update({
            nome,
            tipo,
            saldo: Number(saldo),
            instituicao: instituicao || null,
            cor
          })
          .eq('id', editingConta.id)
        
        if (error) throw error
        
        // Atualizar lista local
        setContas(prev => 
          prev.map(c => 
            c.id === editingConta.id 
              ? { ...c, nome, tipo, saldo: Number(saldo), instituicao: instituicao || null, cor } 
              : c
          )
        )
        
        toast.success('Conta atualizada com sucesso')
      } else {
        // Criar nova conta
        const { data, error } = await supabase
          .from('contas')
          .insert({
            nome,
            tipo,
            saldo: Number(saldo),
            instituicao: instituicao || null,
            cor
          })
          .select()
        
        if (error) throw error
        
        // Adicionar à lista local
        if (data) {
          setContas(prev => [...prev, data[0]])
        }
        
        toast.success('Conta criada com sucesso')
      }
      
      // Fechar modal e resetar form
      setIsDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error('Erro ao salvar conta:', error)
      toast.error('Erro ao salvar conta')
    }
  }
  
  // Excluir conta
  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta conta?')) {
      return
    }
    
    try {
      const { error } = await supabase
        .from('contas')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      // Remover da lista local
      setContas(prev => prev.filter(c => c.id !== id))
      
      toast.success('Conta excluída com sucesso')
    } catch (error) {
      console.error('Erro ao excluir conta:', error)
      toast.error('Erro ao excluir conta')
    }
  }
  
  // Formatar valores para exibição
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }
  
  // Renderizar ícone do tipo de conta
  const renderTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'corrente':
        return <CreditCard className="h-5 w-5" />
      case 'poupanca':
        return <Building className="h-5 w-5" />
      case 'dinheiro':
        return <Wallet className="h-5 w-5" />
      default:
        return <CreditCard className="h-5 w-5" />
    }
  }
  
  // Calcular saldo total
  const saldoTotal = contas.reduce((total, conta) => total + conta.saldo, 0)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Contas</h1>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nova Conta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingConta ? 'Editar Conta' : 'Nova Conta'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome</Label>
                <Input 
                  id="nome" 
                  value={nome} 
                  onChange={(e) => setNome(e.target.value)} 
                  placeholder="Ex: Conta Corrente Banco X"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo</Label>
                <select
                  id="tipo"
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as any)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="corrente">Conta Corrente</option>
                  <option value="poupanca">Conta Poupança</option>
                  <option value="investimento">Investimento</option>
                  <option value="dinheiro">Dinheiro em Espécie</option>
                  <option value="outros">Outros</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="saldo">Saldo Atual</Label>
                <Input 
                  id="saldo" 
                  type="number"
                  step="0.01"
                  value={saldo} 
                  onChange={(e) => setSaldo(e.target.value)} 
                  placeholder="0,00"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="instituicao">Instituição (opcional)</Label>
                <Input 
                  id="instituicao" 
                  value={instituicao} 
                  onChange={(e) => setInstituicao(e.target.value)} 
                  placeholder="Ex: Banco do Brasil"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cor">Cor</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    id="cor" 
                    type="color" 
                    value={cor} 
                    onChange={(e) => setCor(e.target.value)} 
                    className="w-12 h-10 p-1"
                  />
                  <span className="text-sm text-gray-500">{cor}</span>
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
      
      <Card>
        <CardHeader>
          <CardTitle>Saldo Total</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {formatCurrency(saldoTotal)}
          </div>
        </CardContent>
      </Card>
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <p>Carregando contas...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contas.length > 0 ? (
            contas.map((conta) => (
              <Card key={conta.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-medium">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: conta.cor }}
                      />
                      {conta.nome}
                    </div>
                  </CardTitle>
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleEdit(conta)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDelete(conta.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-2">
                    {renderTipoIcon(conta.tipo)}
                    <span className="text-sm text-muted-foreground">
                      {conta.tipo.charAt(0).toUpperCase() + conta.tipo.slice(1)}
                      {conta.instituicao && ` • ${conta.instituicao}`}
                    </span>
                  </div>
                  <div className="text-xl font-bold">
                    {formatCurrency(conta.saldo)}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-8">
              <p className="text-muted-foreground">
                Nenhuma conta encontrada. Crie sua primeira conta!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
