'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Camera, Upload, X, Check, Loader2 } from 'lucide-react'
import { AppShell, Header, BottomNav } from '@/components/layout'
import { Avatar, Button, Card, Input, Badge } from '@/components/ui'
import { LoadingScreen } from '@/components/ui/Loading'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { User } from '@/types/database'
import { cn } from '@/utils/helpers'
import toast from 'react-hot-toast'

const INTERESTS = [
  'Sports', 'Fitness', 'Food', 'Travel', 'Movies', 'Music',
  'Reading', 'Gaming', 'Photography', 'Art', 'Tech', 'Fashion',
  'Nature', 'Pets', 'Cooking', 'Dancing', 'Yoga', 'Meditation'
]

export default function EditProfilePage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [profile, setProfile] = useState<User | null>(null)
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [interests, setInterests] = useState<string[]>([])
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return

      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error) throw error

        const profileData = data as User
        setProfile(profileData)
        setName(profileData.name || '')
        setBio(profileData.bio || '')
        setInterests(profileData.interests || [])
        setAvatarUrl(profileData.avatar_url)
      } catch (error) {
        console.error('Error fetching profile:', error)
        toast.error('Failed to load profile')
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [user, supabase])

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB')
      return
    }

    setAvatarFile(file)
    const previewUrl = URL.createObjectURL(file)
    setAvatarPreview(previewUrl)
  }

  const toggleInterest = (interest: string) => {
    setInterests(prev => 
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    )
  }

  const handleSave = async () => {
    if (!user || !name.trim()) {
      toast.error('Name is required')
      return
    }

    setIsSaving(true)

    try {
      let finalAvatarUrl = avatarUrl

      // Upload new avatar if selected
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile, { upsert: true })

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName)

        finalAvatarUrl = publicUrl
      }

      // Update profile
      const { error } = await (supabase
        .from('users') as any)
        .update({
          name: name.trim(),
          bio: bio.trim() || null,
          avatar_url: finalAvatarUrl,
          interests,
        })
        .eq('id', user.id)

      if (error) throw error

      toast.success('Profile updated!')
      router.push('/profile')
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  if (authLoading || isLoading) {
    return <LoadingScreen />
  }

  if (!user || !profile) {
    return null
  }

  return (
    <AppShell>
      <Header />

      <main className="min-h-screen pt-16 pb-24 bg-gradient-to-b from-primary-50/30 via-white to-white">
        <div className="max-w-2xl mx-auto px-4 py-6">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-display font-bold text-neutral-900">
              Edit Profile
            </h1>
            <p className="text-neutral-600 mt-1">
              Update your profile information
            </p>
          </div>

          <div className="space-y-6">
            {/* Avatar Section */}
            <Card variant="elevated" padding="lg">
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">
                Profile Photo
              </h2>
              
              <div className="flex items-center gap-6">
                <div className="relative">
                  <Avatar
                    src={avatarPreview || avatarUrl}
                    name={name || 'User'}
                    size="xl"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 p-2 bg-primary-500 rounded-full text-white hover:bg-primary-600 transition-colors shadow-lg"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1">
                  <p className="text-sm text-neutral-600 mb-3">
                    Upload a new profile photo. Images should be square and less than 5MB.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Choose File
                  </Button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarSelect}
                  className="hidden"
                />
              </div>

              {avatarPreview && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 flex items-center gap-2 text-sm text-primary-600"
                >
                  <Check className="w-4 h-4" />
                  New photo selected
                  <button
                    onClick={() => {
                      setAvatarFile(null)
                      setAvatarPreview(null)
                    }}
                    className="text-neutral-400 hover:text-neutral-600 ml-2"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </Card>

            {/* Basic Info */}
            <Card variant="elevated" padding="lg">
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">
                Basic Information
              </h2>

              <div className="space-y-4">
                <Input
                  label="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Bio
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us a bit about yourself..."
                    rows={3}
                    maxLength={200}
                    className="w-full px-4 py-3 bg-white rounded-xl border border-neutral-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all resize-none"
                  />
                  <p className="text-xs text-neutral-400 mt-1 text-right">
                    {bio.length}/200
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Phone
                  </label>
                  <Input
                    value={profile.phone}
                    disabled
                    hint="Phone number cannot be changed"
                  />
                </div>
              </div>
            </Card>

            {/* Interests */}
            <Card variant="elevated" padding="lg">
              <h2 className="text-lg font-semibold text-neutral-900 mb-2">
                Interests
              </h2>
              <p className="text-sm text-neutral-500 mb-4">
                Select your interests to connect with like-minded people
              </p>

              <div className="flex flex-wrap gap-2">
                {INTERESTS.map((interest) => {
                  const isSelected = interests.includes(interest)
                  return (
                    <button
                      key={interest}
                      onClick={() => toggleInterest(interest)}
                      className={cn(
                        'px-4 py-2 rounded-full text-sm font-medium transition-all',
                        isSelected
                          ? 'bg-primary-500 text-white'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      )}
                    >
                      {interest}
                    </button>
                  )
                })}
              </div>

              {interests.length > 0 && (
                <p className="text-sm text-neutral-500 mt-4">
                  {interests.length} {interests.length === 1 ? 'interest' : 'interests'} selected
                </p>
              )}
            </Card>

            {/* Save Button */}
            <div className="flex gap-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleSave}
                disabled={isSaving || !name.trim()}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </div>
        </div>
      </main>

      <BottomNav />
    </AppShell>
  )
}
