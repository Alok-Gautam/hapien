import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const redirectTo = searchParams.get('redirectTo') || '/feed'
  const next = redirectTo.startsWith('/') ? redirectTo : '/feed'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.user) {
      // Check if user profile exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id, name')
        .eq('id', data.user.id)
        .single()

      if (!existingUser) {
        // Create new user profile with Google data
        await supabase.from('users').insert({
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || null,
          avatar_url: data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture || null,
        } as any)
        
        // Redirect to onboarding for new users
        return NextResponse.redirect(`${origin}/onboarding`)
      }

      // If user exists but hasn't completed onboarding (no name)
      const userData = existingUser as { id: string; name: string | null }
      if (!userData.name) {
        return NextResponse.redirect(`${origin}/onboarding`)
      }

      // Existing user with profile - redirect to intended destination
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-error`)
}
