import React, { useState, useEffect, useCallback } from 'react'
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, useLocalSearchParams, router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../../lib/supabase'
import { useAuthContext } from '../../contexts/AuthContext'
import { Avatar, Button, Card, LoadingSpinner } from '../../components/ui'

interface UserProfile {
  id: string
  name: string | null
  avatar_url: string | null
  bio: string | null
  interests: string[] | null
  connections_count: number
  hangouts_count: number
  communities_count: number
  connection_status: 'none' | 'pending_sent' | 'pending_received' | 'connected'
}

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuthContext()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [isUpdatingConnection, setIsUpdatingConnection] = useState(false)

  const isOwnProfile = user?.id === id

  const fetchProfile = useCallback(async () => {
    if (!id) return

    try {
      // Fetch user profile
      const { data: userData, error } = await supabase
        .from('users')
        .select('id, name, avatar_url, bio, interests')
        .eq('id', id)
        .single()

      if (error) throw error

      // Fetch counts and connection status in parallel
      const [connectionsResult, hangoutsResult, communitiesResult, connectionResult] =
        await Promise.all([
          supabase
            .from('friendships')
            .select('id', { count: 'exact', head: true })
            .or(`requester_id.eq.${id},addressee_id.eq.${id}`)
            .eq('status', 'accepted'),
          supabase
            .from('hangout_rsvps')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', id)
            .eq('status', 'going'),
          supabase
            .from('community_memberships')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', id),
          user && !isOwnProfile
            ? supabase
                .from('friendships')
                .select('requester_id, status')
                .or(
                  `and(requester_id.eq.${user.id},addressee_id.eq.${id}),and(requester_id.eq.${id},addressee_id.eq.${user.id})`
                )
                .single()
            : Promise.resolve({ data: null }),
        ])

      let connectionStatus: UserProfile['connection_status'] = 'none'
      if (connectionResult.data) {
        if (connectionResult.data.status === 'accepted') {
          connectionStatus = 'connected'
        } else if (connectionResult.data.status === 'pending') {
          connectionStatus =
            connectionResult.data.requester_id === user?.id
              ? 'pending_sent'
              : 'pending_received'
        }
      }

      setProfile({
        ...userData,
        connections_count: connectionsResult.count || 0,
        hangouts_count: hangoutsResult.count || 0,
        communities_count: communitiesResult.count || 0,
        connection_status: connectionStatus,
      })
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setIsLoading(false)
    }
  }, [id, user, isOwnProfile])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchProfile()
    setRefreshing(false)
  }, [fetchProfile])

  const handleConnectionAction = async () => {
    if (!user || !profile) return

    setIsUpdatingConnection(true)
    try {
      switch (profile.connection_status) {
        case 'none':
          // Send connection request
          await supabase.from('friendships').insert({
            requester_id: user.id,
            addressee_id: profile.id,
            status: 'pending',
          })
          setProfile({ ...profile, connection_status: 'pending_sent' })
          break

        case 'pending_received':
          // Accept connection request
          await supabase
            .from('friendships')
            .update({ status: 'accepted' })
            .eq('requester_id', profile.id)
            .eq('addressee_id', user.id)
          setProfile({
            ...profile,
            connection_status: 'connected',
            connections_count: profile.connections_count + 1,
          })
          break

        case 'pending_sent':
        case 'connected':
          // Cancel request or disconnect
          await supabase
            .from('friendships')
            .delete()
            .or(
              `and(requester_id.eq.${user.id},addressee_id.eq.${profile.id}),and(requester_id.eq.${profile.id},addressee_id.eq.${user.id})`
            )
          setProfile({
            ...profile,
            connection_status: 'none',
            connections_count:
              profile.connection_status === 'connected'
                ? profile.connections_count - 1
                : profile.connections_count,
          })
          break
      }
    } catch (error) {
      console.error('Error updating connection:', error)
    } finally {
      setIsUpdatingConnection(false)
    }
  }

  const getConnectButtonProps = () => {
    switch (profile?.connection_status) {
      case 'none':
        return { title: 'Connect', variant: 'primary' as const }
      case 'pending_sent':
        return { title: 'Cancel Request', variant: 'secondary' as const }
      case 'pending_received':
        return { title: 'Accept Request', variant: 'primary' as const }
      case 'connected':
        return { title: 'Disconnect', variant: 'secondary' as const }
      default:
        return { title: 'Connect', variant: 'primary' as const }
    }
  }

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading profile..." />
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>User not found</Text>
      </SafeAreaView>
    )
  }

  const connectButtonProps = getConnectButtonProps()

  return (
    <>
      <Stack.Screen
        options={{
          title: profile.name || 'Profile',
          headerShown: true,
        }}
      />
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#7C3AED"
            />
          }
        >
          {/* Profile Header */}
          <View style={styles.profileSection}>
            <Avatar uri={profile.avatar_url} name={profile.name} size="xl" />
            <Text style={styles.displayName}>{profile.name || 'User'}</Text>
            {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}

            {!isOwnProfile && user && (
              <Button
                title={connectButtonProps.title}
                variant={connectButtonProps.variant}
                size="sm"
                onPress={handleConnectionAction}
                loading={isUpdatingConnection}
                style={styles.connectButton}
              />
            )}

            {isOwnProfile && (
              <Button
                title="Edit Profile"
                variant="outline"
                size="sm"
                onPress={() => router.push('/edit-profile')}
                style={styles.editButton}
              />
            )}
          </View>

          {/* Stats */}
          <Card style={styles.statsCard} variant="elevated">
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{profile.connections_count}</Text>
                <Text style={styles.statLabel}>Connections</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{profile.hangouts_count}</Text>
                <Text style={styles.statLabel}>Hangouts</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{profile.communities_count}</Text>
                <Text style={styles.statLabel}>Communities</Text>
              </View>
            </View>
          </Card>

          {/* Interests */}
          {profile.interests && profile.interests.length > 0 && (
            <Card style={styles.interestsCard}>
              <Text style={styles.sectionTitle}>Interests</Text>
              <View style={styles.interestsTags}>
                {profile.interests.map((interest, index) => (
                  <View key={index} style={styles.interestTag}>
                    <Text style={styles.interestText}>{interest}</Text>
                  </View>
                ))}
              </View>
            </Card>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scrollContent: {
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 40,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  displayName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
  },
  bio: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  connectButton: {
    marginTop: 16,
    minWidth: 140,
  },
  editButton: {
    marginTop: 16,
  },
  statsCard: {
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#7C3AED',
  },
  statLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  interestsCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  interestsTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  interestTag: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    margin: 4,
  },
  interestText: {
    fontSize: 13,
    color: '#7C3AED',
    fontWeight: '500',
  },
})
