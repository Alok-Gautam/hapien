'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Home,
  MapPin,
  Image as ImageIcon,
  ArrowLeft,
  X,
  Users,
} from 'lucide-react'
import { AppShell } from '@/components/layout'
import { Button, Card, Input, Textarea } from '@/components/ui'
import { LoadingScreen } from '@/components/ui/Loading'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/utils/helpers'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function CreateCommunityPage() {
  const router = useRouter()
  const { authUser, user, isLoading: authLoading } = useAuth()
  const supabase = createClient()
  const coverInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCoverImage(file)
      setCoverPreview(URL.createObjectURL(file))
    }
  }

  const removeCover = () => {
    setCoverImage(null)
    setCoverPreview(null)
  }

  const handleSubmit = async () => {
    if (!user || !name.trim()) return

    setIsSubmitting(true)

    // Helper function to add timeout to promises
    const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> => {
      return Promise.race([
        promise,
        new Promise<T>((_, reject) =>
          setTimeout(() => reject(new Error('TIMEOUT')), ms)
        )
      ])
    }

    try {
      let coverImageUrl: string | null = null

      // Upload cover image if selected (with timeout, non-blocking)
      if (coverImage) {
        try {
          const fileExt = coverImage.name.split('.').pop()
          const fileName = `${user.id}/${Date.now()}.${fileExt}`

          const { error: uploadError } = await withTimeout(
            supabase.storage.from('communities').upload(fileName, coverImage),
            15000
          )

          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from('communities')
              .getPublicUrl(fileName)
            coverImageUrl = publicUrl
          }
        } catch (uploadErr) {
          console.error('Cover image upload failed:', uploadErr)
          // Continue without cover image
        }
      }

      // Create community using Supabase client
      console.log('Creating community...')

      const communityData = {
        name: name.trim(),
        description: description.trim() || null,
        cover_image_url: coverImageUrl,
        admin_id: user.id,
        location: address || city ? {
          address: address.trim() || null,
          city: city.trim() || null,
        } : null,
        member_count: 0,
      }

      const { data: community, error: communityError } = await supabase
        .from('communities')
        .insert(communityData)
        .select()
        .single()

      if (communityError) {
        console.error('Community creation error:', communityError)
        console.error('Error message:', communityError.message)
        console.error('Error code:', communityError.code)
        console.error('Error details:', communityError.details)
        console.error('Error hint:', communityError.hint)
        throw communityError
      }

      console.log('Community created:', community)

      // Add creator as admin member
      try {
        const { error: membershipError } = await supabase
          .from('community_memberships')
          .insert({
            user_id: user.id,
            community_id: community.id,
            status: 'approved',
            role: 'admin',
          })

        if (membershipError) {
          console.error('Membership creation error:', membershipError)
        }
      } catch (memberErr) {
        console.error('Membership creation failed:', memberErr)
        // Continue anyway - community was created
      }

      toast.success('Community created successfully!')
      router.push(`/communities/${community.id}`)
    } catch (error: any) {
      console.error('Error creating community:', error)
      if (error.message === 'TIMEOUT') {
        toast.error('Database is not responding. Please try again.')
      } else {
        toast.error('Failed to create community')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (authLoading) {
    return <LoadingScreen />
  }

  // Show message if not logged in
  if (!authUser) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-primary-400" />
          </div>
          <h2 className="text-xl font-bold text-stone-50 mb-2">
            Login Required
          </h2>
          <p className="text-stone-400 mb-6">
            You need to be logged in to create a community. Please log in or go back to continue browsing.
          </p>
          <div className="flex gap-3">
            <Link href="/communities" className="flex-1">
              <Button variant="outline" className="w-full">
                Go Back
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
        <Card className="max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-primary-400" />
          </div>
          <h2 className="text-xl font-bold text-stone-50 mb-2">
            Complete Your Profile
          </h2>
          <p className="text-stone-400 mb-6">
            Before you can create a community, please complete your profile setup. This helps others in the community know who you are.
          </p>
          <div className="flex gap-3">
            <Link href="/communities" className="flex-1">
              <Button variant="outline" className="w-full">
                Go Back
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

  return (
    <AppShell>

      <main className="min-h-screen pt-16 pb-24 bg-stone-900">
        <div className="max-w-2xl mx-auto px-4 py-6">
          {/* Back button */}
          <Link
            href="/communities"
            className="inline-flex items-center gap-2 text-stone-400 hover:text-stone-50 mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Communities
          </Link>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-display font-bold text-stone-50">
              Create a Community
            </h1>
            <p className="text-stone-400 mt-1">
              Fill in the details for your community
            </p>
          </div>

          {/* Community Details Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
              {/* Cover Image */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Cover Image (optional)
                </label>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCoverSelect}
                  className="hidden"
                />
                {coverPreview ? (
                  <div className="relative h-40 rounded-xl overflow-hidden">
                    <img
                      src={coverPreview}
                      alt="Cover"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={removeCover}
                      className="absolute top-3 right-3 p-2 bg-black/50 rounded-full text-white hover:bg-black/70"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => coverInputRef.current?.click()}
                    className="w-full h-40 border-2 border-dashed border-neutral-300 rounded-xl flex flex-col items-center justify-center text-stone-500 hover:border-neutral-400 hover:text-stone-400 transition-colors"
                  >
                    <ImageIcon className="w-8 h-8 mb-2" />
                    <span className="text-sm">Click to upload cover image</span>
                  </button>
                )}
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Community Name *
                </label>
                <Input
                  placeholder="e.g., Prestige Lakeside Habitat"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Description (optional)
                </label>
                <Textarea
                  placeholder="Tell people what this community is about..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Location */}
              <div className="space-y-4">
                <label className="block text-sm font-medium text-neutral-300">
                  Location
                </label>
                <div className="space-y-3">
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                    <Input
                      placeholder="Address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="pl-12"
                    />
                  </div>
                  <Input
                    placeholder="City"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4">
                <Button
                  className="w-full"
                  onClick={handleSubmit}
                  isLoading={isSubmitting}
                  disabled={!name.trim()}
                >
                  Create Community
                </Button>
              </div>
          </motion.div>
        </div>
      </main>

    </AppShell>
  )
}
