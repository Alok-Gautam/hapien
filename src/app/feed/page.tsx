'use client'

// Force dynamic rendering for Supabase pages
export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AppShell, Header, BottomNav, FloatingActionButton } from '@/components/layout'
import { PostCard, CreatePost } from '@/components/feed'
import { HangoutCard } from '@/components/hangouts/HangoutCard'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { LoadingScreen, PostCardSkeleton } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { PostWithRelations, HangoutWithRelations } from '@/types/database'
import { Calendar, Users, Sparkles } from 'lucide-react'

type FeedFilter = 'all' | 'friends' | 'communities'

export default function FeedPage() {
  const { user, isLoading: authLoading } = useAuth()
  const supabase = createClient()
  
  const [filter, setFilter] = useState<FeedFilter>('all')
  const [posts, setPosts] = useState<PostWithRelations[]>([])
  const [upcomingHangouts, setUpcomingHangouts] = useState<HangoutWithRelations[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  const fetchFeed = useCallback(async () => {
    if (!user) return

    setIsLoading(true)

    try {
      // Fetch posts with user info
      let postsQuery = supabase
        .from('posts')
        .select(`
          *,
          user:users!user_id(*),
          community:communities!community_id(*),
          reactions(*),
          comments(count)
        `)
        .order('created_at', { ascending: false })
        .limit(20)

      // Apply filter
      if (filter === 'friends') {
        // Get friend IDs first
        const { data: friendships } = await supabase
          .from('friendships')
          .select('requester_id, addressee_id')
          .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
          .eq('status', 'accepted')

        const friendIds = (friendships as any[])?.map((f: any) => 
          f.requester_id === user.id ? f.addressee_id : f.requester_id
        ) || []

        if (friendIds.length > 0) {
          postsQuery = postsQuery.in('user_id', friendIds)
        } else {
          setPosts([])
          setIsLoading(false)
          return
        }
      } else if (filter === 'communities') {
        // Get user's community IDs
        const { data: memberships } = await supabase
          .from('community_memberships')
          .select('community_id')
          .eq('user_id', user.id)
          .eq('status', 'approved')

        const communityIds = (memberships as any[])?.map((m: any) => m.community_id) || []

        if (communityIds.length > 0) {
          postsQuery = postsQuery.in('community_id', communityIds)
        } else {
          setPosts([])
          setIsLoading(false)
          return
        }
      }

      const { data: postsData, error: postsError } = await postsQuery

      if (postsError) throw postsError

      // Transform posts
      const transformedPosts: PostWithRelations[] = (postsData || []).map((post: any) => ({
        ...post,
        user: post.user,
        community: post.community,
        reactions: post.reactions || [],
        comments: [],
        reactions_count: post.reactions?.length || 0,
        comments_count: post.comments?.[0]?.count || 0,
      }))

      setPosts(transformedPosts)

      // Fetch upcoming hangouts for "This Week" section
      const today = new Date()
      const nextWeek = new Date(today)
      nextWeek.setDate(today.getDate() + 7)

      const { data: hangoutsData } = await supabase
        .from('hangouts')
        .select(`
          *,
          host:users!host_id(*),
          community:communities!community_id(*),
          rsvps:hangout_rsvps(*, user:users!user_id(*))
        `)
        .gte('date_time', today.toISOString())
        .lte('date_time', nextWeek.toISOString())
        .eq('status', 'upcoming')
        .order('date_time', { ascending: true })
        .limit(5)

      const transformedHangouts: HangoutWithRelations[] = (hangoutsData || []).map((hangout: any) => ({
        ...hangout,
        host: hangout.host,
        community: hangout.community,
        rsvps: hangout.rsvps || [],
        comments: [],
        going_count: hangout.rsvps?.filter((r: any) => r.status === 'going').length || 0,
        interested_count: hangout.rsvps?.filter((r: any) => r.status === 'interested').length || 0,
      }))

      setUpcomingHangouts(transformedHangouts)
    } catch (error) {
      console.error('Error fetching feed:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user, filter, supabase])

  useEffect(() => {
    fetchFeed()
  }, [fetchFeed, refreshKey])

  const handlePostCreated = () => {
    setRefreshKey(k => k + 1)
  }

  if (authLoading) {
    return <LoadingScreen />
  }

  if (!user) {
    return null
  }

  return (
    <AppShell>
      <Header />
      
      <main className="min-h-screen pt-16 pb-24 bg-gradient-to-b from-primary-50/30 via-white to-white">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
          {/* Create Post */}
          <CreatePost onPostCreated={handlePostCreated} />

          {/* This Week in Your Community - Hangouts Strip */}
          {upcomingHangouts.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-secondary-500" />
                <h2 className="text-lg font-display font-semibold text-neutral-100">
                  This Week
                </h2>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                {upcomingHangouts.map((hangout, index) => (
                  <motion.div
                    key={hangout.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="min-w-[280px] flex-shrink-0"
                  >
                    <HangoutCard hangout={hangout} compact />
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* Feed Tabs */}
          <Tabs value={filter} onValueChange={(v) => setFilter(v as FeedFilter)}>
            <TabsList>
              <TabsTrigger value="all">
                <Sparkles className="w-4 h-4 mr-1.5" />
                All
              </TabsTrigger>
              <TabsTrigger value="friends">
                <Users className="w-4 h-4 mr-1.5" />
                Friends
              </TabsTrigger>
              <TabsTrigger value="communities">
                <Users className="w-4 h-4 mr-1.5" />
                Communities
              </TabsTrigger>
            </TabsList>

            <TabsContent value={filter} className="mt-4">
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <PostCardSkeleton key={i} />
                  ))}
                </div>
              ) : posts.length === 0 ? (
                <EmptyState
                  icon={filter === 'friends' ? Users : Sparkles}
                  title={
                    filter === 'friends' 
                      ? "No posts from friends yet"
                      : filter === 'communities'
                      ? "No community posts yet"
                      : "No posts yet"
                  }
                  description={
                    filter === 'friends'
                      ? "Connect with friends to see their updates here"
                      : filter === 'communities'
                      ? "Join communities to see their posts"
                      : "Be the first to share something!"
                  }
                  action={
                    filter !== 'all' ? {
                      label: filter === 'friends' ? "Find Friends" : "Browse Communities",
                      href: filter === 'friends' ? "/profile" : "/communities"
                    } : undefined
                  }
                />
              ) : (
                <AnimatePresence mode="popLayout">
                  <div className="space-y-4">
                    {posts.map((post, index) => (
                      <motion.div
                        key={post.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <PostCard
                          post={post}
                          onReaction={() => setRefreshKey(k => k + 1)}
                        />
                      </motion.div>
                    ))}
                  </div>
                </AnimatePresence>
              )}
            </TabsContent>
          </Tabs>

          {/* Friend Nudge */}
          {!isLoading && posts.length > 0 && Math.random() > 0.7 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-r from-secondary-100 to-secondary-50 rounded-2xl p-4 border border-secondary-200"
            >
              <p className="text-secondary-800 font-medium">
                🌟 You haven&apos;t seen your friend in a while! 
              </p>
              <p className="text-secondary-600 text-sm mt-1">
                Why not host a hangout and catch up?
              </p>
            </motion.div>
          )}
        </div>
      </main>

      <FloatingActionButton />
      <BottomNav />
    </AppShell>
  )
}
