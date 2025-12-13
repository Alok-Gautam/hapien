import { forwardRef, TextareaHTMLAttributes } from 'react'
import { cn } from '@/utils/helpers'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s/g, '-')

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-neutral-300 mb-1.5"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            'w-full px-4 py-3 rounded-xl border border-dark-border bg-dark-card text-neutral-100 placeholder:text-neutral-500',
            'transition-all duration-200 resize-none',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            'disabled:bg-dark-bg disabled:text-neutral-400 disabled:cursor-not-allowed',
            error && 'border-tertiary-500 focus:ring-tertiary-500',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-sm text-tertiary-400">{error}</p>
        )}
        {hint && !error && (
          <p className="mt-1.5 text-sm text-neutral-500">{hint}</p>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

export { Textarea }
