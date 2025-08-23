import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  
  // Verificar se o usuário está acessando rotas protegidas
  const path = request.nextUrl.pathname
  
  // Rotas públicas que não precisam de autenticação
  const isPublicRoute = path === '/login' || 
                       path === '/cadastro' || 
                       path === '/recuperar-senha' || 
                       path.startsWith('/_next') || 
                       path.startsWith('/api')
  
  // Verificar autenticação para rotas protegidas
  if (!isPublicRoute && !user) {
    // Usuário não autenticado tentando acessar rota protegida
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  // Redirecionar usuário autenticado tentando acessar páginas de login/cadastro
  if (user && (path === '/login' || path === '/cadastro' || path === '/recuperar-senha')) {
    // Redirecionar para a página inicial
    return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    '/login',
    '/cadastro',
    '/recuperar-senha',
    '/',
    '/dashboard',
    '/categorias',
    '/contas',
    '/fluxo-caixa',
    '/metas',
    '/configuracoes'
  ],
}
