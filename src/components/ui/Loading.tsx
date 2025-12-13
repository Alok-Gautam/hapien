import { cn } from '@/utils/helpers'
import { Loader2 } from 'lucide-react'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const spinnerSizes = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <Loader2
      className={cn('animate-spin text-primary-500', spinnerSizes[size], className)}
    />
  )
}

interface LoadingScreenProps {
  message?: string
}

export function LoadingScreen({ message = 'Loading...' }: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-dark-bg">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-gradient-primary opacity-20 animate-ping" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Spinner size="lg" />
          </div>
        </div>
        <p className="text-neutral-400 font-medium">{message}</p>
      </div>
    </div>
  )
}

export function LoadingCard() {
  return (
    <div className="bg-dark-card rounded-2xl p-5 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-neutral-200 rounded-full" />
        <div className="flex-1">
          <div className="h-4 bg-neutral-200 rounded w-1/3 mb-2" />
          <div className="h-3 bg-dark-elevated rounded w-1/4" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-dark-elevated rounded w-full" />
        <div className="h-4 bg-dark-elevated rounded w-5/6" />
        <div className="h-4 bg-dark-elevated rounded w-2/3" />
      </div>
    </div>
  )
}

export function LoadingHangoutCard() {
  return (
    <div className="bg-dark-card rounded-2xl overflow-hidden animate-pulse">
      <div className="h-32 bg-neutral-200" />
      <div className="p-4">
        <div className="h-5 bg-neutral-200 rounded w-3/4 mb-2" />
        <div className="h-4 bg-dark-elevated rounded w-1/2 mb-3" />
        <div className="flex items-center gap-2">
          <div className="h-3 bg-dark-elevated rounded w-20" />
          <div className="h-3 bg-dark-elevated rounded w-24" />
        </div>
      </div>
    </div>
  )
}

// Skeleton aliases for convenience
export const PostCardSkeleton = LoadingCard
export const HangoutCardSkeleton = LoadingHangoutCard
