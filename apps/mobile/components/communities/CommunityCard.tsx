import React from 'react'
import { View, Text, StyleSheet, Image } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Card, Badge, Button } from '../ui'

interface CommunityCardProps {
  community: {
    id: string
    name: string
    description: string | null
    cover_image_url: string | null
    location: { city?: string; address?: string } | null
    member_count: number
    is_member: boolean
  }
  onPress?: () => void
  onJoin?: () => void
  onLeave?: () => void
}

export function CommunityCard({
  community,
  onPress,
  onJoin,
  onLeave,
}: CommunityCardProps) {
  const formatLocation = (location: { city?: string; address?: string } | null) => {
    if (!location) return null
    const parts = []
    if (location.address) parts.push(location.address)
    if (location.city) parts.push(location.city)
    return parts.join(', ')
  }

  const locationText = formatLocation(community.location)

  return (
    <Card style={styles.card} variant="elevated" onPress={onPress}>
      {community.cover_image_url ? (
        <Image
          source={{ uri: community.cover_image_url }}
          style={styles.coverImage}
        />
      ) : (
        <View style={styles.coverPlaceholder}>
          <Ionicons name="people" size={32} color="#9CA3AF" />
        </View>
      )}

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>
            {community.name}
          </Text>
          {community.is_member && (
            <Badge label="Member" variant="primary" size="sm" />
          )}
        </View>

        {community.description && (
          <Text style={styles.description} numberOfLines={2}>
            {community.description}
          </Text>
        )}

        <View style={styles.meta}>
          {locationText && (
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={14} color="#6B7280" />
              <Text style={styles.metaText} numberOfLines={1}>
                {locationText}
              </Text>
            </View>
          )}
          <View style={styles.metaItem}>
            <Ionicons name="people-outline" size={14} color="#6B7280" />
            <Text style={styles.metaText}>
              {community.member_count} members
            </Text>
          </View>
        </View>

        {community.is_member ? (
          <Button
            title="Joined"
            variant="secondary"
            size="sm"
            onPress={onLeave ?? (() => {})}
            style={styles.button}
          />
        ) : (
          <Button
            title="Join"
            variant="primary"
            size="sm"
            onPress={onJoin ?? (() => {})}
            style={styles.button}
          />
        )}
      </View>
    </Card>
  )
}

const styles = StyleSheet.create({
  card: {
    padding: 0,
    overflow: 'hidden',
    marginBottom: 12,
  },
  coverImage: {
    width: '100%',
    height: 100,
    backgroundColor: '#E5E7EB',
  },
  coverPlaceholder: {
    width: '100%',
    height: 100,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 4,
  },
  button: {
    alignSelf: 'flex-start',
  },
})
