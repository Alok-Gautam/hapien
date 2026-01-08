import React, { useState, useEffect, useCallback } from 'react'
import {
  StyleSheet,
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, useLocalSearchParams, router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../../lib/supabase'
import { useAuthContext } from '../../contexts/AuthContext'
import { LoadingSpinner, Avatar, Button, Badge, Card } from '../../components/ui'

interface HangoutDetail {
  id: string
  title: string
  description: string | null
  category: string
  location: { city?: string; address?: string; place_name?: string } | null
  date_time: string
  max_participants: number | null
  cover_image_url: string | null
  status: string
  host_id: string
  host: {
    id: string
    name: string | null
    avatar_url: string | null
  }
  community: {
    id: string
    name: string
  }
  rsvp_count: number
  user_rsvp: 'going' | 'interested' | null
  attendees: {
    id: string
    name: string | null
    avatar_url: string | null
    status: string
  }[]
}

const CATEGORY_EMOJI: Record<string, string> = {
  sports: '🏃',
  food: '🍕',
  shopping: '🛍️',
  learning: '📚',
  chill: '😎',
}

export default function HangoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuthContext()
  const [hangout, setHangout] = useState<HangoutDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdatingRsvp, setIsUpdatingRsvp] = useState(false)

  const fetchHangout = useCallback(async () => {
    if (!id) return

    try {
      const { data: hangoutData, error } = await supabase
        .from('hangouts')
        .select(`
          id,
          title,
          description,
          category,
          location,
          date_time,
          max_participants,
          cover_image_url,
          status,
          host_id,
          users!hangouts_host_id_fkey (
            id,
            name,
            avatar_url
          ),
          communities!hangouts_community_id_fkey (
            id,
            name
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error

      // Fetch RSVPs and user's RSVP status
      const [rsvpsResult, userRsvpResult] = await Promise.all([
        supabase
          .from('hangout_rsvps')
          .select(`
            status,
            users!hangout_rsvps_user_id_fkey (
              id,
              name,
              avatar_url
            )
          `)
          .eq('hangout_id', id)
          .eq('status', 'going'),
        user
          ? supabase
              .from('hangout_rsvps')
              .select('status')
              .eq('hangout_id', id)
              .eq('user_id', user.id)
              .single()
          : Promise.resolve({ data: null }),
      ])

      const attendees = (rsvpsResult.data || []).map((rsvp: any) => ({
        ...rsvp.users,
        status: rsvp.status,
      }))

      setHangout({
        ...hangoutData,
        host: hangoutData.users as any,
        community: hangoutData.communities as any,
        rsvp_count: attendees.length,
        user_rsvp: userRsvpResult.data?.status || null,
        attendees,
      })
    } catch (error) {
      console.error('Error fetching hangout:', error)
    } finally {
      setIsLoading(false)
    }
  }, [id, user])

  useEffect(() => {
    fetchHangout()
  }, [fetchHangout])

  const handleRsvp = async (status: 'going' | 'interested') => {
    if (!user || !hangout) {
      router.push('/(auth)/login')
      return
    }

    setIsUpdatingRsvp(true)
    try {
      if (hangout.user_rsvp === status) {
        // Remove RSVP
        await supabase
          .from('hangout_rsvps')
          .delete()
          .eq('hangout_id', hangout.id)
          .eq('user_id', user.id)

        setHangout({
          ...hangout,
          user_rsvp: null,
          rsvp_count: status === 'going' ? hangout.rsvp_count - 1 : hangout.rsvp_count,
          attendees:
            status === 'going'
              ? hangout.attendees.filter((a) => a.id !== user.id)
              : hangout.attendees,
        })
      } else {
        // Add or update RSVP
        await supabase.from('hangout_rsvps').upsert({
          hangout_id: hangout.id,
          user_id: user.id,
          status,
        })

        const wasGoing = hangout.user_rsvp === 'going'
        const isNowGoing = status === 'going'

        let newAttendees = hangout.attendees
        let newCount = hangout.rsvp_count

        if (isNowGoing && !wasGoing) {
          // Get current user info
          const { data: userData } = await supabase
            .from('users')
            .select('id, name, avatar_url')
            .eq('id', user.id)
            .single()

          newAttendees = [...hangout.attendees, { ...userData, status: 'going' } as any]
          newCount += 1
        } else if (!isNowGoing && wasGoing) {
          newAttendees = hangout.attendees.filter((a) => a.id !== user.id)
          newCount -= 1
        }

        setHangout({
          ...hangout,
          user_rsvp: status,
          rsvp_count: newCount,
          attendees: newAttendees,
        })
      }
    } catch (error) {
      console.error('Error updating RSVP:', error)
    } finally {
      setIsUpdatingRsvp(false)
    }
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const isToday = date.toDateString() === now.toDateString()
    const isTomorrow = date.toDateString() === tomorrow.toDateString()

    const timeStr = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })

    if (isToday) return `Today at ${timeStr}`
    if (isTomorrow) return `Tomorrow at ${timeStr}`

    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading hangout..." />
  }

  if (!hangout) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Hangout not found</Text>
      </SafeAreaView>
    )
  }

  const isHost = user?.id === hangout.host_id
  const isPast = new Date(hangout.date_time) < new Date()
  const isFull =
    hangout.max_participants !== null && hangout.rsvp_count >= hangout.max_participants

  return (
    <>
      <Stack.Screen
        options={{
          title: hangout.title,
          headerShown: true,
        }}
      />
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <ScrollView>
          {/* Cover Image */}
          {hangout.cover_image_url ? (
            <Image
              source={{ uri: hangout.cover_image_url }}
              style={styles.coverImage}
            />
          ) : (
            <View style={styles.coverPlaceholder}>
              <Text style={styles.categoryEmoji}>
                {CATEGORY_EMOJI[hangout.category] || '📅'}
              </Text>
            </View>
          )}

          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>
                  {CATEGORY_EMOJI[hangout.category]} {hangout.category}
                </Text>
              </View>
              {hangout.status !== 'upcoming' && (
                <Badge
                  label={hangout.status}
                  variant={hangout.status === 'completed' ? 'success' : 'warning'}
                />
              )}
            </View>

            <Text style={styles.title}>{hangout.title}</Text>

            {hangout.description && (
              <Text style={styles.description}>{hangout.description}</Text>
            )}

            {/* Details */}
            <Card style={styles.detailsCard}>
              <View style={styles.detailRow}>
                <Ionicons name="calendar-outline" size={20} color="#7C3AED" />
                <Text style={styles.detailText}>
                  {formatDateTime(hangout.date_time)}
                </Text>
              </View>

              {hangout.location && (
                <View style={styles.detailRow}>
                  <Ionicons name="location-outline" size={20} color="#7C3AED" />
                  <Text style={styles.detailText}>
                    {hangout.location.place_name ||
                      hangout.location.address ||
                      hangout.location.city ||
                      'Location TBD'}
                  </Text>
                </View>
              )}

              <View style={styles.detailRow}>
                <Ionicons name="people-outline" size={20} color="#7C3AED" />
                <Text style={styles.detailText}>
                  {hangout.rsvp_count} going
                  {hangout.max_participants && ` / ${hangout.max_participants} max`}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.detailRow}
                onPress={() => router.push(`/community/${hangout.community.id}` as any)}
              >
                <Ionicons name="globe-outline" size={20} color="#7C3AED" />
                <Text style={[styles.detailText, styles.linkText]}>
                  {hangout.community.name}
                </Text>
              </TouchableOpacity>
            </Card>

            {/* Host */}
            <TouchableOpacity
              style={styles.hostSection}
              onPress={() => router.push(`/profile/${hangout.host.id}` as any)}
            >
              <Avatar
                uri={hangout.host.avatar_url}
                name={hangout.host.name}
                size="md"
              />
              <View style={styles.hostInfo}>
                <Text style={styles.hostLabel}>Hosted by</Text>
                <Text style={styles.hostName}>{hangout.host.name || 'User'}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            {/* Attendees */}
            {hangout.attendees.length > 0 && (
              <View style={styles.attendeesSection}>
                <Text style={styles.sectionTitle}>
                  Who's Going ({hangout.attendees.length})
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.attendeesList}
                >
                  {hangout.attendees.map((attendee) => (
                    <TouchableOpacity
                      key={attendee.id}
                      style={styles.attendeeItem}
                      onPress={() => router.push(`/profile/${attendee.id}` as any)}
                    >
                      <Avatar
                        uri={attendee.avatar_url}
                        name={attendee.name}
                        size="md"
                      />
                      <Text style={styles.attendeeName} numberOfLines={1}>
                        {attendee.name?.split(' ')[0] || 'User'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* RSVP Buttons */}
            {!isPast && hangout.status === 'upcoming' && !isHost && (
              <View style={styles.rsvpButtons}>
                <Button
                  title={hangout.user_rsvp === 'going' ? "I'm Going ✓" : "I'm Going"}
                  variant={hangout.user_rsvp === 'going' ? 'primary' : 'outline'}
                  onPress={() => handleRsvp('going')}
                  loading={isUpdatingRsvp}
                  disabled={isFull && hangout.user_rsvp !== 'going'}
                  style={styles.rsvpButton}
                />
                <Button
                  title={
                    hangout.user_rsvp === 'interested' ? 'Interested ✓' : 'Interested'
                  }
                  variant={hangout.user_rsvp === 'interested' ? 'secondary' : 'ghost'}
                  onPress={() => handleRsvp('interested')}
                  loading={isUpdatingRsvp}
                  style={styles.rsvpButton}
                />
              </View>
            )}

            {isFull && !hangout.user_rsvp && (
              <Text style={styles.fullText}>This hangout is full</Text>
            )}

            {isPast && (
              <Text style={styles.pastText}>This hangout has already happened</Text>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 40,
  },
  coverImage: {
    width: '100%',
    height: 220,
    backgroundColor: '#E5E7EB',
  },
  coverPlaceholder: {
    width: '100%',
    height: 220,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryEmoji: {
    fontSize: 64,
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    fontSize: 13,
    color: '#7C3AED',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 20,
  },
  detailsCard: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailText: {
    fontSize: 15,
    color: '#374151',
    marginLeft: 12,
    flex: 1,
  },
  linkText: {
    color: '#7C3AED',
  },
  hostSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  hostInfo: {
    flex: 1,
    marginLeft: 12,
  },
  hostLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  hostName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  attendeesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  attendeesList: {
    paddingRight: 16,
  },
  attendeeItem: {
    alignItems: 'center',
    marginRight: 16,
    width: 64,
  },
  attendeeName: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
    textAlign: 'center',
  },
  rsvpButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  rsvpButton: {
    flex: 1,
  },
  fullText: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 12,
  },
  pastText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
})
