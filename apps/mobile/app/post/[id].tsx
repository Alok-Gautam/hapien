import React, { useState, useEffect, useCallback } from 'react'
import {
  StyleSheet,
  View,
  Text,
  Image,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, useLocalSearchParams, router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../../lib/supabase'
import { useAuthContext } from '../../contexts/AuthContext'
import { LoadingSpinner, Avatar, Button } from '../../components/ui'

interface PostDetail {
  id: string
  content: string | null
  media_urls: string[] | null
  created_at: string
  user_id: string
  user: {
    id: string
    name: string | null
    avatar_url: string | null
  }
  reactions_count: number
  comments: Comment[]
  user_reaction: string | null
}

interface Comment {
  id: string
  content: string
  created_at: string
  user: {
    id: string
    name: string | null
    avatar_url: string | null
  }
}

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuthContext()
  const [post, setPost] = useState<PostDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [commentText, setCommentText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchPost = useCallback(async () => {
    if (!id) return

    try {
      const { data: postData, error } = await supabase
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
        .eq('id', id)
        .single()

      if (error) throw error

      // Fetch comments, reactions count, and user reaction
      const [commentsResult, reactionsResult, userReactionResult] = await Promise.all([
        supabase
          .from('comments')
          .select(`
            id,
            content,
            created_at,
            users!comments_user_id_fkey (
              id,
              name,
              avatar_url
            )
          `)
          .eq('post_id', id)
          .order('created_at', { ascending: true }),
        supabase
          .from('reactions')
          .select('id', { count: 'exact', head: true })
          .eq('post_id', id),
        user
          ? supabase
              .from('reactions')
              .select('type')
              .eq('post_id', id)
              .eq('user_id', user.id)
              .single()
          : Promise.resolve({ data: null }),
      ])

      const comments = (commentsResult.data || []).map((c: any) => ({
        ...c,
        user: c.users,
      }))

      setPost({
        ...postData,
        user: postData.users as any,
        reactions_count: reactionsResult.count || 0,
        comments,
        user_reaction: userReactionResult.data?.type || null,
      })
    } catch (error) {
      console.error('Error fetching post:', error)
    } finally {
      setIsLoading(false)
    }
  }, [id, user])

  useEffect(() => {
    fetchPost()
  }, [fetchPost])

  const handleReaction = async () => {
    if (!user || !post) return

    try {
      if (post.user_reaction) {
        // Remove reaction
        await supabase
          .from('reactions')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id)

        setPost({
          ...post,
          user_reaction: null,
          reactions_count: post.reactions_count - 1,
        })
      } else {
        // Add reaction
        await supabase.from('reactions').upsert({
          post_id: post.id,
          user_id: user.id,
          type: 'like',
        })

        setPost({
          ...post,
          user_reaction: 'like',
          reactions_count: post.reactions_count + 1,
        })
      }
    } catch (error) {
      console.error('Error toggling reaction:', error)
    }
  }

  const handleSubmitComment = async () => {
    if (!user || !post || !commentText.trim()) return

    setIsSubmitting(true)
    try {
      const { data: newComment, error } = await supabase
        .from('comments')
        .insert({
          post_id: post.id,
          user_id: user.id,
          content: commentText.trim(),
        })
        .select(`
          id,
          content,
          created_at,
          users!comments_user_id_fkey (
            id,
            name,
            avatar_url
          )
        `)
        .single()

      if (error) throw error

      setPost({
        ...post,
        comments: [
          ...post.comments,
          {
            ...newComment,
            user: newComment.users as any,
          },
        ],
      })
      setCommentText('')
    } catch (error) {
      console.error('Error submitting comment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading post..." />
  }

  if (!post) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Post not found</Text>
      </SafeAreaView>
    )
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Post',
          headerShown: true,
        }}
      />
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={100}
        >
          <ScrollView style={styles.scrollView}>
            {/* Post Content */}
            <View style={styles.postContainer}>
              <TouchableOpacity
                style={styles.userRow}
                onPress={() => router.push(`/profile/${post.user.id}` as any)}
              >
                <Avatar
                  uri={post.user.avatar_url}
                  name={post.user.name}
                  size="md"
                />
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{post.user.name || 'User'}</Text>
                  <Text style={styles.timestamp}>{formatDate(post.created_at)}</Text>
                </View>
              </TouchableOpacity>

              {post.content && (
                <Text style={styles.content}>{post.content}</Text>
              )}

              {post.media_urls && post.media_urls.length > 0 && (
                <Image
                  source={{ uri: post.media_urls[0] }}
                  style={styles.mediaImage}
                  resizeMode="cover"
                />
              )}

              {/* Actions */}
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleReaction}
                >
                  <Ionicons
                    name={post.user_reaction ? 'heart' : 'heart-outline'}
                    size={24}
                    color={post.user_reaction ? '#EF4444' : '#6B7280'}
                  />
                  <Text style={styles.actionText}>{post.reactions_count}</Text>
                </TouchableOpacity>
                <View style={styles.actionButton}>
                  <Ionicons name="chatbubble-outline" size={24} color="#6B7280" />
                  <Text style={styles.actionText}>{post.comments.length}</Text>
                </View>
              </View>
            </View>

            {/* Comments */}
            <View style={styles.commentsSection}>
              <Text style={styles.commentsHeader}>Comments</Text>
              {post.comments.length === 0 ? (
                <Text style={styles.noComments}>No comments yet. Be the first!</Text>
              ) : (
                post.comments.map((comment) => (
                  <View key={comment.id} style={styles.commentItem}>
                    <TouchableOpacity
                      onPress={() => router.push(`/profile/${comment.user.id}` as any)}
                    >
                      <Avatar
                        uri={comment.user.avatar_url}
                        name={comment.user.name}
                        size="sm"
                      />
                    </TouchableOpacity>
                    <View style={styles.commentContent}>
                      <Text style={styles.commentUserName}>
                        {comment.user.name || 'User'}
                      </Text>
                      <Text style={styles.commentText}>{comment.content}</Text>
                      <Text style={styles.commentTimestamp}>
                        {formatDate(comment.created_at)}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </ScrollView>

          {/* Comment Input */}
          {user && (
            <View style={styles.commentInputContainer}>
              <TextInput
                style={styles.commentInput}
                placeholder="Write a comment..."
                placeholderTextColor="#9CA3AF"
                value={commentText}
                onChangeText={setCommentText}
                multiline
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!commentText.trim() || isSubmitting) && styles.sendButtonDisabled,
                ]}
                onPress={handleSubmitComment}
                disabled={!commentText.trim() || isSubmitting}
              >
                <Ionicons
                  name="send"
                  size={20}
                  color={commentText.trim() && !isSubmitting ? '#7C3AED' : '#9CA3AF'}
                />
              </TouchableOpacity>
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 40,
  },
  postContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  timestamp: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
  content: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 12,
  },
  mediaImage: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#E5E7EB',
  },
  actions: {
    flexDirection: 'row',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  actionText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
  },
  commentsSection: {
    padding: 16,
  },
  commentsHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  noComments: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  commentContent: {
    flex: 1,
    marginLeft: 12,
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 12,
  },
  commentUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  commentTimestamp: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111827',
    maxHeight: 100,
  },
  sendButton: {
    marginLeft: 8,
    padding: 10,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
})
