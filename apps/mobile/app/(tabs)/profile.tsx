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
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../../lib/supabase'
import { useAuthContext } from '../../contexts/AuthContext'
import { Avatar, Button, Card, LoadingSpinner, EmptyState } from '../../components/ui'
import { getLevelFromXP, getXPForNextLevel } from '@hapien/shared/constants'

interface UserProfile {
  id: string
  name: string | null
  avatar_url: string | null
  bio: string | null
  xp: number
  connections_count: number
  hangouts_count: number
  communities_count: number
}

export default function ProfileScreen() {
  const { user, isAuthenticated, signOut } = useAuthContext()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setIsLoading(false)
      return
    }

    try {
      // Fetch user profile
      const { data: userData, error } = await supabase
        .from('users')
        .select('id, name, avatar_url, bio')
        .eq('id', user.id)
        .single()

      if (error) throw error

      // Fetch counts in parallel
      const [connectionsResult, hangoutsResult, communitiesResult] = await Promise.all([
        supabase
          .from('friendships')
          .select('id', { count: 'exact', head: true })
          .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
          .eq('status', 'accepted'),
        supabase
          .from('hangout_rsvps')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'going'),
        supabase
          .from('community_memberships')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
      ])

      setProfile({
        ...userData,
        xp: 0, // XP system not implemented yet
        connections_count: connectionsResult.count || 0,
        hangouts_count: hangoutsResult.count || 0,
        communities_count: communitiesResult.count || 0,
      })
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (isAuthenticated) {
      fetchProfile()
    } else {
      setIsLoading(false)
    }
  }, [isAuthenticated, fetchProfile])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchProfile()
    setRefreshing(false)
  }, [fetchProfile])

  const handleSignOut = async () => {
    try {
      await signOut()
      router.replace('/(auth)/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          icon="person-outline"
          title="Sign in to view your profile"
          description="Track your progress, view your stats, and manage your account."
          actionLabel="Sign In"
          onAction={() => router.replace('/(auth)/login')}
        />
      </SafeAreaView>
    )
  }

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading profile..." />
  }

  const level = profile ? getLevelFromXP(profile.xp) : 1
  const xpForNext = profile ? getXPForNextLevel(profile.xp) : 100

  return (
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
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Settings */}
        <View style={styles.header}>
          <View style={{ width: 40 }} />
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity
            onPress={() => router.push('/settings')}
            style={styles.settingsButton}
          >
            <Ionicons name="settings-outline" size={24} color="#111827" />
          </TouchableOpacity>
        </View>

        {/* Profile Info */}
        <View style={styles.profileSection}>
          <Avatar
            uri={profile?.avatar_url}
            name={profile?.name}
            size="xl"
          />
          <Text style={styles.displayName}>
            {profile?.name || 'User'}
          </Text>
          {profile?.bio && <Text style={styles.bio}>{profile.bio}</Text>}
          <Button
            title="Edit Profile"
            variant="outline"
            size="sm"
            onPress={() => router.push('/edit-profile')}
            style={styles.editButton}
          />
        </View>

        {/* Level Card */}
        <Card style={styles.levelCard} variant="elevated">
          <View style={styles.levelHeader}>
            <View style={styles.levelBadge}>
              <Text style={styles.levelNumber}>{level}</Text>
            </View>
            <View style={styles.levelInfo}>
              <Text style={styles.levelTitle}>Level {level}</Text>
              <Text style={styles.xpText}>
                {profile?.xp || 0} XP total
              </Text>
            </View>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(
                    ((profile?.xp || 0) / ((profile?.xp || 0) + xpForNext)) * 100,
                    100
                  )}%`,
                },
              ]}
            />
          </View>
          <Text style={styles.xpNeeded}>
            {xpForNext > 0 ? `${xpForNext} XP to next level` : 'Max level reached!'}
          </Text>
        </Card>

        {/* Stats */}
        <Card style={styles.statsCard} variant="elevated">
          <View style={styles.statsRow}>
            <TouchableOpacity
              style={styles.statItem}
              onPress={() => router.push('/connections' as any)}
            >
              <Text style={styles.statValue}>{profile?.connections_count || 0}</Text>
              <Text style={styles.statLabel}>Connections</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity
              style={styles.statItem}
              onPress={() => router.push('/my-hangouts')}
            >
              <Text style={styles.statValue}>{profile?.hangouts_count || 0}</Text>
              <Text style={styles.statLabel}>Hangouts</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity
              style={styles.statItem}
              onPress={() => router.push('/my-communities' as any)}
            >
              <Text style={styles.statValue}>{profile?.communities_count || 0}</Text>
              <Text style={styles.statLabel}>Communities</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Menu Items */}
        <Card style={styles.menuCard}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/connections' as any)}
          >
            <Ionicons name="people-outline" size={22} color="#6B7280" />
            <Text style={styles.menuText}>Connections</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/my-hangouts')}
          >
            <Ionicons name="calendar-outline" size={22} color="#6B7280" />
            <Text style={styles.menuText}>My Hangouts</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/my-communities' as any)}
          >
            <Ionicons name="globe-outline" size={22} color="#6B7280" />
            <Text style={styles.menuText}>My Communities</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, styles.menuItemLast]}
            onPress={() => router.push('/settings')}
          >
            <Ionicons name="settings-outline" size={22} color="#6B7280" />
            <Text style={styles.menuText}>Settings</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </Card>

        {/* Sign Out */}
        <Button
          title="Sign Out"
          variant="ghost"
          onPress={handleSignOut}
          style={styles.signOutButton}
          textStyle={styles.signOutText}
        />
      </ScrollView>
    </SafeAreaView>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  settingsButton: {
    padding: 8,
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
  },
  editButton: {
    marginTop: 16,
  },
  levelCard: {
    marginBottom: 16,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  levelBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  levelInfo: {
    marginLeft: 12,
  },
  levelTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  xpText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#7C3AED',
    borderRadius: 4,
  },
  xpNeeded: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
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
  menuCard: {
    marginBottom: 16,
    paddingVertical: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    marginLeft: 12,
  },
  signOutButton: {
    marginTop: 8,
    marginBottom: 32,
  },
  signOutText: {
    color: '#EF4444',
  },
})
