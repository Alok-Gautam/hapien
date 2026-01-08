import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Avatar, Card, Badge, Button } from '../ui'
import { formatDateTime } from '@hapien/shared/utils'
import { HANGOUT_CATEGORIES } from '@hapien/shared/constants'

interface HangoutCardProps {
  hangout: {
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
    user_rsvp?: string | null
  }
  onPress?: () => void
  onRsvp?: (status: 'going' | 'interested') => void
}

export function HangoutCard({ hangout, onPress, onRsvp }: HangoutCardProps) {
  const category = HANGOUT_CATEGORIES.find((c) => c.id === hangout.category)

  const formatLocation = (location: { city?: string; address?: string } | null) => {
    if (!location) return null
    const parts = []
    if (location.address) parts.push(location.address)
    if (location.city) parts.push(location.city)
    return parts.join(', ')
  }

  const locationText = formatLocation(hangout.location)

  return (
    <Card style={styles.card} variant="elevated" onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryEmoji}>{category?.emoji || '📅'}</Text>
          <Text style={styles.categoryLabel}>{category?.label || 'Event'}</Text>
        </View>
        {hangout.user_rsvp && (
          <Badge
            label={hangout.user_rsvp === 'going' ? 'Going' : 'Interested'}
            variant={hangout.user_rsvp === 'going' ? 'success' : 'primary'}
            size="sm"
          />
        )}
      </View>

      <Text style={styles.title}>{hangout.title}</Text>

      {hangout.description && (
        <Text style={styles.description} numberOfLines={2}>
          {hangout.description}
        </Text>
      )}

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color="#6B7280" />
          <Text style={styles.detailText}>
            {formatDateTime(hangout.date_time)}
          </Text>
        </View>

        {locationText && (
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={16} color="#6B7280" />
            <Text style={styles.detailText} numberOfLines={1}>
              {locationText}
            </Text>
          </View>
        )}

        <View style={styles.detailRow}>
          <Ionicons name="people-outline" size={16} color="#6B7280" />
          <Text style={styles.detailText}>
            {hangout.rsvp_count} going
            {hangout.max_participants && ` / ${hangout.max_participants} spots`}
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.hostInfo}>
          <Avatar
            uri={hangout.host.avatar_url}
            name={hangout.host.name}
            size="sm"
          />
          <Text style={styles.hostName}>
            Hosted by {hangout.host.name || 'User'}
          </Text>
        </TouchableOpacity>

        {!hangout.user_rsvp && (
          <View style={styles.rsvpButtons}>
            <Button
              title="Interested"
              variant="outline"
              size="sm"
              onPress={() => onRsvp?.('interested')}
            />
            <Button
              title="Going"
              variant="primary"
              size="sm"
              onPress={() => onRsvp?.('going')}
              style={styles.goingButton}
            />
          </View>
        )}
      </View>
    </Card>
  )
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 100,
  },
  categoryEmoji: {
    fontSize: 14,
    marginRight: 4,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  details: {
    gap: 8,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  hostInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  hostName: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 8,
  },
  rsvpButtons: {
    flexDirection: 'row',
  },
  goingButton: {
    marginLeft: 8,
  },
})
