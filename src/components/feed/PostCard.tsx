'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { 
  Heart, 
  MessageCircle, 
  MoreHorizontal,
  Share2,
  Sparkles,
  PartyPopper,
  Trash2,
  Edit2,
  Flag,
} from 'lucide-react'
import { Avatar, Card } from '@/components/ui'
import { PostWithRelations } from '@/types/database'
import { cn } from '@/utils/helpers'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'

export interface PostCardProps {
  post: PostWithRelations
  onReactionUpdate?: () => void
  onReaction?: () => void
  onDelete?: () => void
}

const REACTION_TYPES = [
  { type: 'like', icon: Heart, label: 'Like', activeColor: 'text-tertiary-500' },
  { type: 'love', icon: Sparkles, label: 'Love', activeColor: 'text-secondary-500' },
  { type: 'celebrate', icon: PartyPopper, label: 'Celebrate', activeColor: 'text-category-sports' },
] as const

export function PostCard({ post, onReactionUpdate, onReaction, onDelete }: PostCardProps) {
  const { user } = useAuth()
  const supabase = createClient()
  const [showReactions, setShowReactions] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [isReacting, setIsReacting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editContent, setEditContent] = useState(post.content || '')
  const [isSaving, setIsSaving] = useState(false)
  
  // Support both prop names
  const handleCallback = onReactionUpdate || onReaction
  const isOwner = user?.id === post.user_id

  const userReaction = post.reactions.find(r => r.user_id === user?.id)
  const reactionCounts = post.reactions.reduce((acc, r) => {
    acc[r.type] = (acc[r.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const totalReactions = post.reactions.length
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true })

  const handleReaction = async (type: 'like' | 'love' | 'celebrate') => {
    if (!user || isReacting) return

    setIsReacting(true)
    setShowReactions(false)

    try {
      if (userReaction?.type === type) {
        // Remove reaction
        await supabase
          .from('reactions')
          .delete()
          .eq('id', userReaction.id)
      } else if (userReaction) {
        // Update reaction
        await (supabase
          .from('reactions') as any)
          .update({ type })
          .eq('id', userReaction.id)
      } else {
        // Add reaction
        await (supabase
          .from('reactions') as any)
          .insert({
            user_id: user.id,
            post_id: post.id,
            type,
          })
      }

      handleCallback?.()
    } catch (error) {
      console.error('Reaction error:', error)
    } finally {
      setIsReacting(false)
    }
  }

  const handleDelete = async () => {
    if (!user || !isOwner || isDeleting) return
    
    if (!confirm('Are you sure you want to delete this post?')) return

    setIsDeleting(true)
    setShowMenu(false)

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', post.id)

      if (error) throw error

      toast.success('Post deleted')
      onDelete?.()
      handleCallback?.()
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to delete post')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEdit = async () => {
    if (!user || !isOwner || isSaving) return

    setIsSaving(true)

    try {
      const { error } = await (supabase
        .from('posts') as any)
        .update({ content: editContent.trim() })
        .eq('id', post.id)

      if (error) throw error

      toast.success('Post updated')
      setShowEditModal(false)
      handleCallback?.()
    } catch (error) {
      console.error('Edit error:', error)
      toast.error('Failed to update post')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <Card variant="elevated" padding="none" className="overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 pb-3">
          <Link href={`/profile/${post.user_id}`} className="flex items-center gap-3">
            <Avatar
              src={post.user.avatar_url}
              name={post.user.name || 'User'}
              size="md"
            />
            <div>
              <p className="font-semibold text-stone-50 hover:text-primary-400 transition-colors">
                {post.user.name}
              </p>
              <div className="flex items-center gap-2 text-sm text-stone-500">
                <span>{timeAgo}</span>
                {post.community && (
                  <>
                    <span>•</span>
                    <Link
                      href={`/communities/${post.community_id}`}
                      className="hover:text-primary-400 transition-colors"
                    >
                      {post.community.name}
                    </Link>
                  </>
                )}
              </div>
            </div>
          </Link>
          
          {/* More menu */}
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-stone-400 hover:text-stone-400 hover:bg-stone-700 rounded-lg transition-colors"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>

            {showMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowMenu(false)} 
                />
                <div className="absolute right-0 top-full mt-1 w-48 bg-stone-800 rounded-xl shadow-soft border border-stone-700-lg border border-stone-700 py-1 z-20">
                  {isOwner ? (
                    <>
                      <button
                        onClick={() => {
                          setShowMenu(false)
                          setShowEditModal(true)
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-neutral-300 hover:bg-stone-900 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                        <span>Edit post</span>
                      </button>
                      <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-tertiary-300 hover:bg-tertiary-900/30 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>{isDeleting ? 'Deleting...' : 'Delete post'}</span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        setShowMenu(false)
                        toast.success('Post reported')
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-neutral-300 hover:bg-stone-900 transition-colors"
                    >
                      <Flag className="w-4 h-4" />
                      <span>Report post</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        {post.content && (
          <div className="px-4 pb-3">
            <p className="text-stone-300 whitespace-pre-wrap">{post.content}</p>
          </div>
        )}

        {/* Media */}
        {post.media_urls && post.media_urls.length > 0 && (
          <div className={cn(
            'grid gap-1',
            post.media_urls.length === 1 && 'grid-cols-1',
            post.media_urls.length === 2 && 'grid-cols-2',
            post.media_urls.length >= 3 && 'grid-cols-2',
          )}>
            {post.media_urls.slice(0, 4).map((url, index) => {
              const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(url)
              
              return (
                <div
                  key={url}
                  className={cn(
                    'relative bg-stone-700',
                    post.media_urls!.length === 1 ? 'aspect-[4/3]' : 'aspect-square',
                    post.media_urls!.length === 3 && index === 0 && 'row-span-2',
                  )}
                >
                  {isVideo ? (
                    <video
                      src={url}
                      controls
                      className="w-full h-full object-cover"
                      preload="metadata"
                    />
                  ) : (
                    <Image
                      src={url}
                      alt=""
                      fill
                      className="object-cover"
                    />
                  )}
                  {index === 3 && post.media_urls!.length > 4 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white text-2xl font-bold">
                        +{post.media_urls!.length - 4}
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Reactions summary */}
        {totalReactions > 0 && (
          <div className="px-4 py-2 flex items-center gap-2 text-sm text-stone-500">
            <div className="flex -space-x-1">
              {Object.keys(reactionCounts).slice(0, 3).map((type) => {
                const config = REACTION_TYPES.find(r => r.type === type)
                const Icon = config?.icon || Heart
                return (
                  <div
                    key={type}
                    className={cn(
                      'w-5 h-5 rounded-full bg-stone-800 flex items-center justify-center shadow-sm',
                      config?.activeColor
                    )}
                  >
                    <Icon className="w-3 h-3" />
                  </div>
                )
              })}
            </div>
            <span>{totalReactions}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center border-t border-stone-700">
          {/* Reaction button */}
          <div className="relative flex-1">
            <button
              onMouseEnter={() => setShowReactions(true)}
              onMouseLeave={() => setShowReactions(false)}
              onClick={() => handleReaction('like')}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors',
                userReaction
                  ? REACTION_TYPES.find(r => r.type === userReaction.type)?.activeColor
                  : 'text-stone-400 hover:text-stone-50 hover:bg-stone-900'
              )}
            >
              {userReaction ? (
                <>
                  {(() => {
                    const config = REACTION_TYPES.find(r => r.type === userReaction.type)
                    const Icon = config?.icon || Heart
                    return <Icon className="w-5 h-5" />
                  })()}
                  <span>{REACTION_TYPES.find(r => r.type === userReaction.type)?.label}</span>
                </>
              ) : (
                <>
                  <Heart className="w-5 h-5" />
                  <span>Like</span>
                </>
              )}
            </button>

            {/* Reaction picker */}
            {showReactions && (
              <div
                onMouseEnter={() => setShowReactions(true)}
                onMouseLeave={() => setShowReactions(false)}
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-stone-800 rounded-full shadow-soft border border-stone-700-lg flex gap-1 z-10"
              >
                {REACTION_TYPES.map(({ type, icon: Icon, label, activeColor }) => (
                  <button
                    key={type}
                    onClick={() => handleReaction(type)}
                    className={cn(
                      'p-2 rounded-full hover:bg-stone-700 transition-all hover:scale-125',
                      userReaction?.type === type && activeColor
                    )}
                    title={label}
                  >
                    <Icon className="w-6 h-6" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Comment button */}
          <Link
            href={`/post/${post.id}`}
            className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium text-stone-400 hover:text-stone-50 hover:bg-stone-900 transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            <span>Comment</span>
            {post.comments_count && post.comments_count > 0 && (
              <span className="text-stone-400">({post.comments_count})</span>
            )}
          </Link>

          {/* Share button */}
          <button className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium text-stone-400 hover:text-stone-50 hover:bg-stone-900 transition-colors">
            <Share2 className="w-5 h-5" />
            <span>Share</span>
          </button>
        </div>
      </Card>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-lg bg-stone-800 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-stone-700 flex items-center justify-between">
              <h2 className="font-semibold text-lg">Edit Post</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 text-stone-400 hover:text-stone-400 hover:bg-stone-700 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={5}
                className="w-full p-3 border border-stone-700 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none resize-none"
                placeholder="What's on your mind?"
              />
            </div>
            <div className="p-4 border-t border-stone-700 flex justify-end gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-stone-400 hover:text-stone-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEdit}
                disabled={isSaving || !editContent.trim()}
                className="px-4 py-2 bg-primary-900/300 text-white font-medium rounded-xl hover:bg-primary-600 transition-colors disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
