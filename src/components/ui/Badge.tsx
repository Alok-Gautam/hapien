import { HTMLAttributes } from 'react'
import { cn } from '@/utils/helpers'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline'
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
    default: 'bg-dark-elevated text-neutral-300',
    primary: 'bg-primary-100 text-primary-700',
    secondary: 'bg-secondary-100 text-secondary-700',
    success: 'bg-primary-900/50 text-green-700',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-tertiary-100 text-tertiary-700',
    outline: 'border border-neutral-300 text-neutral-400 bg-transparent',
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
  category: 'sports' | 'food' | 'shopping' | 'learning' | 'chill'
  size?: 'sm' | 'md' | 'lg'
  showEmoji?: boolean
  className?: string
}

const categoryStyles = {
  sports: 'bg-category-sports/10 text-category-sports',
  food: 'bg-category-food/10 text-category-food',
  shopping: 'bg-category-shopping/10 text-category-shopping',
  learning: 'bg-category-learning/10 text-category-learning',
  chill: 'bg-category-chill/10 text-category-chill',
}

const categoryEmojis = {
  sports: '🏃',
  food: '🍕',
  shopping: '🛍️',
  learning: '📚',
  chill: '😎',
}

const categoryLabels = {
  sports: 'Sports',
  food: 'Food',
  shopping: 'Shopping',
  learning: 'Learning',
  chill: 'Chill',
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
