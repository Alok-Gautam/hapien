import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database'

// Validate and clean environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

if (!supabaseUrl) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}

if (!supabaseAnonKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
}

export function createClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase environment variables are not configured')
  }
  
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
}
