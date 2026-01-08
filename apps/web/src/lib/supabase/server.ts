import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'

export async function createClient() {
  // Get environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

  // Use placeholders during build if env vars aren't set
  const url = supabaseUrl && supabaseUrl.includes('supabase.co') 
    ? supabaseUrl 
    : 'https://placeholder.supabase.co'
  const key = supabaseAnonKey && supabaseAnonKey.startsWith('eyJ') 
    ? supabaseAnonKey 
    : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder'

  const cookieStore = await cookies()

  return createServerClient<Database>(url, key, {
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
