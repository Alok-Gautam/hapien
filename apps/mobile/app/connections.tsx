import React, { useState, useEffect, useCallback } from 'react'
import { StyleSheet, View, FlatList, RefreshControl, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, router } from 'expo-router'
import { supabase } from '../lib/supabase'
import { useAuthContext } from '../contexts/AuthContext'
import { LoadingSpinner, EmptyState, Card, Avatar } from '../components/ui'

interface Connection {
  id: string
  name: string | null
  avatar_url: string | null
  bio: string | null
}

export default function ConnectionsScreen() {
  const { user } = useAuthContext()
  const [connections, setConnections] = useState<Connection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchConnections = useCallback(async () => {
    if (!user) return

    try {
      // Fetch connections (accepted friendships)
      const { data: friendships, error: friendshipsError } = await supabase
        .from('friendships')
        .select('requester_id, addressee_id')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .eq('status', 'accepted')

      if (friendshipsError) throw friendshipsError

      // Get connection IDs (the other person in each friendship)
      const connectionIds = friendships?.map((f) =>
        f.requester_id === user.id ? f.addressee_id : f.requester_id
      ) || []

      if (connectionIds.length === 0) {
        setConnections([])
        return
      }

      // Fetch connection profiles
      const { data: connectionsData, error: connectionsError } = await supabase
        .from('users')
        .select('id, name, avatar_url, bio')
        .in('id', connectionIds)

      if (connectionsError) throw connectionsError

      setConnections(connectionsData || [])
    } catch (error) {
      console.error('Error fetching connections:', error)
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }, [user])

  useEffect(() => {
    fetchConnections()
  }, [fetchConnections])

  const onRefresh = () => {
    setRefreshing(true)
    fetchConnections()
  }

  const renderConnection = ({ item }: { item: Connection }) => (
    <Card
      style={styles.connectionCard}
      variant="elevated"
      onPress={() => router.push(`/profile/${item.id}` as any)}
    >
      <View style={styles.connectionContent}>
        <Avatar uri={item.avatar_url} name={item.name} size="md" />
        <View style={styles.connectionInfo}>
          <Text style={styles.connectionName}>{item.name || 'User'}</Text>
          {item.bio && (
            <Text style={styles.connectionBio} numberOfLines={1}>
              {item.bio}
            </Text>
          )}
        </View>
      </View>
    </Card>
  )

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading connections..." />
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Connections',
          headerShown: true,
        }}
      />
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <FlatList
          data={connections}
          renderItem={renderConnection}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
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
              title="No connections yet"
              description="Start connecting with people by joining communities and hangouts."
            />
          }
        />
      </SafeAreaView>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  list: {
    padding: 16,
    flexGrow: 1,
  },
  connectionCard: {
    marginBottom: 12,
  },
  connectionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectionInfo: {
    marginLeft: 12,
    flex: 1,
  },
  connectionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  connectionBio: {
    fontSize: 14,
    color: '#6B7280',
  },
})
