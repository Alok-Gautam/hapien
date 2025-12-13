'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/store'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { User } from '@/types/database'

export function useAuth() {
  const [authUser, setAuthUser] = useState<SupabaseUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { user, setUser, setLoading } = useUserStore()
  const supabase = createClient()

  const fetchProfile = useCallback(async (userId: string) => {
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (profile) {
      setUser(profile)
    }
  }, [supabase, setUser])

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setAuthUser(session?.user ?? null)
      
      if (session?.user) {
        await fetchProfile(session.user.id)
      }
      
      setIsLoading(false)
      setLoading(false)
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setAuthUser(session?.user ?? null)
        
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setUser(null)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, fetchProfile, setUser, setLoading])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setAuthUser(null)
  }

  const refreshProfile = async () => {
    if (authUser) {
      await fetchProfile(authUser.id)
    }
  }

  return {
    authUser,
    user,
    isLoading,
    signOut,
    refreshProfile,
    isAuthenticated: !!authUser,
    hasProfile: !!user?.name,
  }
}

export function useGoogleAuth() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const signInWithGoogle = async (redirectTo?: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''}`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (authError) {
        setError(authError.message)
        return false
      }

      return true
    } catch (err) {
      setError('Failed to sign in with Google. Please try again.')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return {
    signInWithGoogle,
    isLoading,
    error,
    clearError: () => setError(null),
  }
}

// Keep OTP auth for backwards compatibility (can be removed if not needed)
export function useOTPAuth() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const sendOTP = async (phone: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      // Create client inside the function to ensure runtime env vars
      const supabase = createClient()
      
      let formattedPhone = phone.replace(/\D/g, '')
      if (!formattedPhone.startsWith('91')) {
        formattedPhone = '91' + formattedPhone
      }
      formattedPhone = '+' + formattedPhone

      console.log('[OTP] Sending to:', formattedPhone)
      
      const { error: otpError } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      })

      if (otpError) {
        console.error('[OTP] Error:', otpError)
        console.error('[OTP] Error code:', otpError.code)
        console.error('[OTP] Error status:', otpError.status)
        setError(otpError.message)
        return false
      }

      console.log('[OTP] Sent successfully')
      return true
    } catch (err: any) {
      console.error('[OTP] Caught error:', err)
      setError(err?.message || 'Failed to send OTP. Please try again.')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const verifyOTP = async (phone: string, otp: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      
      let formattedPhone = phone.replace(/\D/g, '')
      if (!formattedPhone.startsWith('91')) {
        formattedPhone = '91' + formattedPhone
      }
      formattedPhone = '+' + formattedPhone

      console.log('[OTP] Verifying for:', formattedPhone)

      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: otp,
        type: 'sms',
      })

      if (verifyError) {
        console.error('[OTP] Verify error:', verifyError)
        setError(verifyError.message)
        return false
      }

      if (data.user) {
        console.log('[OTP] User verified:', data.user.id)
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('id', data.user.id)
          .single()

        if (!existingUser) {
          console.log('[OTP] Creating new user profile')
          await supabase.from('users').insert({
            id: data.user.id,
            phone: formattedPhone,
          } as any)
        }
      }

      return true
    } catch (err: any) {
      console.error('[OTP] Verify caught error:', err)
      setError(err?.message || 'Invalid OTP. Please try again.')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return {
    sendOTP,
    verifyOTP,
    isLoading,
    error,
    clearError: () => setError(null),
  }
}
