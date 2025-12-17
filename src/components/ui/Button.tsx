import { forwardRef, ButtonHTMLAttributes } from 'react'
import { cn } from '@/utils/helpers'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'intimate' | 'safe'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = cn(
      'inline-flex items-center justify-center font-medium',
      'transition-all duration-300 ease-soft-out',
      'rounded-xl',
      'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-stone-900',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none'
    )

    const variants = {
      // Primary - Violet gradient (Euphoria)
      primary: cn(
        'bg-gradient-to-r from-violet-500 to-violet-600',
        'text-white font-medium',
        'hover:from-violet-600 hover:to-violet-700',
        'hover:shadow-warm active:scale-[0.98]',
        'focus:ring-violet-500/50'
      ),
      // Secondary - Dark purple
      secondary: cn(
        'bg-stone-700 text-stone-300',
        'hover:bg-stone-600',
        'border border-stone-600',
        'focus:ring-stone-400/50'
      ),
      // Ghost - Transparent
      ghost: cn(
        'bg-transparent text-stone-400',
        'hover:bg-stone-700 hover:text-stone-50',
        'focus:ring-stone-400/50'
      ),
      // Outline - Violet bordered
      outline: cn(
        'border-2 border-violet-500 text-violet-400',
        'bg-transparent',
        'hover:bg-violet-900/20',
        'focus:ring-violet-500/50'
      ),
      // Danger - Rose red
      danger: cn(
        'bg-gradient-to-r from-rose-500 to-rose-600',
        'text-white',
        'hover:from-rose-600 hover:to-rose-700',
        'hover:shadow-intimate active:scale-[0.98]',
        'focus:ring-rose-500/50'
      ),
      // Intimate - Magenta gradient for connection actions
      intimate: cn(
        'bg-gradient-to-r from-magenta-600 to-magenta-500',
        'text-white font-medium',
        'hover:from-magenta-700 hover:to-magenta-600',
        'hover:shadow-intimate-lg active:scale-[0.98]',
        'focus:ring-magenta-500/50'
      ),
      // Safe - Sage green for trust/safety actions
      safe: cn(
        'bg-gradient-to-r from-sage-500 to-sage-600',
        'text-white font-medium',
        'hover:from-sage-600 hover:to-sage-700',
        'hover:shadow-safe active:scale-[0.98]',
        'focus:ring-sage-500/50'
      ),
    }

    const sizes = {
      sm: 'text-sm px-3 py-1.5 gap-1.5',
      md: 'text-base px-5 py-2.5 gap-2',
      lg: 'text-lg px-7 py-3.5 gap-2.5',
    }

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    )
  }
)

Button.displayName = 'Button'

// Icon-only button variant
interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'intimate' | 'safe'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  'aria-label': string
}

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      children,
      className,
      variant = 'ghost',
      size = 'md',
      isLoading = false,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = cn(
      'inline-flex items-center justify-center',
      'transition-all duration-300 ease-soft-out',
      'rounded-full',
      'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-stone-900',
      'disabled:opacity-50 disabled:cursor-not-allowed'
    )

    const variants = {
      primary: cn(
        'bg-gradient-to-r from-violet-500 to-violet-600',
        'text-white',
        'hover:from-violet-600 hover:to-violet-700 hover:shadow-warm',
        'focus:ring-violet-500/50'
      ),
      secondary: cn(
        'bg-stone-700 text-stone-300',
        'hover:bg-stone-600 hover:text-stone-50',
        'focus:ring-stone-400/50'
      ),
      ghost: cn(
        'bg-transparent text-stone-400',
        'hover:bg-stone-700 hover:text-stone-50',
        'focus:ring-stone-400/50'
      ),
      outline: cn(
        'border border-stone-600 text-stone-400',
        'bg-transparent',
        'hover:bg-stone-700 hover:border-stone-500',
        'focus:ring-stone-400/50'
      ),
      intimate: cn(
        'bg-magenta-900/20 text-magenta-400',
        'hover:bg-magenta-900/30 hover:text-magenta-300',
        'focus:ring-magenta-500/50'
      ),
      safe: cn(
        'bg-sage-900/20 text-sage-400',
        'hover:bg-sage-900/30 hover:text-sage-300',
        'focus:ring-sage-500/50'
      ),
    }

    const sizes = {
      sm: 'w-8 h-8',
      md: 'w-10 h-10',
      lg: 'w-12 h-12',
    }

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          children
        )}
      </button>
    )
  }
)

IconButton.displayName = 'IconButton'

export { Button, IconButton }
