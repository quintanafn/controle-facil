import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { CookieOptions } from '@supabase/ssr'
import { Database } from '../../types/supabase'

export async function createClient() {
  const cookieStore = await cookies()
  
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string): string | undefined {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions & { expires?: Date }): void {
          cookieStore.set({ name, value, ...options as CookieOptions })
        },
        remove(name: string, options: CookieOptions & { expires?: Date }): void {
          cookieStore.set({ name, value: '', ...options as CookieOptions })
        },
      },
    }
  )
}
