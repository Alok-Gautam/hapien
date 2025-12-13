'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, X, FileText, Calendar } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/utils/helpers'

export function FloatingActionButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="fixed bottom-20 right-4 z-50 lg:bottom-6 lg:right-6">
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/20 -z-10"
            />

            {/* Options */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-16 right-0 flex flex-col gap-3"
            >
              <Link
                href="/create/post"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-3 bg-dark-card rounded-xl shadow-soft border border-dark-border hover:shadow-soft border border-dark-border-lg transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-secondary-100 flex items-center justify-center group-hover:bg-secondary-200 transition-colors">
                  <FileText className="w-5 h-5 text-secondary-600" />
                </div>
                <span className="font-medium text-neutral-300 whitespace-nowrap">
                  New Post
                </span>
              </Link>

              <Link
                href="/hangouts/create"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-3 bg-dark-card rounded-xl shadow-soft border border-dark-border hover:shadow-soft border border-dark-border-lg transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                  <Calendar className="w-5 h-5 text-primary-400" />
                </div>
                <span className="font-medium text-neutral-300 whitespace-nowrap">
                  New Hangout
                </span>
              </Link>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* FAB Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-200',
          isOpen
            ? 'bg-neutral-800 rotate-45'
            : 'bg-gradient-primary hover:shadow-glow'
        )}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <Plus className="w-6 h-6 text-white" />
        )}
      </button>
    </div>
  )
}
