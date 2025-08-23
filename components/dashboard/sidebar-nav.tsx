'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  BarChart3,
  CreditCard,
  Tag,
  Settings,
  LogOut,
  Target
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface NavItem {
  title: string
  href: string
  icon: React.ReactNode
}

export function SidebarNav() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const navItems: NavItem[] = [
    {
      title: 'Dashboard',
      href: '/',
      icon: <LayoutDashboard className="h-5 w-5" />
    },
    {
      title: 'Fluxo de Caixa',
      href: '/fluxo-caixa',
      icon: <BarChart3 className="h-5 w-5" />
    },
    {
      title: 'Contas',
      href: '/contas',
      icon: <CreditCard className="h-5 w-5" />
    },
    {
      title: 'Categorias',
      href: '/categorias',
      icon: <Tag className="h-5 w-5" />
    },
    {
      title: 'Metas',
      href: '/metas',
      icon: <Target className="h-5 w-5" />
    },
    {
      title: 'Configurações',
      href: '/configuracoes',
      icon: <Settings className="h-5 w-5" />
    }
  ]

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      toast.success('Logout realizado com sucesso!')
      router.push('/login')
      router.refresh()
    } catch (error) {
      toast.error('Erro ao fazer logout')
      console.error(error)
    }
  }

  return (
    <nav className="flex flex-col h-full">
      <div className="px-3 py-2">
        <h2 className="mb-2 px-4 text-lg font-semibold">
          Controle Fácil
        </h2>
        <div className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-gray-100 dark:hover:bg-gray-800',
                pathname === item.href ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50' : 'text-gray-500 dark:text-gray-400'
              )}
            >
              {item.icon}
              {item.title}
            </Link>
          ))}
        </div>
      </div>
      <div className="mt-auto px-3 py-2">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-500 transition-all hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          <LogOut className="h-5 w-5" />
          Sair
        </button>
      </div>
    </nav>
  )
}
