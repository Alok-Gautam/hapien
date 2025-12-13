'use client'

import { useState, useRef } from 'react'
import { 
  Image as ImageIcon, 
  Video, 
  MapPin, 
  Users,
  X,
  ChevronDown
} from 'lucide-react'
import { Avatar, Button, Card } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { PostVisibility } from '@/types/database'
import { cn, visibilityConfig } from '@/utils/helpers'
import toast from 'react-hot-toast'

interface CreatePostProps {
  communityId?: string
  onPostCreated?: () => void
}

export function CreatePost({ communityId, onPostCreated }: CreatePostProps) {
  const { user } = useAuth()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [content, setContent] = useState('')
  const [media, setMedia] = useState<File[]>([])
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([])
  const [visibility, setVisibility] = useState<PostVisibility>('friends')
  const [showVisibilityMenu, setShowVisibilityMenu] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const newMedia = [...media, ...files].slice(0, 4)
    setMedia(newMedia)

    const newPreviews = newMedia.map(file => URL.createObjectURL(file))
    setMediaPreviews(newPreviews)
    setIsExpanded(true)
  }

  const removeMedia = (index: number) => {
    const newMedia = media.filter((_, i) => i !== index)
    const newPreviews = mediaPreviews.filter((_, i) => i !== index)
    setMedia(newMedia)
    setMediaPreviews(newPreviews)
  }

  const handlePost = async () => {
    if (!user || (!content.trim() && media.length === 0)) return

    setIsLoading(true)

    try {
      // Upload media files
      const mediaUrls: string[] = []
      
      for (const file of media) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        
        const { error: uploadError, data } = await supabase.storage
          .from('posts')
          .upload(fileName, file)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('posts')
          .getPublicUrl(fileName)

        mediaUrls.push(publicUrl)
      }

      // Create post
      const { error: postError } = await supabase.from('posts').insert({
        user_id: user.id,
        content: content.trim() || null,
        media_urls: mediaUrls.length > 0 ? mediaUrls : null,
        visibility,
        community_id: communityId || null,
      } as any)

      if (postError) throw postError

      // Reset form
      setContent('')
      setMedia([])
      setMediaPreviews([])
      setIsExpanded(false)

      toast.success('Post shared!')
      onPostCreated?.()
    } catch (error) {
      console.error('Post creation error:', error)
      toast.error('Failed to create post. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) return null

  return (
    <Card variant="elevated" padding="md">
      <div className="flex gap-3">
        <Avatar
          src={user.avatar_url}
          name={user.name || 'User'}
          size="md"
        />
        <div className="flex-1">
          <textarea
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => {
              setContent(e.target.value)
              if (e.target.value) setIsExpanded(true)
            }}
            onFocus={() => setIsExpanded(true)}
            rows={isExpanded ? 3 : 1}
            className="w-full resize-none bg-transparent text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
          />

          {/* Media previews */}
          {mediaPreviews.length > 0 && (
            <div className={cn(
              'grid gap-2 mt-3',
              mediaPreviews.length === 1 && 'grid-cols-1',
              mediaPreviews.length === 2 && 'grid-cols-2',
              mediaPreviews.length >= 3 && 'grid-cols-2',
            )}>
              {mediaPreviews.map((preview, index) => (
                <div
                  key={preview}
                  className="relative aspect-square rounded-xl overflow-hidden bg-neutral-100"
                >
                  <img
                    src={preview}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => removeMedia(index)}
                    className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          {isExpanded && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-100">
              <div className="flex items-center gap-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleMediaSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-neutral-500 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors"
                  title="Add photos or videos"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-neutral-500 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors"
                  title="Add video"
                >
                  <Video className="w-5 h-5" />
                </button>
                <button
                  className="p-2 text-neutral-500 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors"
                  title="Add location"
                >
                  <MapPin className="w-5 h-5" />
                </button>

                {/* Visibility selector */}
                <div className="relative ml-2">
                  <button
                    onClick={() => setShowVisibilityMenu(!showVisibilityMenu)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                  >
                    <Users className="w-4 h-4" />
                    <span>{visibilityConfig[visibility].label}</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {showVisibilityMenu && (
                    <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl shadow-soft-lg border border-neutral-100 py-1 z-10">
                      {Object.entries(visibilityConfig).slice(0, 3).map(([key, config]) => (
                        <button
                          key={key}
                          onClick={() => {
                            setVisibility(key as PostVisibility)
                            setShowVisibilityMenu(false)
                          }}
                          className={cn(
                            'w-full px-4 py-2 text-left hover:bg-neutral-50 transition-colors',
                            visibility === key && 'bg-primary-50'
                          )}
                        >
                          <p className="font-medium text-neutral-900">{config.label}</p>
                          <p className="text-xs text-neutral-500">{config.description}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <Button
                onClick={handlePost}
                isLoading={isLoading}
                disabled={!content.trim() && media.length === 0}
              >
                Post
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
