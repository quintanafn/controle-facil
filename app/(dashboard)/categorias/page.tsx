'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PlusCircle, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface Categoria {
  id: string
  nome: string
  descricao: string | null
  cor: string
  tipo: 'entrada' | 'saida' | 'ambos'
  user_id: string
  created_at: string
}

export default function Categorias() {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null)
  
  // Form state
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [cor, setCor] = useState('#3B82F6')
  const [tipo, setTipo] = useState<'entrada' | 'saida' | 'ambos'>('ambos')
  
  const supabase = createClient()
  
  // Carregar categorias
  useEffect(() => {
    const fetchCategorias = async () => {
      setIsLoading(true)
      
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .order('nome')
      
      if (error) {
        toast.error('Erro ao carregar categorias')
        console.error(error)
      } else {
        setCategorias(data || [])
      }
      
      setIsLoading(false)
    }
    
    fetchCategorias()
  }, [])
  
  // Resetar formulário
  const resetForm = () => {
    setNome('')
    setDescricao('')
    setCor('#3B82F6')
    setTipo('ambos')
    setEditingCategoria(null)
  }
  
  // Abrir modal para edição
  const handleEdit = (categoria: Categoria) => {
    setEditingCategoria(categoria)
    setNome(categoria.nome)
    setDescricao(categoria.descricao || '')
    setCor(categoria.cor)
    setTipo(categoria.tipo)
    setIsDialogOpen(true)
  }
  
  // Salvar categoria (criar ou atualizar)
  const handleSave = async () => {
    if (!nome.trim()) {
      toast.error('Nome da categoria é obrigatório')
      return
    }
    
    try {
      if (editingCategoria) {
        // Atualizar categoria existente
        const { error } = await supabase
          .from('categorias')
          .update({
            nome,
            descricao: descricao || null,
            cor,
            tipo
          })
          .eq('id', editingCategoria.id)
        
        if (error) throw error
        
        // Atualizar lista local
        setCategorias(prev => 
          prev.map(cat => 
            cat.id === editingCategoria.id 
              ? { ...cat, nome, descricao: descricao || null, cor, tipo } 
              : cat
          )
        )
        
        toast.success('Categoria atualizada com sucesso')
      } else {
        // Criar nova categoria
        const { data, error } = await supabase
          .from('categorias')
          .insert({
            nome,
            descricao: descricao || null,
            cor,
            tipo
          })
          .select()
        
        if (error) throw error
        
        // Adicionar à lista local
        if (data) {
          setCategorias(prev => [...prev, data[0]])
        }
        
        toast.success('Categoria criada com sucesso')
      }
      
      // Fechar modal e resetar form
      setIsDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error('Erro ao salvar categoria:', error)
      toast.error('Erro ao salvar categoria')
    }
  }
  
  // Excluir categoria
  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) {
      return
    }
    
    try {
      const { error } = await supabase
        .from('categorias')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      // Remover da lista local
      setCategorias(prev => prev.filter(cat => cat.id !== id))
      
      toast.success('Categoria excluída com sucesso')
    } catch (error) {
      console.error('Erro ao excluir categoria:', error)
      toast.error('Erro ao excluir categoria')
    }
  }
  
  // Renderizar badge de tipo
  const renderTipoBadge = (tipo: 'entrada' | 'saida' | 'ambos') => {
    switch (tipo) {
      case 'entrada':
        return <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">Entrada</span>
      case 'saida':
        return <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded">Saída</span>
      case 'ambos':
        return <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">Ambos</span>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Categorias</h1>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nova Categoria
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCategoria ? 'Editar Categoria' : 'Nova Categoria'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome</Label>
                <Input 
                  id="nome" 
                  value={nome} 
                  onChange={(e) => setNome(e.target.value)} 
                  placeholder="Ex: Alimentação"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição (opcional)</Label>
                <Input 
                  id="descricao" 
                  value={descricao} 
                  onChange={(e) => setDescricao(e.target.value)} 
                  placeholder="Ex: Gastos com restaurantes e mercado"
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
              
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo</Label>
                <select
                  id="tipo"
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as 'entrada' | 'saida' | 'ambos')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="entrada">Entrada</option>
                  <option value="saida">Saída</option>
                  <option value="ambos">Ambos</option>
                </select>
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
          <p>Carregando categorias...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categorias.length > 0 ? (
            categorias.map((categoria) => (
              <Card key={categoria.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-medium">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: categoria.cor }}
                      />
                      {categoria.nome}
                    </div>
                  </CardTitle>
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleEdit(categoria)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDelete(categoria.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {categoria.descricao && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {categoria.descricao}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    {renderTipoBadge(categoria.tipo)}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-8">
              <p className="text-muted-foreground">
                Nenhuma categoria encontrada. Crie sua primeira categoria!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
