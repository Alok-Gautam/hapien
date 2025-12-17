'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui'

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen bg-stone-900 flex flex-col">
      {/* Background decoration */}
      <div className="fixed inset-0 bg-mesh pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 px-4 py-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-stone-400 hover:text-stone-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to home</span>
        </Link>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md text-center"
        >
          {/* Error Icon */}
          <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-900/20">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>

          <h1 className="font-display text-2xl font-bold text-stone-50 mb-3">
            Authentication Error
          </h1>
          
          <p className="text-stone-400 mb-8">
            Something went wrong during sign in. This could be due to an expired link or a temporary issue. Please try again.
          </p>

          <div className="space-y-3">
            <Link href="/auth/login" className="block">
              <Button className="w-full" size="lg">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </Link>
            
            <Link href="/" className="block">
              <Button variant="outline" className="w-full" size="lg">
                Go to Home
              </Button>
            </Link>
          </div>

          <p className="text-sm text-stone-500 mt-8">
            If the problem persists, please contact support.
          </p>
        </motion.div>
      </main>
    </div>
  )
}
