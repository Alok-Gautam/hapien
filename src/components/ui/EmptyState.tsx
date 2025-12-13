import { ReactNode, ComponentType, ReactElement } from 'react'
import Link from 'next/link'
import { cn } from '@/utils/helpers'
import { LucideProps } from 'lucide-react'

interface ActionLink {
  label: string
  href?: string
  onClick?: () => void
}

interface EmptyStateProps {
  icon?: ReactNode | ComponentType<LucideProps>
  title: string
  description?: string
  action?: ActionLink | ReactElement
  className?: string
}

function isActionLink(action: ActionLink | ReactElement): action is ActionLink {
  return typeof action === 'object' && action !== null && 'label' in action
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  const renderAction = (): ReactNode => {
    if (!action) return null
    
    if (isActionLink(action)) {
      if (action.href) {
        return (
          <Link
            href={action.href}
            className="px-6 py-2.5 bg-primary-900/300 text-white font-medium rounded-xl hover:bg-primary-600 transition-colors"
          >
            {action.label}
          </Link>
        )
      }
      if (action.onClick) {
        return (
          <button
            onClick={action.onClick}
            className="px-6 py-2.5 bg-primary-900/300 text-white font-medium rounded-xl hover:bg-primary-600 transition-colors"
          >
            {action.label}
          </button>
        )
      }
      return null
    }
    
    return action
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-12 px-4',
        className
      )}
    >
      {Icon && (
        <div className="mb-4 text-neutral-300">
          {typeof Icon === 'function' ? <Icon className="w-12 h-12" /> : Icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-neutral-100 mb-2">{title}</h3>
      {description && (
        <p className="text-neutral-500 max-w-sm mb-6">{description}</p>
      )}
      {renderAction()}
    </div>
  )
}
