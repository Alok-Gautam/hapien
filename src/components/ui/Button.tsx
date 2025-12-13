import { forwardRef, ButtonHTMLAttributes } from 'react'
import { cn } from '@/utils/helpers'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
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
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-bg disabled:opacity-50 disabled:cursor-not-allowed'

    const variants = {
      primary:
        'bg-gradient-primary text-white hover:shadow-glow focus:ring-primary-500 active:scale-[0.98]',
      secondary:
        'bg-gradient-secondary text-white hover:shadow-glow-teal focus:ring-secondary-500 active:scale-[0.98]',
      ghost:
        'bg-transparent text-neutral-300 hover:bg-dark-hover hover:text-neutral-100 focus:ring-neutral-500',
      outline:
        'border-2 border-primary-500 text-primary-400 hover:bg-primary-900/300/10 focus:ring-primary-500',
      danger:
        'bg-tertiary-600 text-white hover:bg-tertiary-500 focus:ring-tertiary-500 active:scale-[0.98]',
    }

    const sizes = {
      sm: 'text-sm px-3 py-1.5 gap-1.5',
      md: 'text-base px-5 py-2.5 gap-2',
      lg: 'text-lg px-7 py-3.5 gap-2.5',
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
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button }
