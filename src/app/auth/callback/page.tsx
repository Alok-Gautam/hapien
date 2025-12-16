'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, AlertCircle } from 'lucide-react'
import { Card, Button } from '@/components/ui'
import Link from 'next/link'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  const handleSuccessfulAuth = async (session: any, supabase: any) => {
    try {
      console.log('→ Handling successful authentication...')

      // Check if user profile exists
      const { data: profile, error: profileError } = await (supabase
        .from('users') as any)
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle()

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('✗ Profile check error:', profileError)
      }

      if (!profile) {
        console.log('→ No profile found, creating initial profile...')

        // Create initial user profile
        const { error: insertError } = await (supabase
          .from('users') as any)
          .insert({
            id: session.user.id,
            email: session.user.email,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })

        if (insertError) {
          console.error('✗ Profile creation error:', insertError)
        } else {
          console.log('✓ Initial profile created')
        }

        console.log('→ Redirecting to onboarding...')
        router.push('/onboarding')
      } else {
        console.log('✓ Profile exists:', profile)

        // Check if onboarding is complete
        if (!profile.name) {
          console.log('→ Onboarding incomplete, redirecting to onboarding...')
          router.push('/onboarding')
        } else {
          console.log('→ Onboarding complete, redirecting to feed...')
          router.push('/feed')
        }
      }
    } catch (error) {
      console.error('✗ Error in handleSuccessfulAuth:', error)
      setError(error instanceof Error ? error.message : 'Authentication failed')
    }
  }

  useEffect(() => {
    console.log('=== Auth callback started ===')
    const supabase = createClient()

    const code = searchParams?.get('code')
    console.log('Auth code from URL:', code ? 'present' : 'missing')

    // Listen for auth state changes (fires after PKCE code exchange)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id)

      if (event === 'SIGNED_IN' && session) {
        console.log('✓ User signed in:', session.user.id)
        await handleSuccessfulAuth(session, supabase)
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('✓ Token refreshed')
      } else if (event === 'USER_UPDATED') {
        console.log('✓ User updated')
      }
    })

    // Also check immediately for existing session (in case already authenticated)
    const checkSession = async () => {
      try {
        console.log('→ Checking for existing session...')
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.error('✗ Session error:', sessionError)
          setError('Session error. Please try logging in again.')
          return
        }

        if (session) {
          console.log('✓ Existing session found:', session.user.id)
          await handleSuccessfulAuth(session, supabase)
        } else {
          console.log('→ No existing session, waiting for PKCE code exchange...')
          // If there's a code in URL but no session yet, wait for onAuthStateChange
        }
      } catch (error) {
        console.error('✗ Callback error:', error)
        setError(error instanceof Error ? error.message : 'Authentication failed. Please try again.')
      }
    }

    checkSession()

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (error) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-neutral-100 mb-2">
            Authentication Failed
          </h2>
          <p className="text-neutral-400 mb-6">
            {error}
          </p>
          <div className="flex gap-3">
            <Link href="/" className="flex-1">
              <Button variant="outline" className="w-full">
                Go Home
              </Button>
            </Link>
            <Link href="/auth/login" className="flex-1">
              <Button className="w-full">
                Try Again
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-primary-400 animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-neutral-100 mb-2">
          Signing you in...
        </h2>
        <p className="text-neutral-400">
          Please wait while we set up your account
        </p>
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-400 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-neutral-100 mb-2">
            Loading...
          </h2>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}
