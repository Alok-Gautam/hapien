'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui'
import { useOTPAuth } from '@/hooks/useAuth'
import { formatPhone } from '@/utils/helpers'

function VerifyContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/feed'
  
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [phone, setPhone] = useState('')
  const [resendTimer, setResendTimer] = useState(30)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  
  const { verifyOTP, sendOTP, isLoading, error, clearError } = useOTPAuth()

  useEffect(() => {
    const storedPhone = sessionStorage.getItem('hapien_phone')
    if (!storedPhone) {
      router.replace('/auth/login')
      return
    }
    setPhone(storedPhone)
  }, [router])

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendTimer])

  const handleChange = (index: number, value: string) => {
    clearError()
    
    // Only allow digits
    if (value && !/^\d+$/.test(value)) return

    const newOtp = [...otp]
    
    // Handle paste
    if (value.length > 1) {
      const digits = value.slice(0, 6).split('')
      digits.forEach((digit, i) => {
        if (index + i < 6) {
          newOtp[index + i] = digit
        }
      })
      setOtp(newOtp)
      
      // Focus last filled input or next empty
      const nextIndex = Math.min(index + digits.length, 5)
      inputRefs.current[nextIndex]?.focus()
      return
    }

    newOtp[index] = value
    setOtp(newOtp)

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const otpString = otp.join('')
    if (otpString.length !== 6) return

    const success = await verifyOTP(phone, otpString)
    if (success) {
      sessionStorage.removeItem('hapien_phone')
      router.push(redirectTo)
    }
  }

  const handleResend = async () => {
    if (resendTimer > 0) return
    
    const success = await sendOTP(phone)
    if (success) {
      setResendTimer(30)
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    }
  }

  const isComplete = otp.every((digit) => digit !== '')

  return (
    <div className="min-h-screen bg-gradient-warm flex flex-col">
      {/* Background decoration */}
      <div className="fixed inset-0 bg-mesh pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 px-4 py-4">
        <Link
          href="/auth/login"
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
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary-100 flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">📱</span>
            </div>
            <h1 className="font-display text-3xl font-bold text-neutral-900 mb-2">
              Verify your number
            </h1>
            <p className="text-neutral-600">
              We sent a 6-digit code to{' '}
              <span className="font-medium text-neutral-900">
                {formatPhone(phone)}
              </span>
            </p>
          </div>

          {/* Form */}
          <div className="bg-white rounded-3xl shadow-soft p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* OTP Input */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-3 text-center">
                  Enter verification code
                </label>
                <div className="flex justify-center gap-2 sm:gap-3">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        inputRefs.current[index] = el
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={digit}
                      onChange={(e) => handleChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-semibold rounded-xl border-2 border-neutral-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                    />
                  ))}
                </div>
                {error && (
                  <p className="mt-3 text-sm text-tertiary-500 text-center">
                    {error}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                isLoading={isLoading}
                disabled={!isComplete}
              >
                Verify & Continue
              </Button>
            </form>

            {/* Resend */}
            <div className="text-center mt-6">
              {resendTimer > 0 ? (
                <p className="text-sm text-neutral-500">
                  Resend code in{' '}
                  <span className="font-medium text-neutral-700">
                    {resendTimer}s
                  </span>
                </p>
              ) : (
                <button
                  onClick={handleResend}
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Resend code
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-warm">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  )
}
