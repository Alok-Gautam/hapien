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
  const supabase = createClient()

  const sendOTP = async (phone: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      let formattedPhone = phone.replace(/\D/g, '')
      if (!formattedPhone.startsWith('91')) {
        formattedPhone = '91' + formattedPhone
      }
      formattedPhone = '+' + formattedPhone

      const { error: otpError } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      })

      if (otpError) {
        setError(otpError.message)
        return false
      }

      return true
    } catch (err) {
      setError('Failed to send OTP. Please try again.')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const verifyOTP = async (phone: string, otp: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      let formattedPhone = phone.replace(/\D/g, '')
      if (!formattedPhone.startsWith('91')) {
        formattedPhone = '91' + formattedPhone
      }
      formattedPhone = '+' + formattedPhone

      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: otp,
        type: 'sms',
      })

      if (verifyError) {
        setError(verifyError.message)
        return false
      }

      if (data.user) {
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('id', data.user.id)
          .single()

        if (!existingUser) {
          await supabase.from('users').insert({
            id: data.user.id,
            phone: formattedPhone,
          } as any)
        }
      }

      return true
    } catch (err) {
      setError('Invalid OTP. Please try again.')
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
