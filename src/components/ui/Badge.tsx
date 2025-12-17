import { HTMLAttributes } from 'react'
import { cn } from '@/utils/helpers'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline' | 'intimate' | 'safe' | 'premium'
  size?: 'sm' | 'md' | 'lg'
}

export function Badge({
  children,
  className,
  variant = 'default',
  size = 'md',
  ...props
}: BadgeProps) {
  const variants = {
    default: 'bg-stone-700 text-stone-600',
    primary: 'bg-amber-900/30 text-amber-300',
    secondary: 'bg-stone-700 text-stone-600',
    success: 'bg-sage-900/30 text-sage-700',
    warning: 'bg-amber-900/30 text-amber-300',
    danger: 'bg-rose-900/30 text-rose-300',
    outline: 'border border-stone-700 text-stone-500 bg-transparent',
    // New warm variants
    intimate: 'bg-rose-900/20 text-rose-400 border border-rose-100',
    safe: 'bg-sage-900/20 text-sage-400 border border-sage-100',
    premium: 'bg-gradient-to-r from-stone-800 to-stone-700 text-white',
  }

  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        'transition-colors duration-200',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}

export interface CategoryBadgeProps {
  category: 'sports' | 'food' | 'shopping' | 'learning' | 'chill' | 'coffee' | 'walk' | 'hobby'
  size?: 'sm' | 'md' | 'lg'
  showEmoji?: boolean
  className?: string
}

// Updated category styles with warm palette
const categoryStyles = {
  sports: 'bg-amber-900/30 text-amber-300',
  food: 'bg-rose-900/30 text-rose-300',
  shopping: 'bg-gold-light text-amber-800',
  learning: 'bg-sage-900/30 text-sage-700',
  chill: 'bg-amber-900/20 text-amber-400',
  coffee: 'bg-amber-900/30 text-amber-800',
  walk: 'bg-sage-900/20 text-sage-400',
  hobby: 'bg-rose-900/20 text-rose-400',
}

const categoryEmojis = {
  sports: '🏃',
  food: '🍕',
  shopping: '🛍️',
  learning: '📚',
  chill: '😎',
  coffee: '☕',
  walk: '🚶',
  hobby: '🎨',
}

const categoryLabels = {
  sports: 'Sports',
  food: 'Food',
  shopping: 'Shopping',
  learning: 'Learning',
  chill: 'Chill',
  coffee: 'Coffee',
  walk: 'Walk',
  hobby: 'Hobby',
}

export function CategoryBadge({ category, size = 'md', showEmoji = true, className }: CategoryBadgeProps) {
  const sizes = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-2.5 py-1 gap-1.5',
    lg: 'text-base px-3 py-1.5 gap-2',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        'transition-colors duration-200',
        categoryStyles[category],
        sizes[size],
        className
      )}
    >
      {showEmoji && <span>{categoryEmojis[category]}</span>}
      {categoryLabels[category]}
    </span>
  )
}

// Connection stage badge
export type ConnectionStage = 'stranger' | 'noticed' | 'mutual' | 'acquaintance' | 'connecting' | 'friend' | 'close' | 'kindred'

interface ConnectionStageBadgeProps {
  stage: ConnectionStage
  size?: 'sm' | 'md'
  className?: string
}

const stageStyles: Record<ConnectionStage, { bg: string; label: string; icon: string }> = {
  stranger: { bg: 'bg-stone-700 text-stone-500', label: '', icon: '' },
  noticed: { bg: 'bg-stone-700 text-stone-600', label: 'Noticed you', icon: '👀' },
  mutual: { bg: 'bg-amber-900/20 text-amber-400', label: 'Mutual interest', icon: '✨' },
  acquaintance: { bg: 'bg-amber-900/30 text-amber-300', label: 'Connected', icon: '👋' },
  connecting: { bg: 'bg-amber-900/30 text-amber-300', label: 'Getting to know', icon: '🌱' },
  friend: { bg: 'bg-rose-900/20 text-rose-400', label: 'Friends', icon: '💛' },
  close: { bg: 'bg-rose-900/30 text-rose-300', label: 'Close friend', icon: '💖' },
  kindred: { bg: 'bg-rose-900/30 text-rose-300', label: 'Kindred spirit', icon: '💎' },
}

export function ConnectionStageBadge({ stage, size = 'md', className }: ConnectionStageBadgeProps) {
  const config = stageStyles[stage]
  if (!config.label) return null

  const sizes = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-2.5 py-1 gap-1.5',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        config.bg,
        sizes[size],
        className
      )}
    >
      <span>{config.icon}</span>
      {config.label}
    </span>
  )
}

// Verified/Trust badge
interface VerifiedBadgeProps {
  type: 'resident' | 'community' | 'trusted'
  size?: 'sm' | 'md'
  className?: string
}

export function VerifiedBadge({ type, size = 'sm', className }: VerifiedBadgeProps) {
  const configs = {
    resident: { bg: 'bg-sage-900/20 text-sage-400 border border-sage-700', label: 'Verified Resident', icon: '✓' },
    community: { bg: 'bg-amber-900/20 text-amber-400 border border-amber-700', label: 'Verified Community', icon: '🏠' },
    trusted: { bg: 'bg-rose-900/20 text-rose-400 border border-rose-700', label: 'Trusted', icon: '💫' },
  }

  const config = configs[type]
  const sizes = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-2.5 py-1 gap-1.5',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        config.bg,
        sizes[size],
        className
      )}
    >
      <span>{config.icon}</span>
      {config.label}
    </span>
  )
}
