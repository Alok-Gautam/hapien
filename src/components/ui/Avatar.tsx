'use client'

import Image from 'next/image'
import { cn, getInitials, generateAvatarColor } from '@/utils/helpers'

interface AvatarProps {
  src?: string | null
  name: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  className?: string
  showOnlineStatus?: boolean
  isOnline?: boolean
}

const sizeClasses = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
  '2xl': 'w-24 h-24 text-2xl',
}

const onlineIndicatorSizes = {
  xs: 'w-1.5 h-1.5',
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3',
  xl: 'w-4 h-4',
  '2xl': 'w-5 h-5',
}

export function Avatar({
  src,
  name,
  size = 'md',
  className,
  showOnlineStatus = false,
  isOnline = false,
}: AvatarProps) {
  const initials = getInitials(name)
  const bgColor = generateAvatarColor(name)

  return (
    <div className={cn('relative inline-flex', className)}>
      {src ? (
        <div
          className={cn(
            'relative rounded-full overflow-hidden ring-2 ring-white',
            sizeClasses[size]
          )}
        >
          <Image
            src={src}
            alt={name}
            fill
            className="object-cover"
          />
        </div>
      ) : (
        <div
          className={cn(
            'rounded-full flex items-center justify-center font-semibold text-white ring-2 ring-white',
            sizeClasses[size],
            bgColor
          )}
        >
          {initials}
        </div>
      )}
      {showOnlineStatus && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full ring-2 ring-white',
            onlineIndicatorSizes[size],
            isOnline ? 'bg-green-500' : 'bg-neutral-300'
          )}
        />
      )}
    </div>
  )
}

export interface AvatarGroupProps {
  avatars?: Array<{ src?: string | null; name: string; avatar_url?: string | null }>
  users?: Array<{ avatar_url?: string | null; name?: string | null }>
  max?: number
  size?: AvatarProps['size']
}

export function AvatarGroup({ avatars, users, max = 4, size = 'sm' }: AvatarGroupProps) {
  // Support both avatars and users props
  const items: Array<{ src?: string | null; name: string }> = avatars || 
    (users?.map(u => ({ src: u.avatar_url, name: u.name || 'User' })) || [])
  
  const visibleAvatars = items.slice(0, max)
  const remainingCount = items.length - max

  return (
    <div className="flex -space-x-2">
      {visibleAvatars.map((avatar, i) => (
        <Avatar
          key={i}
          src={avatar.src}
          name={avatar.name}
          size={size}
          className="ring-2 ring-white"
        />
      ))}
      {remainingCount > 0 && (
        <div
          className={cn(
            'rounded-full flex items-center justify-center bg-neutral-100 text-neutral-600 font-medium ring-2 ring-white',
            sizeClasses[size]
          )}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  )
}
