'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Phone, Loader2 } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { useOTPAuth } from '@/hooks/useAuth'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/feed'
  
  const [phone, setPhone] = useState('')
  const { sendOTP, isLoading, error, clearError } = useOTPAuth()

  const formatPhoneDisplay = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '')
    // Limit to 10 digits
    return digits.slice(0, 10)
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearError()
    setPhone(formatPhoneDisplay(e.target.value))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (phone.length !== 10) {
      return
    }

    const success = await sendOTP(phone)
    if (success) {
      // Store phone and redirect info for verify page
      sessionStorage.setItem('authPhone', phone)
      sessionStorage.setItem('authRedirectTo', redirectTo)
      router.push('/auth/verify')
    }
  }

  const isValidPhone = phone.length === 10

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

          {/* Login Card */}
          <div className="bg-white rounded-3xl shadow-soft p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Phone Input */}
              <div className="space-y-2">
                <label htmlFor="phone" className="block text-sm font-medium text-neutral-700">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <span className="text-neutral-500 font-medium">+91</span>
                  </div>
                  <Input
                    id="phone"
                    type="tel"
                    inputMode="numeric"
                    placeholder="98765 43210"
                    value={phone}
                    onChange={handlePhoneChange}
                    className="pl-14 text-lg tracking-wide"
                    autoComplete="tel"
                    autoFocus
                  />
                </div>
                <p className="text-xs text-neutral-500">
                  We'll send you a one-time verification code
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-red-50 border border-red-200 rounded-xl"
                >
                  <p className="text-sm text-red-600 text-center">{error}</p>
                </motion.div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={!isValidPhone || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Sending OTP...
                  </>
                ) : (
                  <>
                    <Phone className="w-5 h-5 mr-2" />
                    Send OTP
                  </>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-neutral-500">
                  Secure & Private
                </span>
              </div>
            </div>

            {/* Benefits */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3.5 h-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm text-neutral-600">
                  No passwords to remember
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3.5 h-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm text-neutral-600">
                  Your number is only visible to friends
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3.5 h-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm text-neutral-600">
                  Connect with your local community
                </p>
              </div>
            </div>

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
