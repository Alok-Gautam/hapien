import React, { useState, useEffect, useCallback } from 'react'
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../lib/supabase'
import { useAuthContext } from '../contexts/AuthContext'
import { LoadingSpinner, EmptyState, Card, Badge } from '../components/ui'

interface Community {
  id: string
  name: string
  description: string | null
  cover_image_url: string | null
  member_count: number
  role: 'member' | 'admin'
  status: 'pending' | 'approved' | 'rejected'
}

export default function MyCommunitiesScreen() {
  const { user } = useAuthContext()
  const [communities, setCommunities] = useState<Community[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchMyCommunities = useCallback(async () => {
    if (!user) {
      setIsLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('community_memberships')
        .select(`
          role,
          status,
          communities!community_memberships_community_id_fkey (
            id,
            name,
            description,
            cover_image_url,
            member_count
          )
        `)
        .eq('user_id', user.id)
        .order('joined_at', { ascending: false })

      if (error) throw error

      const communitiesData = (data || []).map((item: any) => ({
        ...item.communities,
        role: item.role,
        status: item.status,
      }))

      setCommunities(communitiesData)
    } catch (error) {
      console.error('Error fetching communities:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchMyCommunities()
  }, [fetchMyCommunities])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchMyCommunities()
    setRefreshing(false)
  }, [fetchMyCommunities])

  const handleLeaveCommunity = async (communityId: string) => {
    if (!user) return

    try {
      await supabase
        .from('community_memberships')
        .delete()
        .eq('community_id', communityId)
        .eq('user_id', user.id)

      setCommunities((prev) => prev.filter((c) => c.id !== communityId))
    } catch (error) {
      console.error('Error leaving community:', error)
    }
  }

  const renderCommunity = ({ item }: { item: Community }) => (
    <TouchableOpacity
      style={styles.communityCard}
      onPress={() => router.push(`/community/${item.id}`)}
      activeOpacity={0.7}
    >
      {item.cover_image_url ? (
        <Image source={{ uri: item.cover_image_url }} style={styles.coverImage} />
      ) : (
        <View style={styles.coverPlaceholder}>
          <Ionicons name="people" size={32} color="#9CA3AF" />
        </View>
      )}

      <View style={styles.communityInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.communityName} numberOfLines={1}>
            {item.name}
          </Text>
          {item.role === 'admin' && (
            <Badge label="Admin" variant="primary" size="sm" />
          )}
          {item.status === 'pending' && (
            <Badge label="Pending" variant="warning" size="sm" />
          )}
        </View>

        {item.description && (
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="people-outline" size={16} color="#6B7280" />
            <Text style={styles.statText}>{item.member_count} members</Text>
          </View>
        </View>
      </View>

      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </TouchableOpacity>
  )

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading communities..." />
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'My Communities',
          headerShown: true,
        }}
      />
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <FlatList
          data={communities}
          keyExtractor={(item) => item.id}
          renderItem={renderCommunity}
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
              icon="people-outline"
              title="No communities yet"
              description="Join communities to connect with people who share your interests!"
              actionLabel="Browse Communities"
              onAction={() => router.push('/(tabs)/communities')}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </>
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
  communityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  coverImage: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  coverPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  communityInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  communityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  description: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
})
