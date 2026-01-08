import React, { useState, useEffect, useCallback } from 'react'
import {
  StyleSheet,
  View,
  FlatList,
  RefreshControl,
  TextInput,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../../lib/supabase'
import { useAuthContext } from '../../contexts/AuthContext'
import { CommunityCard } from '../../components/communities/CommunityCard'
import { LoadingSpinner, EmptyState } from '../../components/ui'

interface Community {
  id: string
  name: string
  description: string | null
  cover_image_url: string | null
  location: { city?: string; address?: string } | null
  member_count: number
  is_member: boolean
}

export default function CommunitiesScreen() {
  const { user } = useAuthContext()
  const [communities, setCommunities] = useState<Community[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const fetchCommunities = useCallback(async () => {
    try {
      let query = supabase
        .from('communities')
        .select('id, name, description, cover_image_url, location')
        .order('created_at', { ascending: false })
        .limit(50)

      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`)
      }

      const { data: communitiesData, error } = await query

      if (error) throw error

      // Get member counts and user membership status
      const communitiesWithMeta = await Promise.all(
        (communitiesData || []).map(async (community) => {
          const [memberCountResult, isMemberResult] = await Promise.all([
            supabase
              .from('community_memberships')
              .select('id', { count: 'exact', head: true })
              .eq('community_id', community.id),
            user
              ? supabase
                  .from('community_memberships')
                  .select('id')
                  .eq('community_id', community.id)
                  .eq('user_id', user.id)
                  .single()
              : Promise.resolve({ data: null }),
          ])

          return {
            ...community,
            member_count: memberCountResult.count || 0,
            is_member: !!isMemberResult.data,
          }
        })
      )

      setCommunities(communitiesWithMeta)
    } catch (error) {
      console.error('Error fetching communities:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user, searchQuery])

  useEffect(() => {
    fetchCommunities()
  }, [fetchCommunities])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchCommunities()
    setRefreshing(false)
  }, [fetchCommunities])

  const handleJoin = async (communityId: string) => {
    if (!user) {
      router.push('/(auth)/login')
      return
    }

    try {
      await supabase.from('community_memberships').insert({
        community_id: communityId,
        user_id: user.id,
        role: 'member',
      })

      setCommunities((prev) =>
        prev.map((c) =>
          c.id === communityId
            ? { ...c, is_member: true, member_count: c.member_count + 1 }
            : c
        )
      )
    } catch (error) {
      console.error('Error joining community:', error)
    }
  }

  const handleLeave = async (communityId: string) => {
    if (!user) return

    try {
      await supabase
        .from('community_memberships')
        .delete()
        .eq('community_id', communityId)
        .eq('user_id', user.id)

      setCommunities((prev) =>
        prev.map((c) =>
          c.id === communityId
            ? { ...c, is_member: false, member_count: c.member_count - 1 }
            : c
        )
      )
    } catch (error) {
      console.error('Error leaving community:', error)
    }
  }

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading communities..." />
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color="#9CA3AF"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search communities..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          onSubmitEditing={fetchCommunities}
        />
      </View>

      <FlatList
        data={communities}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CommunityCard
            community={item}
            onPress={() => router.push(`/community/${item.id}`)}
            onJoin={() => handleJoin(item.id)}
            onLeave={() => handleLeave(item.id)}
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
            icon="people-outline"
            title="No communities found"
            description={
              searchQuery
                ? 'Try a different search term'
                : 'Be the first to create a community!'
            }
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  listContent: {
    flexGrow: 1,
    padding: 16,
    paddingTop: 4,
  },
})
