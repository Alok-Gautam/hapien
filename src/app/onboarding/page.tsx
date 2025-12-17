'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User,
  Camera,
  ArrowRight,
  ArrowLeft,
  Check,
  Home,
  Search,
  X,
  MapPin,
  Send
} from 'lucide-react'
import { Button, Input, Textarea } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'
import { cn } from '@/utils/helpers'

const STEPS = ['profile', 'community'] as const
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

  // Community state
  const [communitySearch, setCommunitySearch] = useState('')
  const [selectedCommunity, setSelectedCommunity] = useState<string | null>(null)

  // Interests state
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])

  // Community search results state
  const [communityResults, setCommunityResults] = useState<any[]>([])

  // Community request modal state
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false)
  const [requestData, setRequestData] = useState({
    name: '',
    location: '',
    description: ''
  })

  const stepIndex = STEPS.indexOf(currentStep)

  // Search communities
  useEffect(() => {
    const searchCommunities = async () => {
      if (!communitySearch.trim()) {
        setCommunityResults([])
        return
      }

      try {
        const { data } = await (supabase
          .from('communities') as any)
          .select('*')
          .ilike('name', `%${communitySearch}%`)
          .limit(10)

        setCommunityResults(data || [])
      } catch (error) {
        console.error('Error searching communities:', error)
        setCommunityResults([])
      }
    }

    const debounce = setTimeout(searchCommunities, 300)
    return () => clearTimeout(debounce)
  }, [communitySearch, supabase])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      setAvatarUrl(URL.createObjectURL(file))
    }
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

  const handleSubmitCommunityRequest = async () => {
    console.log('=== handleSubmitCommunityRequest CALLED ===')
    console.log('Request data:', requestData)
    console.log('authUser:', authUser)

    // Validation checks
    if (!requestData.name.trim() || !requestData.location.trim()) {
      console.error('Validation failed: missing name or location')
      toast.error('Please fill in community name and location')
      return
    }

    // Check if user is authenticated
    if (!authUser?.id) {
      console.error('No authenticated user found')
      toast.error('You must be logged in to submit a request')
      setShowRequestModal(false)
      router.push('/auth')
      return
    }

    setIsSubmittingRequest(true)
    console.log('Starting community request submission...')

    try {
      // Get current session to ensure we have the right user
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError || !session?.user?.id) {
        console.error('Session error:', sessionError)
        throw new Error('Authentication session expired. Please log in again.')
      }

      console.log('Using user ID:', session.user.id)

      // First, create the community so user can join it immediately
      console.log('Creating community...')
      const { data: communityData, error: communityError } = await (supabase
        .from('communities') as any)
        .insert({
          name: requestData.name.trim(),
          location: requestData.location.trim(),
          description: requestData.description.trim() || null,
          admin_id: session.user.id,
        })
        .select()
        .single()

      if (communityError) {
        console.error('Community creation error:', communityError)
        throw new Error(communityError.message || 'Failed to create community')
      }

      console.log('Community created:', communityData)

      // Add user as admin member of the community
      console.log('Adding user to community...')
      const { error: membershipError } = await (supabase
        .from('community_memberships') as any)
        .insert({
          user_id: session.user.id,
          community_id: communityData.id,
          status: 'approved',
          role: 'admin',
        })

      if (membershipError) {
        console.error('Membership creation error:', membershipError)
        console.warn('Could not add user as member, but community was created')
      } else {
        console.log('User added as community admin')
      }

      // Then, submit request for admin review/audit
      console.log('Submitting community request...')
      const { data: requestResponse, error: requestError } = await (supabase
        .from('community_requests') as any)
        .insert({
          name: requestData.name.trim(),
          location: requestData.location.trim(),
          description: requestData.description.trim() || null,
          requested_by: session.user.id,
        })
        .select()

      if (requestError) {
        console.error('Request submission error:', requestError)
        // Don't fail if request submission fails - community is already created
        console.warn('Request submission failed but community was created')
      } else {
        console.log('Request submitted successfully:', requestResponse)
      }

      toast.success('Community created! You can now join it.')
      setShowRequestModal(false)
      setRequestData({ name: '', location: '', description: '' })

      // Trigger search to show the newly created community
      setCommunitySearch(requestData.name.trim())

      // Optionally auto-select the newly created community
      if (communityData?.id) {
        setSelectedCommunity(communityData.id)
      }

    } catch (error) {
      console.error('Request submission error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to submit request. Please try again.')
    } finally {
      setIsSubmittingRequest(false)
      console.log('Request submission complete')
    }
  }

  const handleComplete = async () => {
    // ALWAYS log first to prove function is called
    console.log('=== handleComplete CALLED ===')
    console.log('authUser:', authUser)
    console.log('name:', name)
    console.log('bio:', bio)
    console.log('selectedCommunity:', selectedCommunity)

    // Check if user is authenticated
    if (!authUser?.id) {
      console.error('ERROR: No authenticated user!')
      toast.error('Please log in to continue')
      router.push('/auth')
      return
    }

    // Validate name is filled
    if (!name.trim()) {
      console.error('ERROR: Name is empty!')
      toast.error('Please enter your name')
      setCurrentStep('profile')
      return
    }

    console.log('✓ Validation passed, starting onboarding...')
    setIsLoading(true)

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
      // Test Supabase connectivity first with direct fetch
      console.log('→ Testing Supabase connectivity...')
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      try {
        console.log('→ Testing with direct fetch to:', supabaseUrl)
        const fetchTest = await withTimeout(
          fetch(`${supabaseUrl}/rest/v1/users?select=id&limit=1`, {
            headers: {
              'apikey': supabaseKey!,
              'Authorization': `Bearer ${supabaseKey}`,
            }
          }),
          5000
        )
        console.log('✓ Direct fetch response:', fetchTest.status, fetchTest.statusText)

        if (!fetchTest.ok) {
          const errorText = await fetchTest.text()
          console.error('✗ Fetch error response:', errorText)
        }
      } catch (testErr) {
        console.error('✗ Direct fetch failed:', testErr)

        // Try a simple ping to check internet
        try {
          console.log('→ Testing general internet connectivity...')
          const googleTest = await withTimeout(fetch('https://www.google.com/favicon.ico', { mode: 'no-cors' }), 3000)
          console.log('✓ Internet is working (Google reachable)')
          console.error('✗ Issue is specific to Supabase - check if blocked by firewall/VPN/browser extension')
        } catch {
          console.error('✗ Internet appears to be down or blocked')
        }

        toast.error('Cannot connect to database. Check firewall/VPN/browser extensions.')
        setIsLoading(false)
        return
      }

      let finalAvatarUrl = avatarUrl

      // Upload avatar if selected (NON-BLOCKING)
      if (avatarFile) {
        console.log('→ Uploading avatar...')
        try {
          const fileExt = avatarFile.name.split('.').pop()
          const fileName = `${authUser.id}.${fileExt}`

          const { error: uploadError } = await withTimeout(
            (supabase.storage.from('avatars') as any).upload(fileName, avatarFile, { upsert: true }),
            15000
          )

          if (uploadError) {
            console.error('✗ Avatar upload failed:', uploadError)
          } else {
            const { data: { publicUrl } } = (supabase.storage
              .from('avatars') as any)
              .getPublicUrl(fileName)
            finalAvatarUrl = publicUrl
            console.log('✓ Avatar uploaded successfully:', publicUrl)
          }
        } catch (avatarError: any) {
          console.error('✗ Avatar error:', avatarError)
          // Continue anyway
        }
      }

      // Update user profile using direct fetch (more reliable than Supabase client)
      console.log('→ Upserting profile via direct fetch...')

      // Get user's access token for authenticated requests
      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.access_token || supabaseKey

      try {
        const profileData = {
          id: authUser.id,
          email: authUser.email || null,
          name: name.trim(),
          bio: bio.trim() || null,
          avatar_url: finalAvatarUrl,
          interests: selectedInterests.length > 0 ? selectedInterests : null,
          updated_at: new Date().toISOString(),
        }

        const response = await withTimeout(
          fetch(`${supabaseUrl}/rest/v1/users`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseKey!,
              'Authorization': `Bearer ${accessToken}`,
              'Prefer': 'resolution=merge-duplicates,return=representation',
            },
            body: JSON.stringify(profileData),
          }),
          15000
        )

        if (!response.ok) {
          const errorText = await response.text()
          console.error('✗ Profile upsert failed:', response.status, errorText)
          throw new Error(`Failed to update profile: ${errorText}`)
        }

        const updateData = await response.json()
        console.log('✓ Profile upserted successfully:', updateData)
      } catch (dbError: any) {
        if (dbError.message === 'TIMEOUT') {
          console.error('✗ Database timeout')
          toast.error('Database is not responding. Please try again.')
          setIsLoading(false)
          return
        }
        throw dbError
      }

      // Join community if selected (OPTIONAL/NON-BLOCKING)
      if (selectedCommunity) {
        console.log('→ Attempting to join community:', selectedCommunity)
        try {
          await withTimeout(
            (supabase.from('community_memberships') as any)
              .insert({
                user_id: authUser.id,
                community_id: selectedCommunity,
                status: 'approved',
                role: 'member',
              })
              .select(),
            10000
          )
          console.log('✓ Community joined successfully')
        } catch (communityError) {
          console.error('✗ Community error:', communityError)
          // Continue anyway
        }
      }

      // Refresh profile (with timeout, non-blocking)
      console.log('→ Refreshing profile...')
      try {
        await withTimeout(refreshProfile(), 5000)
        console.log('✓ Profile refreshed')
      } catch {
        console.log('→ Profile refresh skipped (timeout)')
      }

      console.log('✓✓✓ Onboarding complete! Redirecting to feed...')
      toast.success('Welcome to Hapien!')
      router.push('/feed')
      
    } catch (error) {
      console.error('✗✗✗ ONBOARDING ERROR:', error)
      toast.error(
        error instanceof Error 
          ? error.message 
          : 'Something went wrong. Please try again.'
      )
    } finally {
      console.log('→ Resetting loading state')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-stone-900 flex flex-col">
      {/* Background decoration */}
      <div className="fixed inset-0 bg-mesh pointer-events-none opacity-30" />

      {/* Progress bar */}
      <div className="relative z-10 px-4 py-6">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-2 mb-2">
            {STEPS.map((step, index) => (
              <div
                key={step}
                className={cn(
                  'flex-1 h-1.5 rounded-full transition-colors',
                  index <= stepIndex ? 'bg-primary-500' : 'bg-stone-800'
                )}
              />
            ))}
          </div>
          <p className="text-sm text-stone-400 text-center">
            Step {stepIndex + 1} of {STEPS.length}
          </p>
        </div>
      </div>

      {/* Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 pb-8">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            {/* Step 1: Profile */}
            {currentStep === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="text-center mb-8">
                  <h1 className="font-display text-3xl font-bold text-stone-50 mb-2">
                    Create your profile
                  </h1>
                  <p className="text-stone-400">
                    Tell us a bit about yourself
                  </p>
                </div>

                <div className="bg-stone-800 rounded-3xl shadow-soft p-8 space-y-6 border border-stone-700">
                  {/* Avatar */}
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full bg-stone-700 flex items-center justify-center overflow-hidden border-2 border-primary-500/20">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-12 h-12 text-stone-500" />
                        )}
                      </div>
                      <label className="absolute bottom-0 right-0 p-2 bg-primary-500 rounded-full cursor-pointer hover:bg-primary-600 transition-colors shadow-glow">
                        <Camera className="w-4 h-4 text-white" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <p className="text-sm text-stone-400">Upload profile photo</p>
                  </div>

                  {/* Name */}
                  <Input
                    label="Name"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />

                  {/* Bio */}
                  <Textarea
                    label="Bio (optional)"
                    placeholder="Tell us about yourself"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                  />

                  <Button
                    onClick={handleNext}
                    className="w-full"
                    rightIcon={<ArrowRight className="w-5 h-5" />}
                  >
                    Continue
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Community */}
            {currentStep === 'community' && (
              <motion.div
                key="community"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="text-center mb-8">
                  <h1 className="font-display text-3xl font-bold text-stone-50 mb-2">
                    Join a community
                  </h1>
                  <p className="text-stone-400">
                    Where do you spend most of your time?
                  </p>
                </div>

                <div className="bg-stone-800 rounded-3xl shadow-soft p-8 space-y-6 border border-stone-700">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-500" />
                    <input
                      type="text"
                      placeholder="Search communities..."
                      value={communitySearch}
                      onChange={(e) => setCommunitySearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-stone-700 border border-stone-700 rounded-xl text-stone-50 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  {/* Search Results */}
                  {communityResults.length > 0 && (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {communityResults.map((community) => (
                        <button
                          key={community.id}
                          onClick={() => {
                            setSelectedCommunity(community.id)
                            setCommunitySearch('')
                            setCommunityResults([])
                          }}
                          className={`w-full p-3 rounded-xl text-left border-2 transition-all ${
                            selectedCommunity === community.id
                              ? 'bg-primary-500/20 border-primary-500'
                              : 'bg-stone-700 border-stone-700 hover:border-neutral-500'
                          }`}
                        >
                          <p className="font-medium text-stone-50">{community.name}</p>
                          {community.location && (
                            <p className="text-sm text-stone-400">{typeof community.location === 'string' ? community.location : community.location.city || community.location.address}</p>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Selected Community Display */}
                  {selectedCommunity && (
                    <div className="p-3 bg-primary-500/10 border border-primary-500/30 rounded-xl">
                      <p className="text-sm text-primary-300">
                        ✓ Community selected
                      </p>
                    </div>
                  )}

                  <p className="text-sm text-stone-400 text-center">
                    Can't find yours?{' '}
                    <button 
                      onClick={() => setShowRequestModal(true)}
                      className="text-primary-400 hover:text-primary-300 hover:underline"
                    >
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
                    disabled={isLoading}
                    className="w-full text-sm text-stone-400 hover:text-neutral-300 transition-colors disabled:opacity-50"
                  >
                    Skip for now
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Community Request Modal */}
      <AnimatePresence>
        {showRequestModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
            onClick={() => setShowRequestModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-stone-800 rounded-3xl shadow-xl overflow-hidden border border-stone-700"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-stone-700">
                <h2 className="font-display text-xl font-bold text-stone-50">
                  Request New Community
                </h2>
                <button
                  onClick={() => setShowRequestModal(false)}
                  className="p-2 rounded-full hover:bg-stone-700 transition-colors"
                >
                  <X className="w-5 h-5 text-stone-400" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-5">
                {/* Community Name */}
                <Input
                  label="Community Name"
                  placeholder="e.g., Green Valley Apartments"
                  value={requestData.name}
                  onChange={(e) => setRequestData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />

                {/* Location */}
                <Input
                  label="Location"
                  placeholder="City, State"
                  value={requestData.location}
                  onChange={(e) => setRequestData(prev => ({ ...prev, location: e.target.value }))}
                  leftIcon={<MapPin className="w-4 h-4 text-stone-500" />}
                  required
                />

                {/* Description */}
                <Textarea
                  label="Description (optional)"
                  placeholder="Any additional details..."
                  value={requestData.description}
                  onChange={(e) => setRequestData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="ghost"
                    className="flex-1"
                    onClick={() => setShowRequestModal(false)}
                    disabled={isSubmittingRequest}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleSubmitCommunityRequest}
                    isLoading={isSubmittingRequest}
                    disabled={!requestData.name.trim() || !requestData.location.trim()}
                    rightIcon={<Send className="w-4 h-4" />}
                  >
                    Submit Request
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
