'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Mail, ArrowRight, Sparkles, Check } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

export default function AuthPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.trim() || !email.includes('@')) {
      toast.error('Please enter a valid email address')
      return
    }

    setIsLoading(true)
    console.log('=== Sending magic link ===')
    console.log('Email:', email)

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        console.error('Magic link error:', error)
        throw error
      }

      console.log('✓ Magic link sent successfully')
      setEmailSent(true)
      toast.success('Check your email for the magic link!')

    } catch (error: any) {
      console.error('✗ Auth error:', error)
      toast.error(error.message || 'Failed to send magic link. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-mesh pointer-events-none opacity-30" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 w-full max-w-md"
        >
          <div className="bg-dark-card rounded-3xl shadow-soft p-8 text-center border border-dark-border">
            <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="w-8 h-8 text-primary-400" />
            </div>

            <h1 className="font-display text-2xl font-bold text-neutral-100 mb-3">
              Check your email
            </h1>
            
            <p className="text-neutral-400 mb-6">
              We sent a magic link to <span className="text-neutral-200 font-medium">{email}</span>
            </p>

            <div className="bg-dark-hover rounded-2xl p-4 mb-6 border border-dark-border">
              <div className="flex items-start gap-3 text-left">
                <Check className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-neutral-300">
                  <p className="font-medium mb-1">Click the link in your email</p>
                  <p className="text-neutral-500">
                    The link will log you in automatically. It expires in 1 hour.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  setEmailSent(false)
                  setEmail('')
                }}
                className="text-sm text-neutral-400 hover:text-neutral-300 transition-colors"
              >
                Use a different email
              </button>

              <p className="text-xs text-neutral-500">
                Didn't receive it? Check your spam folder
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="fixed inset-0 bg-mesh pointer-events-none opacity-30" />

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-2xl shadow-glow mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-display text-4xl font-bold text-neutral-100 mb-2">
            Welcome to Hapien
          </h1>
          <p className="text-neutral-400">
            Connect with your community
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-dark-card rounded-3xl shadow-soft p-8 border border-dark-border">
          <h2 className="font-display text-2xl font-bold text-neutral-100 mb-6">
            Sign in with email
          </h2>

          <form onSubmit={handleSendMagicLink} className="space-y-6">
            <Input
              type="email"
              label="Email address"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-5 h-5 text-neutral-500" />}
              required
              autoComplete="email"
              autoFocus
            />

            <Button
              type="submit"
              className="w-full"
              isLoading={isLoading}
              disabled={!email.trim()}
              rightIcon={<ArrowRight className="w-5 h-5" />}
            >
              Send magic link
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-dark-border">
            <p className="text-sm text-neutral-400 text-center">
              We'll send you a magic link to sign in. No password needed!
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-neutral-500 mt-6">
          By continuing, you agree to Hapien's Terms of Service and Privacy Policy
        </p>
      </motion.div>
    </div>
  )
}
