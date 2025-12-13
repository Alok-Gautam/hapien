import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database'

// Singleton instance
let supabaseClient: ReturnType<typeof createBrowserClient<Database>> | null = null

export function createClient() {
  // Only create client in browser environment
  if (typeof window === 'undefined') {
    // During SSR/build, return a dummy that will be replaced on client
    // This prevents build errors while allowing static generation
    return createBrowserClient<Database>(
      'https://placeholder.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder'
    )
  }

  // Return existing client if already created
  if (supabaseClient) {
    return supabaseClient
  }

  // Get and validate environment variables at runtime (client-side only)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

  // Debug logging
  console.log('[Supabase] Initializing client...')
  console.log('[Supabase] URL:', supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'NOT SET')
  console.log('[Supabase] Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}... (length: ${supabaseAnonKey.length})` : 'NOT SET')

  if (!supabaseUrl || !supabaseAnonKey) {
    const msg = `Supabase config missing - URL: ${!!supabaseUrl}, Key: ${!!supabaseAnonKey}`
    console.error('[Supabase]', msg)
    throw new Error(msg)
  }

  // Validate URL format
  if (!supabaseUrl.includes('supabase.co')) {
    console.error('[Supabase] Invalid URL:', supabaseUrl)
    throw new Error(`Invalid Supabase URL: ${supabaseUrl}`)
  }

  // Validate key format (should be a JWT)
  if (!supabaseAnonKey.startsWith('eyJ')) {
    console.error('[Supabase] Invalid key format, starts with:', supabaseAnonKey.substring(0, 10))
    throw new Error(`Invalid API key format - should start with 'eyJ'`)
  }

  console.log('[Supabase] Creating client with valid credentials')
  supabaseClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
  return supabaseClient
}
