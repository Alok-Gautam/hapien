'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Phone, ArrowRight, ArrowLeft } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { useOTPAuth } from '@/hooks/useAuth'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/feed'
  
  const [phone, setPhone] = useState('')
  const { sendOTP, isLoading, error, clearError } = useOTPAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (phone.length < 10) {
      return
    }

    const success = await sendOTP(phone)
    if (success) {
      // Store phone in session storage for verification page
      sessionStorage.setItem('hapien_phone', phone)
      router.push(`/auth/verify?redirectTo=${encodeURIComponent(redirectTo)}`)
    }
  }

  const formatPhoneInput = (value: string) => {
    // Remove non-digits
    const digits = value.replace(/\D/g, '')
    // Limit to 10 digits
    return digits.slice(0, 10)
  }

  return (
    <div className="min-h-screen bg-gradient-warm flex flex-col">
      {/* Background decoration */}
      <div className="fixed inset-0 bg-mesh pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 px-4 py-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </Link>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-3 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow">
                <span className="text-white font-bold text-2xl">H</span>
              </div>
            </Link>
            <h1 className="font-display text-3xl font-bold text-neutral-900 mb-2">
              Welcome to Hapien
            </h1>
            <p className="text-neutral-600">
              Enter your phone number to get started
            </p>
          </div>

          {/* Form */}
          <div className="bg-white rounded-3xl shadow-soft p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Phone Number
                </label>
                <div className="flex gap-3">
                  <div className="flex items-center px-4 bg-neutral-100 rounded-xl text-neutral-600 font-medium">
                    +91
                  </div>
                  <Input
                    type="tel"
                    inputMode="numeric"
                    placeholder="Enter your mobile number"
                    value={phone}
                    onChange={(e) => {
                      clearError()
                      setPhone(formatPhoneInput(e.target.value))
                    }}
                    leftIcon={<Phone className="w-5 h-5" />}
                    className="flex-1"
                  />
                </div>
                {error && (
                  <p className="mt-2 text-sm text-tertiary-500">{error}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                isLoading={isLoading}
                disabled={phone.length < 10}
                rightIcon={<ArrowRight className="w-5 h-5" />}
              >
                Get OTP
              </Button>
            </form>

            <p className="text-sm text-neutral-500 text-center mt-6">
              By continuing, you agree to our{' '}
              <Link href="/terms" className="text-primary-600 hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-primary-600 hover:underline">
                Privacy Policy
              </Link>
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-warm">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
