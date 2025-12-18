'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Loader2 } from 'lucide-react'

interface ClientAuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  requireProfile?: boolean
}

/**
 * Client-side auth guard that waits for session restoration before redirecting
 * This is necessary for iOS PWA where server-side middleware can't see restored sessions
 */
export function ClientAuthGuard({
  children,
  requireAuth = true,
  requireProfile = true
}: ClientAuthGuardProps) {
  const router = useRouter()
  const { authUser, user, isLoading } = useAuth()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // Wait a bit for IndexedDB restoration to complete
    const timer = setTimeout(() => {
      setIsChecking(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (isLoading || isChecking) return

    // Check authentication
    if (requireAuth && !authUser) {
      console.log('[ClientAuthGuard] No auth user, redirecting to login')
      router.push('/auth/login')
      return
    }

    // Check profile completion
    if (requireProfile && authUser && !user?.name) {
      console.log('[ClientAuthGuard] Profile incomplete, redirecting to onboarding')
      router.push('/onboarding')
      return
    }
  }, [authUser, user, isLoading, isChecking, requireAuth, requireProfile, router])

  // Show loading while checking auth
  if (isLoading || isChecking) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
          <p className="text-stone-400">Loading...</p>
        </div>
      </div>
    )
  }

  // If we get here, auth checks passed
  return <>{children}</>
}
