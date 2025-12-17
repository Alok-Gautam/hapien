'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Sparkles, User, UserPlus, Check, X } from 'lucide-react'
import { AppShell } from '@/components/layout'
import { useAuth } from '@/hooks/useAuth'
import { Avatar, Button, Card } from '@/components/ui'
import { getGreeting } from '@/utils/helpers'
import toast from 'react-hot-toast'
import Link from 'next/link'
import {
  getPendingFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  FriendRequestWithUser
} from '@/app/actions/friends'
import { getWallFeed, getFeedHangouts } from '@/app/actions/wall'
import { CreatePost } from '@/components/feed/CreatePost'
import { PostCard } from '@/components/feed/PostCard'
import { HangoutCard } from '@/components/hangouts/HangoutCard'
import { PostCardSkeleton } from '@/components/ui/Loading'
import { WallPostWithRelations, HangoutWithRelations } from '@/types/database'

export default function FeedPage() {
  const router = useRouter()
  const { authUser, user, isLoading: authLoading } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [friendRequests, setFriendRequests] = useState<FriendRequestWithUser[]>([])
  const [posts, setPosts] = useState<WallPostWithRelations[]>([])
  const [hangouts, setHangouts] = useState<HangoutWithRelations[]>([])
  const [loadingRequests, setLoadingRequests] = useState(true)
  const [loadingFeed, setLoadingFeed] = useState(true)
  const [processingRequest, setProcessingRequest] = useState<string | null>(null)

  const fetchFriendRequests = useCallback(async () => {
    try {
      const requests = await getPendingFriendRequests()
      setFriendRequests(requests)
    } catch (err) {
      console.error('Error fetching friend requests:', err)
    } finally {
      setLoadingRequests(false)
    }
  }, [])

  const fetchFeed = useCallback(async () => {
    setLoadingFeed(true)
    try {
      const [postsData, hangoutsData] = await Promise.all([
        getWallFeed(),
        getFeedHangouts()
      ])
      setPosts(postsData)
      setHangouts(hangoutsData)
    } catch (err) {
      console.error('Error fetching feed:', err)
    } finally {
      setLoadingFeed(false)
    }
  }, [])

  useEffect(() => {
    if (authUser && user?.name) {
      fetchFriendRequests()
      fetchFeed()
    }
  }, [authUser, user?.name, fetchFriendRequests, fetchFeed])

  const handlePostCreated = () => {
    fetchFeed()
  }

  const handleRsvpChange = () => {
    fetchFeed()
  }

  const handleAccept = async (requestId: string, requesterName: string) => {
    setProcessingRequest(requestId)
    try {
      await acceptFriendRequest(requestId)
      toast.success(`You are now connected with ${requesterName}!`)
      setFriendRequests(prev => prev.filter(r => r.id !== requestId))
    } catch (err) {
      toast.error('Failed to accept request')
    } finally {
      setProcessingRequest(null)
    }
  }

  const handleReject = async (requestId: string) => {
    setProcessingRequest(requestId)
    try {
      await rejectFriendRequest(requestId)
      toast.success('Request declined')
      setFriendRequests(prev => prev.filter(r => r.id !== requestId))
    } catch (err) {
      toast.error('Failed to decline request')
    } finally {
      setProcessingRequest(null)
    }
  }

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-violet-500 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-stone-50 mb-2">
            Loading your feed...
          </h2>
          <p className="text-stone-500">
            Please wait a moment
          </p>
        </div>
      </div>
    )
  }

  // Show message if not logged in
  if (!authUser) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center p-4">
        <Card variant="elevated" className="max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-violet-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-violet-400" />
          </div>
          <h2 className="text-xl font-bold text-stone-50 mb-2">
            Login Required
          </h2>
          <p className="text-stone-500 mb-6">
            You need to be logged in to see your feed. Please log in or explore our communities.
          </p>
          <div className="flex gap-3">
            <Link href="/" className="flex-1">
              <Button variant="secondary" className="w-full">
                Go Home
              </Button>
            </Link>
            <Link href="/auth/login" className="flex-1">
              <Button className="w-full">
                Log In
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  // Show message if profile incomplete
  if (!user?.name) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center p-4">
        <Card variant="elevated" className="max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-violet-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-violet-400" />
          </div>
          <h2 className="text-xl font-bold text-stone-50 mb-2">
            Complete Your Profile
          </h2>
          <p className="text-stone-500 mb-6">
            Before you can access your feed, please complete your profile setup. This will only take a moment!
          </p>
          <div className="flex gap-3">
            <Link href="/" className="flex-1">
              <Button variant="secondary" className="w-full">
                Go Home
              </Button>
            </Link>
            <Link href="/onboarding" className="flex-1">
              <Button className="w-full">
                Complete Profile
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  // Show error if any
  if (error) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center p-4">
        <Card variant="elevated" className="max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-rose-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-stone-50 mb-2">
            Something went wrong
          </h2>
          <p className="text-stone-500 mb-6">
            {error}
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => router.push('/')}
            >
              Go Home
            </Button>
            <Button
              className="flex-1"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  const greeting = getGreeting()

  // Main feed content
  return (
    <AppShell>
      <main className="min-h-screen pt-16 pb-24 bg-stone-900">
        <div className="max-w-2xl mx-auto px-4 py-6">
          {/* Greeting */}
          <div className="mb-6">
            <p className="text-stone-500 text-sm">{greeting}, {user?.name?.split(' ')[0]}</p>
            <h1 className="font-display text-2xl font-bold text-stone-50">
              What brings you joy today?
            </h1>
          </div>

          {/* Friend Requests Section */}
          {!loadingRequests && friendRequests.length > 0 && (
            <Card variant="elevated" className="p-4 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-violet-500/20 rounded-full flex items-center justify-center">
                  <UserPlus className="w-4 h-4 text-violet-400" />
                </div>
                <h2 className="font-semibold text-stone-50">
                  Connect Requests ({friendRequests.length})
                </h2>
              </div>
              <div className="space-y-3">
                {friendRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-3 bg-stone-700/50 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={request.requester?.avatar_url}
                        name={request.requester?.name || 'User'}
                        size="md"
                      />
                      <div>
                        <p className="font-medium text-stone-50">
                          {request.requester?.name || 'Unknown User'}
                        </p>
                        <p className="text-sm text-stone-400">
                          Wants to connect with you
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleReject(request.id)}
                        disabled={processingRequest === request.id}
                        aria-label="Decline"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleAccept(request.id, request.requester?.name || 'User')}
                        disabled={processingRequest === request.id}
                        isLoading={processingRequest === request.id}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Accept
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Create Post */}
          <div className="mb-4">
            <CreatePost onPostCreated={handlePostCreated} />
          </div>

          {/* Upcoming Hangouts */}
          {!loadingFeed && hangouts.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-stone-50">Upcoming Hangouts</h2>
                <Link href="/hangouts" className="text-sm text-violet-400 hover:text-violet-300">
                  See all
                </Link>
              </div>
              <div className="space-y-3">
                {hangouts.slice(0, 3).map((hangout) => (
                  <HangoutCard
                    key={hangout.id}
                    hangout={hangout}
                    onRsvpChange={handleRsvpChange}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Feed Posts */}
          {loadingFeed ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <PostCardSkeleton key={i} />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <Card variant="elevated" className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-violet-500 to-violet-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-warm">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="font-display text-2xl font-bold text-stone-50 mb-2">
                Your feed is empty
              </h2>
              <p className="text-stone-500 mb-6">
                Connect with neighbors to see their posts and hangouts!
              </p>
              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => router.push('/communities')}
                  className="w-full"
                >
                  Explore Communities
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => router.push('/profile')}
                  className="w-full"
                >
                  View Profile
                </Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post as any}
                  onReaction={handlePostCreated}
                />
              ))}
            </div>
          )}

        </div>
      </main>

    </AppShell>
  )
}
