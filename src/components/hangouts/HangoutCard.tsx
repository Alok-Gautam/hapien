'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users,
  ChevronRight,
  Star,
  Check
} from 'lucide-react'
import { Avatar, AvatarGroup } from '@/components/ui/Avatar'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { CategoryBadge } from '@/components/ui/Badge'
import { HangoutWithRelations } from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { cn, categoryConfig } from '@/utils/helpers'
import toast from 'react-hot-toast'

interface HangoutCardProps {
  hangout: HangoutWithRelations
  compact?: boolean
  onRsvpChange?: () => void
}

export function HangoutCard({ hangout, compact = false, onRsvpChange }: HangoutCardProps) {
  const { user } = useAuth()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  
  const userRsvp = hangout.rsvps?.find(r => r.user_id === user?.id)
  const goingUsers = hangout.rsvps?.filter(r => r.status === 'going') || []
  const interestedCount = hangout.rsvps?.filter(r => r.status === 'interested').length || 0
  
  const hangoutDate = new Date(hangout.date_time)
  const isToday = new Date().toDateString() === hangoutDate.toDateString()
  const isTomorrow = new Date(Date.now() + 86400000).toDateString() === hangoutDate.toDateString()
  
  const dateLabel = isToday 
    ? 'Today' 
    : isTomorrow 
    ? 'Tomorrow' 
    : hangoutDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
  
  const timeLabel = hangoutDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

  const handleRsvp = async (status: 'interested' | 'going') => {
    if (!user) return

    setIsLoading(true)

    try {
      if (userRsvp?.status === status) {
        // Remove RSVP
        await supabase
          .from('hangout_rsvps')
          .delete()
          .eq('id', userRsvp.id)
        
        toast.success('RSVP removed')
      } else if (userRsvp) {
        // Update RSVP
        await (supabase
          .from('hangout_rsvps') as any)
          .update({ status })
          .eq('id', userRsvp.id)
        
        toast.success(status === 'going' ? "You're going!" : "Marked as interested")
      } else {
        // Create new RSVP
        await (supabase
          .from('hangout_rsvps') as any)
          .insert({
            hangout_id: hangout.id,
            user_id: user.id,
            status,
          })
        
        toast.success(status === 'going' ? "You're going!" : "Marked as interested")
      }

      onRsvpChange?.()
    } catch (error) {
      console.error('RSVP error:', error)
      toast.error('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const categoryInfo = categoryConfig[hangout.category]

  if (compact) {
    return (
      <Link href={`/hangouts/${hangout.id}`}>
        <Card 
          variant="elevated" 
          padding="none" 
          className="overflow-hidden hover:shadow-soft-lg transition-shadow cursor-pointer"
        >
          {/* Cover or Category Gradient */}
          <div className={cn(
            'h-24 relative',
            hangout.cover_image_url 
              ? '' 
              : `bg-gradient-to-br ${categoryInfo.gradient}`
          )}>
            {hangout.cover_image_url ? (
              <img 
                src={hangout.cover_image_url} 
                alt={hangout.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl">{categoryInfo.emoji}</span>
              </div>
            )}
            <CategoryBadge category={hangout.category} className="absolute top-2 left-2" />
          </div>
          
          <div className="p-3">
            <h3 className="font-semibold text-neutral-900 line-clamp-1">
              {hangout.title}
            </h3>
            
            <div className="flex items-center gap-2 mt-2 text-sm text-neutral-600">
              <Calendar className="w-4 h-4 text-primary-500" />
              <span className={cn(isToday && 'text-secondary-600 font-medium')}>
                {dateLabel}
              </span>
              <Clock className="w-4 h-4 text-primary-500 ml-2" />
              <span>{timeLabel}</span>
            </div>

            {goingUsers.length > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <AvatarGroup 
                  users={goingUsers.slice(0, 3).map(r => r.user)} 
                  size="xs"
                  max={3}
                />
                <span className="text-xs text-neutral-500">
                  {goingUsers.length} going
                </span>
              </div>
            )}
          </div>
        </Card>
      </Link>
    )
  }

  return (
    <Card variant="elevated" padding="none" className="overflow-hidden">
      {/* Header */}
      <div className="p-4 pb-0">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar 
              src={hangout.host.avatar_url} 
              name={hangout.host.name || 'Host'}
              size="md"
            />
            <div>
              <Link 
                href={`/profile/${hangout.host.id}`}
                className="font-medium text-neutral-900 hover:text-primary-600 transition-colors"
              >
                {hangout.host.name}
              </Link>
              <p className="text-sm text-neutral-500">is hosting</p>
            </div>
          </div>
          <CategoryBadge category={hangout.category} />
        </div>
      </div>

      {/* Cover Image */}
      {hangout.cover_image_url && (
        <Link href={`/hangouts/${hangout.id}`} className="block mt-3">
          <div className="aspect-video relative overflow-hidden">
            <img 
              src={hangout.cover_image_url} 
              alt={hangout.title}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>
        </Link>
      )}

      {/* Content */}
      <div className="p-4">
        <Link href={`/hangouts/${hangout.id}`}>
          <h3 className="text-xl font-display font-semibold text-neutral-900 hover:text-primary-600 transition-colors">
            {hangout.title}
          </h3>
        </Link>
        
        {hangout.description && (
          <p className="text-neutral-600 mt-2 line-clamp-2">
            {hangout.description}
          </p>
        )}

        {/* Details */}
        <div className="flex flex-col gap-2 mt-4">
          <div className="flex items-center gap-2 text-neutral-600">
            <Calendar className="w-5 h-5 text-primary-500" />
            <span className={cn(
              'font-medium',
              isToday && 'text-secondary-600'
            )}>
              {dateLabel}
            </span>
            <Clock className="w-5 h-5 text-primary-500 ml-2" />
            <span>{timeLabel}</span>
          </div>
          
          {hangout.location && (
            <div className="flex items-center gap-2 text-neutral-600">
              <MapPin className="w-5 h-5 text-tertiary-500" />
              <span className="line-clamp-1">
                {hangout.location.place_name || hangout.location.address}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 text-neutral-600">
            <Users className="w-5 h-5 text-primary-500" />
            <span>
              {goingUsers.length} going
              {interestedCount > 0 && ` · ${interestedCount} interested`}
              {hangout.max_participants && ` · ${hangout.max_participants} max`}
            </span>
          </div>
        </div>

        {/* Participants Preview */}
        {goingUsers.length > 0 && (
          <div className="flex items-center gap-3 mt-4 p-3 bg-neutral-50 rounded-xl">
            <AvatarGroup 
              users={goingUsers.slice(0, 5).map(r => r.user)} 
              size="sm"
              max={5}
            />
            <span className="text-sm text-neutral-600">
              {goingUsers.length === 1 
                ? `${goingUsers[0].user.name} is going`
                : `${goingUsers[0].user.name} and ${goingUsers.length - 1} others are going`}
            </span>
          </div>
        )}

        {/* RSVP Actions */}
        <div className="flex gap-3 mt-4">
          <Button
            variant={userRsvp?.status === 'interested' ? 'primary' : 'outline'}
            className="flex-1"
            onClick={() => handleRsvp('interested')}
            disabled={isLoading}
          >
            <Star className={cn(
              'w-4 h-4 mr-2',
              userRsvp?.status === 'interested' && 'fill-current'
            )} />
            Interested
          </Button>
          <Button
            variant={userRsvp?.status === 'going' ? 'primary' : 'secondary'}
            className="flex-1"
            onClick={() => handleRsvp('going')}
            disabled={isLoading}
          >
            <Check className="w-4 h-4 mr-2" />
            Going
          </Button>
        </div>

        {/* View Details Link */}
        <Link 
          href={`/hangouts/${hangout.id}`}
          className="flex items-center justify-center gap-1 mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          View Details
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </Card>
  )
}
