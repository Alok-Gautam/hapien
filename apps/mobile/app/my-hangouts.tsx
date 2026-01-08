import React, { useState, useEffect, useCallback } from 'react'
import { StyleSheet, View, FlatList, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, router } from 'expo-router'
import { supabase } from '../lib/supabase'
import { useAuthContext } from '../contexts/AuthContext'
import { HangoutCard } from '../components/hangouts/HangoutCard'
import { LoadingSpinner, EmptyState } from '../components/ui'

interface Hangout {
  id: string
  title: string
  description: string | null
  category: string
  location: { city?: string; address?: string } | null
  date_time: string
  max_participants: number | null
  host: {
    id: string
    name: string | null
    avatar_url: string | null
  }
  rsvp_count: number
  user_rsvp: string | null
}

export default function MyHangoutsScreen() {
  const { user } = useAuthContext()
  const [hangouts, setHangouts] = useState<Hangout[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchMyHangouts = useCallback(async () => {
    if (!user) return

    try {
      // Fetch user's RSVPs
      const { data: rsvps, error: rsvpsError } = await supabase
        .from('hangout_rsvps')
        .select('hangout_id')
        .eq('user_id', user.id)
        .eq('status', 'going')

      if (rsvpsError) throw rsvpsError

      const hangoutIds = rsvps?.map((r) => r.hangout_id) || []

      if (hangoutIds.length === 0) {
        setHangouts([])
        return
      }

      // Fetch hangout details
      const { data: hangoutsData, error: hangoutsError } = await supabase
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
        .in('id', hangoutIds)
        .gte('date_time', new Date().toISOString())
        .order('date_time', { ascending: true })

      if (hangoutsError) throw hangoutsError

      // Get RSVP counts
      const hangoutsWithMeta = await Promise.all(
        (hangoutsData || []).map(async (hangout) => {
          const { count } = await supabase
            .from('hangout_rsvps')
            .select('id', { count: 'exact', head: true })
            .eq('hangout_id', hangout.id)
            .eq('status', 'going')

          return {
            ...hangout,
            host: hangout.users as any,
            rsvp_count: count || 0,
            user_rsvp: 'going',
          }
        })
      )

      setHangouts(hangoutsWithMeta)
    } catch (error) {
      console.error('Error fetching my hangouts:', error)
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }, [user])

  useEffect(() => {
    fetchMyHangouts()
  }, [fetchMyHangouts])

  const onRefresh = () => {
    setRefreshing(true)
    fetchMyHangouts()
  }

  const renderHangout = ({ item }: { item: Hangout }) => (
    <HangoutCard
      hangout={item}
      onPress={() => router.push(`/hangout/${item.id}` as any)}
    />
  )

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading your hangouts..." />
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'My Hangouts',
          headerShown: true,
        }}
      />
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <FlatList
          data={hangouts}
          renderItem={renderHangout}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
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
              title="No upcoming hangouts"
              description="Browse the Hangouts tab to find events to join."
            />
          }
        />
      </SafeAreaView>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  list: {
    padding: 16,
    flexGrow: 1,
  },
})
