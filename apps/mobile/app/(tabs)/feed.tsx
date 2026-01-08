import React, { useState, useEffect, useCallback } from 'react'
import { StyleSheet, View, FlatList, RefreshControl, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { useAuthContext } from '../../contexts/AuthContext'
import { PostCard } from '../../components/feed/PostCard'
import { CreatePostButton } from '../../components/feed/CreatePostButton'
import { LoadingSpinner, EmptyState } from '../../components/ui'

interface Post {
  id: string
  content: string
  media_urls: string[] | null
  created_at: string
  user_id: string
  user: {
    id: string
    name: string | null
    avatar_url: string | null
  }
  reactions_count: number
  comments_count: number
  user_reaction: string | null
}

export default function FeedScreen() {
  const { user, isAuthenticated } = useAuthContext()
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchPosts = useCallback(async () => {
    if (!user) return

    try {
      // Get user's connections
      const { data: connections } = await supabase
        .from('friendships')
        .select('requester_id, addressee_id')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .eq('status', 'accepted')

      const connectionIds = connections?.map((c) =>
        c.requester_id === user.id ? c.addressee_id : c.requester_id
      ) || []

      // Include user's own posts
      const userIds = [user.id, ...connectionIds]

      // Fetch posts from connections and self
      const { data: postsData, error } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          media_urls,
          created_at,
          user_id,
          users!posts_user_id_fkey (
            id,
            name,
            avatar_url
          )
        `)
        .in('user_id', userIds)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      // Get reaction counts and user reactions
      const postsWithMeta = await Promise.all(
        (postsData || []).map(async (post) => {
          const [reactionsResult, commentsResult, userReactionResult] = await Promise.all([
            supabase
              .from('reactions')
              .select('id', { count: 'exact', head: true })
              .eq('post_id', post.id),
            supabase
              .from('comments')
              .select('id', { count: 'exact', head: true })
              .eq('post_id', post.id),
            supabase
              .from('reactions')
              .select('reaction_type')
              .eq('post_id', post.id)
              .eq('user_id', user.id)
              .single(),
          ])

          return {
            ...post,
            user: post.users as any,
            reactions_count: reactionsResult.count || 0,
            comments_count: commentsResult.count || 0,
            user_reaction: userReactionResult.data?.reaction_type || null,
          }
        })
      )

      setPosts(postsWithMeta)
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (isAuthenticated) {
      fetchPosts()
    }
  }, [isAuthenticated, fetchPosts])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchPosts()
    setRefreshing(false)
  }, [fetchPosts])

  const handleReaction = async (postId: string, reactionType: string) => {
    if (!user) return

    try {
      if (reactionType) {
        // Add or update reaction
        await supabase.from('reactions').upsert({
          post_id: postId,
          user_id: user.id,
          reaction_type: reactionType,
        })
      } else {
        // Remove reaction
        await supabase
          .from('reactions')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id)
      }

      // Update local state
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                user_reaction: reactionType || null,
                reactions_count: reactionType
                  ? post.reactions_count + (post.user_reaction ? 0 : 1)
                  : post.reactions_count - 1,
              }
            : post
        )
      )
    } catch (error) {
      console.error('Error toggling reaction:', error)
    }
  }

  const handleCreatePost = () => {
    router.push('/create-post')
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          icon="log-in-outline"
          title="Sign in to see your feed"
          description="Connect with people and see what they're up to."
          actionLabel="Sign In"
          onAction={() => router.replace('/(auth)/login')}
        />
      </SafeAreaView>
    )
  }

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading feed..." />
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onReact={(type) => handleReaction(item.id, type)}
            onComment={() => router.push(`/post/${item.id}` as any)}
            onUserPress={(userId) => router.push(`/profile/${userId}` as any)}
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
            icon="newspaper-outline"
            title="No posts yet"
            description="Add connections or join communities to see posts in your feed."
          />
        }
        showsVerticalScrollIndicator={false}
      />
      <CreatePostButton onPress={handleCreatePost} />
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
