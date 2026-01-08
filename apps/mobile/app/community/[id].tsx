import React, { useState, useEffect } from 'react'
import { StyleSheet, View, Text, Image, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, useLocalSearchParams, router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../../lib/supabase'
import { useAuthContext } from '../../contexts/AuthContext'
import { LoadingSpinner, Button, Badge } from '../../components/ui'

interface Community {
  id: string
  name: string
  description: string | null
  cover_image_url: string | null
  location: { city?: string; address?: string } | null
  created_at: string
  member_count: number
  is_member: boolean
}

export default function CommunityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuthContext()
  const [community, setCommunity] = useState<Community | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isJoining, setIsJoining] = useState(false)

  useEffect(() => {
    if (id) {
      fetchCommunity()
    }
  }, [id])

  const fetchCommunity = async () => {
    try {
      const { data: communityData, error } = await supabase
        .from('communities')
        .select('id, name, description, cover_image_url, location, created_at')
        .eq('id', id)
        .single()

      if (error) throw error

      // Get member count and user membership
      const [memberCountResult, isMemberResult] = await Promise.all([
        supabase
          .from('community_memberships')
          .select('id', { count: 'exact', head: true })
          .eq('community_id', id),
        user
          ? supabase
              .from('community_memberships')
              .select('id')
              .eq('community_id', id)
              .eq('user_id', user.id)
              .single()
          : Promise.resolve({ data: null }),
      ])

      setCommunity({
        ...communityData,
        member_count: memberCountResult.count || 0,
        is_member: !!isMemberResult.data,
      })
    } catch (error) {
      console.error('Error fetching community:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleJoinLeave = async () => {
    if (!user || !community) return

    setIsJoining(true)
    try {
      if (community.is_member) {
        // Leave community
        await supabase
          .from('community_memberships')
          .delete()
          .eq('community_id', community.id)
          .eq('user_id', user.id)

        setCommunity({
          ...community,
          is_member: false,
          member_count: community.member_count - 1,
        })
      } else {
        // Join community
        await supabase.from('community_memberships').insert({
          community_id: community.id,
          user_id: user.id,
          role: 'member',
        })

        setCommunity({
          ...community,
          is_member: true,
          member_count: community.member_count + 1,
        })
      }
    } catch (error) {
      console.error('Error joining/leaving community:', error)
    } finally {
      setIsJoining(false)
    }
  }

  const formatLocation = (location: { city?: string; address?: string } | null) => {
    if (!location) return null
    const parts = []
    if (location.address) parts.push(location.address)
    if (location.city) parts.push(location.city)
    return parts.join(', ')
  }

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading community..." />
  }

  if (!community) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Community not found</Text>
      </SafeAreaView>
    )
  }

  const locationText = formatLocation(community.location)

  return (
    <>
      <Stack.Screen
        options={{
          title: community.name,
          headerShown: true,
        }}
      />
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <ScrollView>
          {community.cover_image_url ? (
            <Image
              source={{ uri: community.cover_image_url }}
              style={styles.coverImage}
            />
          ) : (
            <View style={styles.coverPlaceholder}>
              <Ionicons name="people" size={64} color="#9CA3AF" />
            </View>
          )}

          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.name}>{community.name}</Text>
              {community.is_member && (
                <Badge label="Member" variant="primary" size="sm" />
              )}
            </View>

            {community.description && (
              <Text style={styles.description}>{community.description}</Text>
            )}

            <View style={styles.stats}>
              {locationText && (
                <View style={styles.statItem}>
                  <Ionicons name="location-outline" size={20} color="#6B7280" />
                  <Text style={styles.statText}>{locationText}</Text>
                </View>
              )}
              <View style={styles.statItem}>
                <Ionicons name="people-outline" size={20} color="#6B7280" />
                <Text style={styles.statText}>
                  {community.member_count} members
                </Text>
              </View>
            </View>

            <Button
              title={community.is_member ? 'Leave Community' : 'Join Community'}
              variant={community.is_member ? 'secondary' : 'primary'}
              onPress={handleJoinLeave}
              loading={isJoining}
              style={styles.joinButton}
            />
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
  coverImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#E5E7EB',
  },
  coverPlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
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
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    marginRight: 12,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 20,
  },
  stats: {
    marginBottom: 24,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statText: {
    fontSize: 15,
    color: '#6B7280',
    marginLeft: 8,
  },
  joinButton: {
    width: '100%',
  },
})
