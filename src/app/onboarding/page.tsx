'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  User, 
  Camera, 
  ArrowRight, 
  ArrowLeft,
  Check,
  Building2,
  GraduationCap,
  Home,
  Search
} from 'lucide-react'
import { Button, Input, Textarea } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'
import { cn } from '@/utils/helpers'

const INTERESTS = [
  'Sports', 'Fitness', 'Food', 'Travel', 'Music', 'Movies',
  'Reading', 'Gaming', 'Photography', 'Art', 'Tech', 'Business',
  'Cooking', 'Fashion', 'Pets', 'Gardening', 'Yoga', 'Dance'
]

const STEPS = ['profile', 'interests', 'community'] as const
type Step = typeof STEPS[number]

export default function OnboardingPage() {
  const router = useRouter()
  const { authUser, refreshProfile } = useAuth()
  const supabase = createClient()

  const [currentStep, setCurrentStep] = useState<Step>('profile')
  const [isLoading, setIsLoading] = useState(false)

  // Profile state
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  // Interests state
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])

  // Community state
  const [communitySearch, setCommunitySearch] = useState('')
  const [selectedCommunity, setSelectedCommunity] = useState<string | null>(null)

  const stepIndex = STEPS.indexOf(currentStep)

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      setAvatarUrl(URL.createObjectURL(file))
    }
  }

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    )
  }

  const handleNext = () => {
    if (currentStep === 'profile' && !name.trim()) {
      toast.error('Please enter your name')
      return
    }

    const nextIndex = stepIndex + 1
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex])
    }
  }

  const handleBack = () => {
    const prevIndex = stepIndex - 1
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex])
    }
  }

  const handleComplete = async () => {
    if (!authUser) return

    setIsLoading(true)

    try {
      let finalAvatarUrl = avatarUrl

      // Upload avatar if selected
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop()
        const fileName = `${authUser.id}.${fileExt}`
        
        const { error: uploadError, data } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile, { upsert: true })

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName)

        finalAvatarUrl = publicUrl
      }

      // Update user profile
      const { error: updateError } = await (supabase
        .from('users') as any)
        .update({
          name: name.trim(),
          bio: bio.trim() || null,
          avatar_url: finalAvatarUrl,
          interests: selectedInterests.length > 0 ? selectedInterests : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', authUser.id)

      if (updateError) throw updateError

      // Join selected community if any
      if (selectedCommunity) {
        await (supabase.from('community_memberships') as any).insert({
          user_id: authUser.id,
          community_id: selectedCommunity,
          status: 'pending',
        })
      }

      await refreshProfile()
      toast.success('Welcome to Hapien!')
      router.push('/feed')
    } catch (error) {
      console.error('Onboarding error:', error)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-warm flex flex-col">
      {/* Background decoration */}
      <div className="fixed inset-0 bg-mesh pointer-events-none" />

      {/* Progress bar */}
      <div className="relative z-10 px-4 py-6">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-2 mb-2">
            {STEPS.map((step, index) => (
              <div
                key={step}
                className={cn(
                  'flex-1 h-1.5 rounded-full transition-colors',
                  index <= stepIndex ? 'bg-primary-500' : 'bg-neutral-200'
                )}
              />
            ))}
          </div>
          <p className="text-sm text-neutral-500 text-center">
            Step {stepIndex + 1} of {STEPS.length}
          </p>
        </div>
      </div>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            {currentStep === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="text-center mb-8">
                  <h1 className="font-display text-3xl font-bold text-neutral-900 mb-2">
                    Let's set up your profile
                  </h1>
                  <p className="text-neutral-600">
                    Help your friends recognize you
                  </p>
                </div>

                <div className="bg-white rounded-3xl shadow-soft p-8 space-y-6">
                  {/* Avatar */}
                  <div className="flex justify-center">
                    <label className="relative cursor-pointer group">
                      <div className="w-24 h-24 rounded-full bg-neutral-100 flex items-center justify-center overflow-hidden ring-4 ring-white shadow-soft">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-10 h-10 text-neutral-400" />
                        )}
                      </div>
                      <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center shadow-lg group-hover:bg-primary-600 transition-colors">
                        <Camera className="w-4 h-4 text-white" />
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Name */}
                  <Input
                    label="Your Name"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />

                  {/* Bio */}
                  <Textarea
                    label="Bio (optional)"
                    placeholder="A short intro about yourself..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                  />

                  <Button
                    onClick={handleNext}
                    className="w-full"
                    size="lg"
                    disabled={!name.trim()}
                    rightIcon={<ArrowRight className="w-5 h-5" />}
                  >
                    Continue
                  </Button>
                </div>
              </motion.div>
            )}

            {currentStep === 'interests' && (
              <motion.div
                key="interests"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="text-center mb-8">
                  <h1 className="font-display text-3xl font-bold text-neutral-900 mb-2">
                    What are you into?
                  </h1>
                  <p className="text-neutral-600">
                    Pick a few interests to help us suggest hangouts
                  </p>
                </div>

                <div className="bg-white rounded-3xl shadow-soft p-8 space-y-6">
                  <div className="flex flex-wrap gap-2">
                    {INTERESTS.map((interest) => (
                      <button
                        key={interest}
                        onClick={() => toggleInterest(interest)}
                        className={cn(
                          'px-4 py-2 rounded-full text-sm font-medium transition-all',
                          selectedInterests.includes(interest)
                            ? 'bg-primary-500 text-white shadow-glow'
                            : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                        )}
                      >
                        {selectedInterests.includes(interest) && (
                          <Check className="w-4 h-4 inline mr-1" />
                        )}
                        {interest}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={handleBack}
                      variant="ghost"
                      className="flex-1"
                      leftIcon={<ArrowLeft className="w-5 h-5" />}
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleNext}
                      className="flex-1"
                      rightIcon={<ArrowRight className="w-5 h-5" />}
                    >
                      Continue
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 'community' && (
              <motion.div
                key="community"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="text-center mb-8">
                  <h1 className="font-display text-3xl font-bold text-neutral-900 mb-2">
                    Join a community
                  </h1>
                  <p className="text-neutral-600">
                    Where do you spend most of your time?
                  </p>
                </div>

                <div className="bg-white rounded-3xl shadow-soft p-8 space-y-6">
                  {/* Community types */}
                  <div className="grid grid-cols-3 gap-3">
                    <CommunityTypeCard
                      icon={Home}
                      label="Society"
                      description="Residential"
                    />
                    <CommunityTypeCard
                      icon={GraduationCap}
                      label="Campus"
                      description="College"
                    />
                    <CommunityTypeCard
                      icon={Building2}
                      label="Office"
                      description="Workplace"
                    />
                  </div>

                  {/* Search */}
                  <Input
                    placeholder="Search for your community..."
                    value={communitySearch}
                    onChange={(e) => setCommunitySearch(e.target.value)}
                    leftIcon={<Search className="w-5 h-5" />}
                  />

                  <p className="text-sm text-neutral-500 text-center">
                    Can't find yours?{' '}
                    <button className="text-primary-600 hover:underline">
                      Request a new community
                    </button>
                  </p>

                  <div className="flex gap-3">
                    <Button
                      onClick={handleBack}
                      variant="ghost"
                      className="flex-1"
                      leftIcon={<ArrowLeft className="w-5 h-5" />}
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleComplete}
                      className="flex-1"
                      isLoading={isLoading}
                      rightIcon={<Check className="w-5 h-5" />}
                    >
                      Complete
                    </Button>
                  </div>

                  <button
                    onClick={handleComplete}
                    className="w-full text-sm text-neutral-500 hover:text-neutral-700"
                  >
                    Skip for now
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}

function CommunityTypeCard({
  icon: Icon,
  label,
  description,
}: {
  icon: typeof Home
  label: string
  description: string
}) {
  return (
    <button className="p-4 rounded-2xl bg-neutral-50 hover:bg-neutral-100 transition-colors text-center group">
      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center mx-auto mb-2 group-hover:shadow-soft transition-shadow">
        <Icon className="w-5 h-5 text-primary-500" />
      </div>
      <p className="font-medium text-neutral-900 text-sm">{label}</p>
      <p className="text-xs text-neutral-500">{description}</p>
    </button>
  )
}
