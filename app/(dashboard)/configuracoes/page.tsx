'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Profile {
  id: string
  nome: string
  email: string
  cnpj: string | null
  telefone: string | null
  created_at: string
}

export default function Configuracoes() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  
  // Dados do perfil
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [telefone, setTelefone] = useState('')
  
  // Dados de senha
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  
  const supabase = createClient()
  
  // Carregar dados do perfil
  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true)
      
      try {
        // Obter usuário atual
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          throw new Error('Usuário não encontrado')
        }
        
        // Obter perfil do usuário
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (error) throw error
        
        setProfile(data)
        setNome(data.nome || '')
        setEmail(user.email || '')
        setCnpj(data.cnpj || '')
        setTelefone(data.telefone || '')
      } catch (error) {
        console.error('Erro ao carregar perfil:', error)
        toast.error('Erro ao carregar dados do perfil')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchProfile()
  }, [supabase])
  
  // Atualizar perfil
  const handleUpdateProfile = async () => {
    if (!nome.trim()) {
      toast.error('Nome é obrigatório')
      return
    }
    
    setIsSaving(true)
    
    try {
      // Atualizar perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          nome,
          cnpj: cnpj || null,
          telefone: telefone || null
        })
        .eq('id', profile?.id)
      
      if (profileError) throw profileError
      
      toast.success('Perfil atualizado com sucesso')
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error)
      toast.error('Erro ao atualizar perfil')
    } finally {
      setIsSaving(false)
    }
  }
  
  // Atualizar senha
  const handleUpdatePassword = async () => {
    if (!senhaAtual) {
      toast.error('Senha atual é obrigatória')
      return
    }
    
    if (!novaSenha) {
      toast.error('Nova senha é obrigatória')
      return
    }
    
    if (novaSenha !== confirmarSenha) {
      toast.error('As senhas não coincidem')
      return
    }
    
    if (novaSenha.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres')
      return
    }
    
    setIsSaving(true)
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: novaSenha
      })
      
      if (error) throw error
      
      toast.success('Senha atualizada com sucesso')
      setSenhaAtual('')
      setNovaSenha('')
      setConfirmarSenha('')
    } catch (error) {
      console.error('Erro ao atualizar senha:', error)
      toast.error('Erro ao atualizar senha')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Configurações</h1>
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <p>Carregando dados...</p>
        </div>
      ) : (
        <Tabs defaultValue="perfil" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="perfil">Perfil</TabsTrigger>
            <TabsTrigger value="senha">Senha</TabsTrigger>
          </TabsList>
          
          <TabsContent value="perfil">
            <Card>
              <CardHeader>
                <CardTitle>Dados do Perfil</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome</Label>
                  <Input 
                    id="nome" 
                    value={nome} 
                    onChange={(e) => setNome(e.target.value)} 
                    placeholder="Seu nome completo"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    value={email} 
                    disabled
                    placeholder="Seu email"
                  />
                  <p className="text-sm text-muted-foreground">
                    O email não pode ser alterado.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ (opcional)</Label>
                  <Input 
                    id="cnpj" 
                    value={cnpj} 
                    onChange={(e) => setCnpj(e.target.value)} 
                    placeholder="CNPJ da empresa"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone (opcional)</Label>
                  <Input 
                    id="telefone" 
                    value={telefone} 
                    onChange={(e) => setTelefone(e.target.value)} 
                    placeholder="Seu telefone"
                  />
                </div>
                
                <Button 
                  onClick={handleUpdateProfile} 
                  disabled={isSaving}
                  className="w-full md:w-auto"
                >
                  {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="senha">
            <Card>
              <CardHeader>
                <CardTitle>Alterar Senha</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="senha-atual">Senha Atual</Label>
                  <Input 
                    id="senha-atual" 
                    type="password"
                    value={senhaAtual} 
                    onChange={(e) => setSenhaAtual(e.target.value)} 
                    placeholder="Sua senha atual"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="nova-senha">Nova Senha</Label>
                  <Input 
                    id="nova-senha" 
                    type="password"
                    value={novaSenha} 
                    onChange={(e) => setNovaSenha(e.target.value)} 
                    placeholder="Nova senha"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmar-senha">Confirmar Nova Senha</Label>
                  <Input 
                    id="confirmar-senha" 
                    type="password"
                    value={confirmarSenha} 
                    onChange={(e) => setConfirmarSenha(e.target.value)} 
                    placeholder="Confirme a nova senha"
                  />
                </div>
                
                <Button 
                  onClick={handleUpdatePassword} 
                  disabled={isSaving}
                  className="w-full md:w-auto"
                >
                  {isSaving ? 'Atualizando...' : 'Atualizar Senha'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
