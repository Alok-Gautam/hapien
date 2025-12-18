'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Mail, ArrowRight, Sparkles, Check, Lock, Eye, EyeOff } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

export default function AuthPage() {
  const router = useRouter()
  const supabase = createClient()

  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const handlePasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.trim() || !email.includes('@')) {
      toast.error('Please enter a valid email address')
      return
    }

    if (!password || password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setIsLoading(true)
    console.log(`=== ${mode === 'signin' ? 'Signing in' : 'Signing up'} with email/password ===`)

    try {
      if (mode === 'signin') {
        // Sign in with existing account
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        })

        if (error) throw error

        console.log('✓ Signed in successfully:', data.user?.email)
        toast.success('Welcome back!')

        // Check if profile exists
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle()

        if (!profile || !profile.name) {
          router.push('/onboarding')
        } else {
          router.push('/feed')
        }
      } else {
        // Sign up new account
        const { data, error } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })

        if (error) throw error

        console.log('✓ Signed up successfully:', data.user?.email)

        if (data.user && !data.session) {
          // Email confirmation required
          toast.success('Check your email to confirm your account!')
          setEmailSent(true)
        } else if (data.session) {
          // Auto-confirmed (no email confirmation required)
          toast.success('Account created!')

          // Create initial profile
          await supabase.from('users').upsert({
            id: data.user.id,
            email: data.user.email,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, { onConflict: 'id' })

          router.push('/onboarding')
        }
      }
    } catch (error: any) {
      console.error('✗ Auth error:', error)

      if (error.message?.includes('Invalid login credentials')) {
        toast.error('Invalid email or password')
      } else if (error.message?.includes('User already registered')) {
        toast.error('Email already registered. Try signing in instead.')
      } else {
        toast.error(error.message || 'Authentication failed')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true)
    console.log('=== Starting Google OAuth ===')

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      })

      if (error) throw error

      console.log('✓ Google OAuth initiated')
    } catch (error: any) {
      console.error('✗ OAuth error:', error)
      toast.error(error.message || 'Failed to sign in with Google')
      setIsGoogleLoading(false)
    }
  }

  const handleSendMagicLink = async () => {
    if (!email.trim() || !email.includes('@')) {
      toast.error('Please enter a valid email address')
      return
    }

    setIsLoading(true)
    console.log('=== Sending magic link ===')

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      console.log('✓ Magic link sent successfully')
      setEmailSent(true)
      toast.success('Check your email for the magic link!')
    } catch (error: any) {
      console.error('✗ Auth error:', error)
      toast.error(error.message || 'Failed to send magic link')
    } finally {
      setIsLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-mesh pointer-events-none opacity-30" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 w-full max-w-md"
        >
          <div className="bg-stone-800 rounded-3xl shadow-soft p-8 text-center border border-stone-700">
            <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="w-8 h-8 text-primary-400" />
            </div>

            <h1 className="font-display text-2xl font-bold text-stone-50 mb-3">
              Check your email
            </h1>

            <p className="text-stone-400 mb-6">
              We sent a {mode === 'signup' ? 'confirmation' : 'magic'} link to <span className="text-stone-300 font-medium">{email}</span>
            </p>

            <div className="bg-stone-700 rounded-2xl p-4 mb-6 border border-stone-700">
              <div className="flex items-start gap-3 text-left">
                <Check className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-neutral-300">
                  <p className="font-medium mb-1">Click the link in your email</p>
                  <p className="text-stone-500">
                    The link will {mode === 'signup' ? 'confirm your account' : 'log you in automatically'}. It expires in 1 hour.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setEmailSent(false)
                setEmail('')
                setPassword('')
              }}
              className="text-sm text-stone-400 hover:text-neutral-300 transition-colors"
            >
              Go back
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-900 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-mesh pointer-events-none opacity-30" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-2xl shadow-glow mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-display text-4xl font-bold text-stone-50 mb-2">
            Welcome to Hapien
          </h1>
          <p className="text-stone-400">
            Connect with your community
          </p>
        </div>

        <div className="bg-stone-800 rounded-3xl shadow-soft p-8 border border-stone-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl font-bold text-stone-50">
              {mode === 'signin' ? 'Sign in' : 'Sign up'}
            </h2>
            <button
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin')
                setPassword('')
              }}
              className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
            >
              {mode === 'signin' ? 'Create account' : 'Sign in instead'}
            </button>
          </div>

          {/* Email/Password Form - Primary */}
          <form onSubmit={handlePasswordAuth} className="space-y-4">
            <Input
              type="email"
              label="Email address"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-5 h-5 text-stone-500" />}
              required
              autoComplete="email"
            />

            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                label="Password"
                placeholder={mode === 'signin' ? 'Enter your password' : 'Create a password (min 6 characters)'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-5 h-5 text-stone-500" />}
                required
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[38px] text-stone-500 hover:text-stone-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <Button
              type="submit"
              className="w-full"
              isLoading={isLoading}
              disabled={!email.trim() || !password || isLoading}
              rightIcon={<ArrowRight className="w-5 h-5" />}
            >
              {mode === 'signin' ? 'Sign in' : 'Create account'}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-stone-800 text-stone-500">Or continue with</span>
            </div>
          </div>

          {/* Alternative Methods */}
          <div className="space-y-3">
            <Button
              onClick={handleGoogleLogin}
              variant="outline"
              className="w-full"
              isLoading={isGoogleLoading}
              disabled={isGoogleLoading}
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </Button>

            <Button
              onClick={handleSendMagicLink}
              variant="outline"
              className="w-full"
              disabled={!email.trim() || isLoading}
            >
              <Mail className="w-5 h-5 mr-2" />
              Send magic link
            </Button>
          </div>

          <div className="mt-6 pt-6 border-t border-stone-700">
            <p className="text-xs text-stone-500 text-center">
              {mode === 'signin'
                ? 'Sign in with email/password, Google, or magic link'
                : 'Create an account to get started'
              }
            </p>
          </div>
        </div>

        <p className="text-center text-sm text-stone-500 mt-6">
          By continuing, you agree to Hapien's Terms of Service and Privacy Policy
        </p>
      </motion.div>
    </div>
  )
}
