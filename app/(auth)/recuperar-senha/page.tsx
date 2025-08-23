'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const supabase = createClient()

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/redefinir-senha`,
      })

      if (error) {
        toast.error('Erro ao enviar email: ' + error.message)
        return
      }

      setSubmitted(true)
      toast.success('Email de recuperação enviado com sucesso!')
    } catch (error) {
      toast.error('Ocorreu um erro inesperado')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Recuperar Senha</CardTitle>
          <CardDescription className="text-center">
            Digite seu email para receber um link de recuperação
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!submitted ? (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="username email"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar link de recuperação'}
              </Button>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <p className="text-green-600">
                Enviamos um link de recuperação para seu email. Por favor, verifique sua caixa de entrada.
              </p>
              <Button
                onClick={() => setSubmitted(false)}
                variant="outline"
                className="w-full"
              >
                Tentar novamente
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <div className="text-sm text-center w-full">
            <Link href="/login" className="text-blue-600 hover:underline">
              Voltar para o login
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
