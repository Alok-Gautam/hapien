'use client'

import { useState, useRef } from 'react'
import { 
  Image as ImageIcon, 
  X,
  Send
} from 'lucide-react'
import { Avatar, Button, Card } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/utils/helpers'
import toast from 'react-hot-toast'

interface WallPostProps {
  targetUserId: string
  targetUserName: string
  onPostCreated?: () => void
}

export function WallPost({ targetUserId, targetUserName, onPostCreated }: WallPostProps) {
  const { user } = useAuth()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [content, setContent] = useState('')
  const [media, setMedia] = useState<File[]>([])
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([])
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

      // Create wall post with special visibility indicator
      const { error: postError } = await (supabase.from('posts') as any).insert({
        user_id: user.id,
        content: content.trim() ? `📝 Posted on ${targetUserName}'s wall:\n\n${content.trim()}` : `📝 Posted on ${targetUserName}'s wall`,
        media_urls: mediaUrls.length > 0 ? mediaUrls : null,
        visibility: 'friends', // Wall posts visible to friends
      })

      if (postError) throw postError

      // Reset form
      setContent('')
      setMedia([])
      setMediaPreviews([])
      setIsExpanded(false)

      toast.success(`Posted on ${targetUserName}'s wall!`)
      onPostCreated?.()
    } catch (error) {
      console.error('Wall post error:', error)
      toast.error('Failed to post. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) return null

  return (
    <Card className="p-4 border-2 border-dashed border-primary-200 bg-primary-900/30/30">
      <div className="flex gap-3">
        <Avatar
          src={user.avatar_url}
          name={user.name || 'User'}
          size="md"
        />
        <div className="flex-1">
          <textarea
            placeholder={`Write something on ${targetUserName}'s wall...`}
            value={content}
            onChange={(e) => {
              setContent(e.target.value)
              if (e.target.value) setIsExpanded(true)
            }}
            onFocus={() => setIsExpanded(true)}
            rows={isExpanded ? 3 : 1}
            className="w-full resize-none bg-transparent text-stone-50 placeholder:text-stone-400 focus:outline-none"
          />

          {/* Media previews */}
          {mediaPreviews.length > 0 && (
            <div className={cn(
              'grid gap-2 mt-3',
              mediaPreviews.length === 1 && 'grid-cols-1',
              mediaPreviews.length >= 2 && 'grid-cols-2',
            )}>
              {mediaPreviews.map((preview, index) => (
                <div
                  key={preview}
                  className="relative aspect-square rounded-xl overflow-hidden bg-stone-700"
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
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-primary-200">
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
                  className="p-2 text-primary-500 hover:text-primary-400 hover:bg-primary-900/20 rounded-lg transition-colors"
                  title="Add photos or videos"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
              </div>

              <Button
                onClick={handlePost}
                isLoading={isLoading}
                disabled={!content.trim() && media.length === 0}
                size="sm"
              >
                <Send className="w-4 h-4 mr-1" />
                Post
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
