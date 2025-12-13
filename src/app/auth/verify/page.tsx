'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui'
import { useOTPAuth } from '@/hooks/useAuth'

function VerifyContent() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [redirectTo, setRedirectTo] = useState('/feed')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [resendTimer, setResendTimer] = useState(30)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  
  const { verifyOTP, sendOTP, isLoading, error, clearError } = useOTPAuth()

  // Get phone from session storage
  useEffect(() => {
    const storedPhone = sessionStorage.getItem('authPhone')
    const storedRedirect = sessionStorage.getItem('authRedirectTo')
    
    if (!storedPhone) {
      router.replace('/auth/login')
      return
    }
    
    setPhone(storedPhone)
    if (storedRedirect) setRedirectTo(storedRedirect)
  }, [router])

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendTimer])

  const handleOtpChange = (index: number, value: string) => {
    clearError()
    
    // Only allow digits
    if (value && !/^\d$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all digits entered
    if (value && index === 5) {
      const fullOtp = newOtp.join('')
      if (fullOtp.length === 6) {
        handleVerify(fullOtp)
      }
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Handle backspace
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus()
      }
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    
    if (pastedData.length === 6) {
      const newOtp = pastedData.split('')
      setOtp(newOtp)
      inputRefs.current[5]?.focus()
      handleVerify(pastedData)
    }
  }

  const handleVerify = async (otpCode: string) => {
    const success = await verifyOTP(phone, otpCode)
    if (success) {
      // Clear session storage
      sessionStorage.removeItem('authPhone')
      sessionStorage.removeItem('authRedirectTo')
      
      // Redirect based on whether user has profile
      // The middleware will handle redirecting to onboarding if needed
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

  const formatPhone = (p: string) => {
    return `+91 ${p.slice(0, 5)} ${p.slice(5)}`
  }

  if (!phone) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-warm">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    )
  }

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
          <span>Change number</span>
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
            <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow mx-auto mb-6">
              <span className="text-white font-bold text-2xl">H</span>
            </div>
            <h1 className="font-display text-3xl font-bold text-neutral-900 mb-2">
              Verify your number
            </h1>
            <p className="text-neutral-600">
              We sent a 6-digit code to{' '}
              <span className="font-medium text-neutral-900">{formatPhone(phone)}</span>
            </p>
          </div>

          {/* Verify Card */}
          <div className="bg-white rounded-3xl shadow-soft p-8">
            <div className="space-y-6">
              {/* OTP Input */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-700 text-center">
                  Enter verification code
                </label>
                <div 
                  className="flex justify-center gap-2 sm:gap-3"
                  onPaste={handlePaste}
                >
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { inputRefs.current[index] = el }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="w-11 h-14 sm:w-12 sm:h-16 text-center text-2xl font-bold rounded-xl border-2 border-neutral-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                      autoFocus={index === 0}
                    />
                  ))}
                </div>
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

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex items-center justify-center gap-2 text-primary-600">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Verifying...</span>
                </div>
              )}

              {/* Resend */}
              <div className="text-center">
                {resendTimer > 0 ? (
                  <p className="text-sm text-neutral-500">
                    Resend code in <span className="font-medium">{resendTimer}s</span>
                  </p>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResend}
                    disabled={isLoading}
                    className="text-primary-600"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Resend code
                  </Button>
                )}
              </div>
            </div>

            {/* Help text */}
            <p className="text-xs text-neutral-400 text-center mt-6">
              Didn't receive the code? Check your SMS inbox or try resending.
            </p>
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
