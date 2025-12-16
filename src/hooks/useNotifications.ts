'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'

interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  body: string | null
  data: Record<string, any>
  read: boolean
  created_at: string
}

// Flag to track if notifications table exists (to avoid repeated failed queries)
let notificationsTableExists: boolean | null = null

export function useNotifications() {
  const { user } = useAuth()
  const supabase = createClient()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([])
      setUnreadCount(0)
      setIsLoading(false)
      return
    }

    // Skip if we already know the table doesn't exist
    if (notificationsTableExists === false) {
      setIsLoading(false)
      return
    }

    try {
      const { data, error } = await (supabase
        .from('notifications') as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) {
        // Check if error is "table doesn't exist"
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          console.log('Notifications table does not exist yet')
          notificationsTableExists = false
        } else {
          throw error
        }
      } else {
        notificationsTableExists = true
        const notifs = (data || []) as Notification[]
        setNotifications(notifs)
        setUnreadCount(notifs.filter(n => !n.read).length)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user, supabase])

  const fetchUnreadCount = useCallback(async () => {
    if (!user) {
      setUnreadCount(0)
      return
    }

    // Skip if we already know the table doesn't exist
    if (notificationsTableExists === false) {
      return
    }

    try {
      const { count, error } = await (supabase
        .from('notifications') as any)
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false)

      if (error) {
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          notificationsTableExists = false
        } else {
          throw error
        }
      } else {
        notificationsTableExists = true
        setUnreadCount(count || 0)
      }
    } catch (error) {
      console.error('Error fetching unread count:', error)
    }
  }, [user, supabase])

  const markAsRead = async (notificationId: string) => {
    try {
      await (supabase.from('notifications') as any)
        .update({ read: true })
        .eq('id', notificationId)

      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  const markAllAsRead = async () => {
    if (!user) return

    try {
      await (supabase.from('notifications') as any)
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false)

      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      )
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  useEffect(() => {
    fetchUnreadCount()
  }, [fetchUnreadCount])

  // Set up real-time subscription for new notifications
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification
          setNotifications(prev => [newNotification, ...prev])
          setUnreadCount(prev => prev + 1)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, supabase])

  return {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
  }
}
