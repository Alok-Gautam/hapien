'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// Helper to add timeout to promises
const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
    )
  ])
}

export function useAuth() {
  const [authUser, setAuthUser] = useState(null)
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    console.log('🚨 useAuth: Effect started')
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('🚨 Session result:', session ? 'Has session' : 'No session')
      setAuthUser(session?.user ?? null)
      
      if (session?.user) {
        console.log('🚨 Fetching profile for:', session.user.email)
        // Fetch user profile
        withTimeout(
        supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle()
          .then(({ data }) => {,
        10000 // 10 second timeout
      )
            console.log('🚨 Profile loaded:', data?.name)
            setUser(data)
            setIsLoading(false) // ← Set loading false after profile loads
          })
          .catch((err) => {
            console.error('🚨 Profile fetch error:', err)
            setIsLoading(false) // ← Set loading false even on error
          })
      } else {
        console.log('🚨 No session, setting isLoading to false')
        setIsLoading(false) // ← Set loading false if no session
      }
    }).catch((err) => {
      console.error('🚨 Session error:', err)
      setIsLoading(false) // ← Set loading false on session error
    })

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🚨 Auth state changed:', event)
        setAuthUser(session?.user ?? null)
        
        if (session?.user) {
          const { data } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle()
          setUser(data)
        } else {
          setUser(null)
        }
      }
    )

    return () => {
      console.log('🚨 Cleaning up auth subscription')
      subscription.unsubscribe()
    }
  }, [])

  console.log('🚨 useAuth render - isLoading:', isLoading, 'authUser:', !!authUser, 'user:', !!user)

  return {
    authUser,
    user,
    isLoading,
    signOut: async () => {
      await supabase.auth.signOut()
      setUser(null)
      setAuthUser(null)
    },
    refreshProfile: async () => {
      if (authUser) {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .maybeSingle()
        setUser(data)
      }
    },
    isAuthenticated: !!authUser,
    hasProfile: !!user?.name,
  }
}

export function useOTPAuth() {
  return {
    sendOTP: async () => {},
    verifyOTP: async () => {},
    isLoading: false,
    error: null,
    clearError: () => {},
  }
}
