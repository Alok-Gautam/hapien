import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'

// Validate and clean environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

export async function createClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase environment variables are not configured')
  }

  const cookieStore = await cookies()

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch (error) {
          // Handle cookies in Server Components
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: '', ...options })
        } catch (error) {
          // Handle cookies in Server Components
        }
      },
    },
  })
}

// Alias for backwards compatibility
export const createServerSupabaseClient = createClient
