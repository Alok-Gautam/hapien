import React, { useState, useEffect, useCallback } from 'react'
import { StyleSheet, View, FlatList, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { useAuthContext } from '../../contexts/AuthContext'
import { HangoutCard } from '../../components/hangouts/HangoutCard'
import { CategoryFilter } from '../../components/hangouts/CategoryFilter'
import { LoadingSpinner, EmptyState } from '../../components/ui'
import { CreatePostButton } from '../../components/feed/CreatePostButton'

interface Hangout {
  id: string
  title: string
  description: string | null
  category: string
  location: { city?: string; address?: string } | null
  date_time: string
  max_participants: number | null
  host_id: string
  host: {
    id: string
    name: string | null
    avatar_url: string | null
  }
  rsvp_count: number
  user_rsvp: string | null
}

export default function HangoutsScreen() {
  const { user, isAuthenticated } = useAuthContext()
  const [hangouts, setHangouts] = useState<Hangout[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const fetchHangouts = useCallback(async () => {
    try {
      let query = supabase
        .from('hangouts')
        .select(`
          id,
          title,
          description,
          category,
          location,
          date_time,
          max_participants,
          host_id,
          users!hangouts_host_id_fkey (
            id,
            name,
            avatar_url
          )
        `)
        .gte('date_time', new Date().toISOString())
        .order('date_time', { ascending: true })
        .limit(50)

      if (selectedCategory) {
        query = query.eq('category', selectedCategory)
      }

      const { data: hangoutsData, error } = await query

      if (error) throw error

      // Get RSVP counts and user's RSVP status
      const hangoutsWithMeta = await Promise.all(
        (hangoutsData || []).map(async (hangout) => {
          const [rsvpCountResult, userRsvpResult] = await Promise.all([
            supabase
              .from('hangout_rsvps')
              .select('id', { count: 'exact', head: true })
              .eq('hangout_id', hangout.id)
              .eq('status', 'going'),
            user
              ? supabase
                  .from('hangout_rsvps')
                  .select('status')
                  .eq('hangout_id', hangout.id)
                  .eq('user_id', user.id)
                  .single()
              : Promise.resolve({ data: null }),
          ])

          return {
            ...hangout,
            host: hangout.users as any,
            rsvp_count: rsvpCountResult.count || 0,
            user_rsvp: userRsvpResult.data?.status || null,
          }
        })
      )

      setHangouts(hangoutsWithMeta)
    } catch (error) {
      console.error('Error fetching hangouts:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user, selectedCategory])

  useEffect(() => {
    fetchHangouts()
  }, [fetchHangouts])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchHangouts()
    setRefreshing(false)
  }, [fetchHangouts])

  const handleRsvp = async (hangoutId: string, status: 'going' | 'interested') => {
    if (!user) {
      router.push('/(auth)/login')
      return
    }

    try {
      await supabase.from('hangout_rsvps').upsert({
        hangout_id: hangoutId,
        user_id: user.id,
        status,
      })

      // Update local state
      setHangouts((prev) =>
        prev.map((hangout) =>
          hangout.id === hangoutId
            ? {
                ...hangout,
                user_rsvp: status,
                rsvp_count:
                  status === 'going'
                    ? hangout.rsvp_count + (hangout.user_rsvp === 'going' ? 0 : 1)
                    : hangout.rsvp_count - (hangout.user_rsvp === 'going' ? 1 : 0),
              }
            : hangout
        )
      )
    } catch (error) {
      console.error('Error updating RSVP:', error)
    }
  }

  const handleCreateHangout = () => {
    if (!isAuthenticated) {
      router.push('/(auth)/login')
      return
    }
    router.push('/create-hangout')
  }

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading hangouts..." />
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <CategoryFilter
        selected={selectedCategory}
        onSelect={setSelectedCategory}
      />

      <FlatList
        data={hangouts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <HangoutCard
            hangout={item}
            onPress={() => router.push(`/hangout/${item.id}` as any)}
            onRsvp={(status) => handleRsvp(item.id, status)}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#7C3AED"
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="calendar-outline"
            title="No hangouts found"
            description={
              selectedCategory
                ? 'Try a different category or create your own hangout!'
                : 'Be the first to create a hangout in your area!'
            }
            actionLabel="Create Hangout"
            onAction={handleCreateHangout}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      <CreatePostButton onPress={handleCreateHangout} />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  listContent: {
    flexGrow: 1,
    padding: 16,
  },
})
