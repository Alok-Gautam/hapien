import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Avatar, Card } from '../ui'
import { formatRelativeTime } from '@hapien/shared/utils'
import { REACTION_TYPES } from '@hapien/shared/constants'

interface PostCardProps {
  post: {
    id: string
    content: string
    media_urls?: string[] | null
    created_at: string
    user: {
      id: string
      name: string | null
      avatar_url: string | null
    }
    reactions_count: number
    comments_count: number
    user_reaction?: string | null
  }
  onPress?: () => void
  onReact?: (reactionType: string) => void
  onComment?: () => void
  onUserPress?: (userId: string) => void
}

export function PostCard({
  post,
  onPress,
  onReact,
  onComment,
  onUserPress,
}: PostCardProps) {
  const [showReactions, setShowReactions] = useState(false)

  const handleReactionPress = () => {
    if (post.user_reaction) {
      onReact?.('')
    } else {
      setShowReactions(!showReactions)
    }
  }

  const handleSelectReaction = (reactionId: string) => {
    onReact?.(reactionId)
    setShowReactions(false)
  }

  return (
    <Card style={styles.card} variant="elevated">
      <TouchableOpacity
        style={styles.header}
        onPress={() => onUserPress?.(post.user.id)}
      >
        <Avatar
          uri={post.user.avatar_url}
          name={post.user.name}
          size="md"
        />
        <View style={styles.headerText}>
          <Text style={styles.userName}>{post.user.name || 'User'}</Text>
          <Text style={styles.timestamp}>
            {formatRelativeTime(post.created_at)}
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
        <Text style={styles.content}>{post.content}</Text>

        {post.media_urls && post.media_urls.length > 0 && (
          <Image source={{ uri: post.media_urls[0] }} style={styles.media} />
        )}
      </TouchableOpacity>

      <View style={styles.stats}>
        {post.reactions_count > 0 && (
          <Text style={styles.statText}>{post.reactions_count} reactions</Text>
        )}
        {post.comments_count > 0 && (
          <Text style={styles.statText}>{post.comments_count} comments</Text>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleReactionPress}
          onLongPress={() => setShowReactions(true)}
        >
          <Ionicons
            name={post.user_reaction ? 'heart' : 'heart-outline'}
            size={22}
            color={post.user_reaction ? '#EF4444' : '#6B7280'}
          />
          <Text
            style={[
              styles.actionText,
              post.user_reaction && styles.actionTextActive,
            ]}
          >
            Like
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={onComment}>
          <Ionicons name="chatbubble-outline" size={22} color="#6B7280" />
          <Text style={styles.actionText}>Comment</Text>
        </TouchableOpacity>
      </View>

      {showReactions && (
        <View style={styles.reactionPicker}>
          {REACTION_TYPES.map((reaction) => (
            <TouchableOpacity
              key={reaction.id}
              style={styles.reactionOption}
              onPress={() => handleSelectReaction(reaction.id)}
            >
              <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </Card>
  )
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerText: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  timestamp: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  content: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
  media: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginTop: 12,
    backgroundColor: '#E5E7EB',
  },
  stats: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 16,
  },
  statText: {
    fontSize: 13,
    color: '#6B7280',
  },
  actions: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  actionText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  actionTextActive: {
    color: '#EF4444',
  },
  reactionPicker: {
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 8,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  reactionOption: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  reactionEmoji: {
    fontSize: 24,
  },
})
