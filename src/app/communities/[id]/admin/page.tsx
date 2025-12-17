'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Users,
  UserPlus,
  UserMinus,
  Check,
  X,
  Clock,
  Shield,
  Search,
  Settings,
  Camera,
  MapPin,
  Trash2,
} from 'lucide-react'
import { AppShell } from '@/components/layout'
import { Avatar, Button, Card, Badge, Input, Textarea } from '@/components/ui'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { LoadingScreen, LoadingCard } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Community, CommunityMembership, User } from '@/types/database'
import toast from 'react-hot-toast'

interface MemberWithUser {
  id: string
  user_id: string
  community_id: string
  status: string
  role: string
  created_at: string
  user: User
}

type AdminTab = 'members' | 'pending' | 'settings'

export default function CommunityAdminPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const supabase = createClient()

  const [community, setCommunity] = useState<Community | null>(null)
  const [members, setMembers] = useState<MemberWithUser[]>([])
  const [pendingRequests, setPendingRequests] = useState<MemberWithUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<AdminTab>('members')
  const [searchQuery, setSearchQuery] = useState('')
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  // Settings state
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editAddress, setEditAddress] = useState('')
  const [editCity, setEditCity] = useState('')
  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const coverInputRef = useRef<HTMLInputElement>(null)

  const fetchData = useCallback(async () => {
    if (!id || !user) return

    setIsLoading(true)

    try {
      // Fetch community
      const { data: communityData, error: communityError } = await supabase
        .from('communities')
        .select('*')
        .eq('id', id)
        .single()

      if (communityError) throw communityError

      setCommunity(communityData as Community)

      // Check if current user is admin
      const { data: userMembership } = await supabase
        .from('community_memberships')
        .select('*')
        .eq('community_id', id)
        .eq('user_id', user.id)
        .single()

      // User is admin if they're the creator OR have admin role
      const isUserAdmin = communityData.admin_id === user.id || (userMembership as any)?.role === 'admin'
      setIsAdmin(isUserAdmin)

      if (!isUserAdmin) {
        toast.error('You must be an admin to access this page')
        router.push(`/communities/${id}`)
        return
      }

      // Fetch all memberships
      const { data: membershipsData, error: membershipsError } = await supabase
        .from('community_memberships')
        .select('*')
        .eq('community_id', id)
        .order('created_at', { ascending: false })

      if (membershipsError) {
        console.error('Error fetching memberships:', membershipsError)
        throw membershipsError
      }

      // Fetch user details for all memberships
      if (membershipsData && membershipsData.length > 0) {
        const userIds = membershipsData.map((m: any) => m.user_id)

        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('*')
          .in('id', userIds)

        if (usersError) {
          console.error('Error fetching users:', usersError)
        }

        // Combine memberships with user data
        const membershipsWithUsers = membershipsData.map((membership: any) => {
          const user = usersData?.find((u: any) => u.id === membership.user_id)
          return {
            ...membership,
            user: user || { id: membership.user_id, name: 'Unknown User', avatar_url: null }
          }
        }) as MemberWithUser[]

        const approvedMembers = membershipsWithUsers.filter(m => m.status === 'approved')
        const pendingMembers = membershipsWithUsers.filter(m => m.status === 'pending')

        setMembers(approvedMembers)
        setPendingRequests(pendingMembers)
      } else {
        setMembers([])
        setPendingRequests([])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load community data')
      router.push('/communities')
    } finally {
      setIsLoading(false)
    }
  }, [id, user, supabase, router])

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user, fetchData])

  // Initialize edit fields when community loads
  useEffect(() => {
    if (community) {
      setEditName(community.name || '')
      setEditDescription(community.description || '')
      if (community.location) {
        const loc = community.location as any
        setEditAddress(loc.address || '')
        setEditCity(loc.city || '')
      }
      setCoverPreview(community.cover_image_url || null)
    }
  }, [community])

  const handleApprove = async (membershipId: string) => {
    setProcessingId(membershipId)

    try {
      const { error } = await (supabase
        .from('community_memberships') as any)
        .update({ status: 'approved' })
        .eq('id', membershipId)

      if (error) throw error

      toast.success('Member approved!')
      fetchData()
    } catch (error) {
      console.error('Error approving member:', error)
      toast.error('Failed to approve member')
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (membershipId: string) => {
    if (!confirm('Are you sure you want to reject this request?')) return

    setProcessingId(membershipId)

    try {
      const { error } = await supabase
        .from('community_memberships')
        .delete()
        .eq('id', membershipId)

      if (error) throw error

      toast.success('Request rejected')
      fetchData()
    } catch (error) {
      console.error('Error rejecting request:', error)
      toast.error('Failed to reject request')
    } finally {
      setProcessingId(null)
    }
  }

  const handleRemoveMember = async (membershipId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from the community?`)) return

    setProcessingId(membershipId)

    try {
      const { error } = await supabase
        .from('community_memberships')
        .delete()
        .eq('id', membershipId)

      if (error) throw error

      toast.success('Member removed')
      fetchData()
    } catch (error) {
      console.error('Error removing member:', error)
      toast.error('Failed to remove member')
    } finally {
      setProcessingId(null)
    }
  }

  const handleMakeAdmin = async (membershipId: string, memberName: string) => {
    if (!confirm(`Make ${memberName} an admin?`)) return

    setProcessingId(membershipId)

    try {
      const { error } = await (supabase
        .from('community_memberships') as any)
        .update({ role: 'admin' })
        .eq('id', membershipId)

      if (error) throw error

      toast.success(`${memberName} is now an admin`)
      fetchData()
    } catch (error) {
      console.error('Error making admin:', error)
      toast.error('Failed to make admin')
    } finally {
      setProcessingId(null)
    }
  }

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCoverImage(file)
      setCoverPreview(URL.createObjectURL(file))
    }
  }

  const removeCover = () => {
    setCoverImage(null)
    setCoverPreview(community?.cover_image_url || null)
  }

  const handleSaveSettings = async () => {
    if (!community || !editName.trim()) {
      toast.error('Community name is required')
      return
    }

    setIsSaving(true)

    try {
      let coverImageUrl = community.cover_image_url

      // Upload cover image if changed
      if (coverImage) {
        const fileExt = coverImage.name.split('.').pop()
        const fileName = `${community.id}/${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('communities')
          .upload(fileName, coverImage, { upsert: true })

        if (uploadError) {
          console.error('Cover upload error:', uploadError)
          toast.error('Failed to upload cover image')
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('communities')
            .getPublicUrl(fileName)
          coverImageUrl = publicUrl
        }
      }

      // Update community
      const updateData: any = {
        name: editName.trim(),
        description: editDescription.trim() || null,
        cover_image_url: coverImageUrl,
        updated_at: new Date().toISOString(),
      }

      if (editAddress.trim() || editCity.trim()) {
        updateData.location = {
          address: editAddress.trim() || null,
          city: editCity.trim() || null,
        }
      } else {
        updateData.location = null
      }

      const { error } = await supabase
        .from('communities')
        .update(updateData)
        .eq('id', community.id)

      if (error) throw error

      toast.success('Community updated successfully!')
      fetchData()
    } catch (error) {
      console.error('Error updating community:', error)
      toast.error('Failed to update community')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteCommunity = async () => {
    if (!community) return

    // Check if community has too many members to delete
    const MEMBER_THRESHOLD = 10
    if (members.length >= MEMBER_THRESHOLD) {
      toast.error(
        `Cannot delete communities with ${MEMBER_THRESHOLD}+ members. Please transfer ownership or remove members first.`,
        { duration: 5000 }
      )
      return
    }

    const confirmMessage = `Are you sure you want to delete "${community.name}"? This action cannot be undone and will delete all posts, hangouts, and memberships.`

    if (!confirm(confirmMessage)) return

    setIsSaving(true)

    try {
      // Delete community (cascade should handle memberships, posts, etc.)
      const { error } = await supabase
        .from('communities')
        .delete()
        .eq('id', community.id)

      if (error) throw error

      toast.success('Community deleted successfully')
      router.push('/communities')
    } catch (error) {
      console.error('Error deleting community:', error)
      toast.error('Failed to delete community')
    } finally {
      setIsSaving(false)
    }
  }

  if (authLoading || isLoading) {
    return <LoadingScreen />
  }

  if (!user || !community || !isAdmin) {
    return null
  }

  const filteredMembers = members.filter(m => 
    m.user.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <AppShell>

      <main className="min-h-screen pt-16 pb-24 bg-stone-900">
        <div className="max-w-2xl mx-auto px-4 py-6">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-stone-400 hover:text-stone-50 mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-5 h-5 text-primary-400" />
              <h1 className="text-2xl font-display font-bold text-stone-50">
                Admin Panel
              </h1>
            </div>
            <p className="text-stone-400">
              Managing <span className="font-medium">{community.name}</span>
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Card variant="elevated" padding="md">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-900/20 rounded-lg">
                  <Users className="w-5 h-5 text-primary-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-stone-50">{members.length}</p>
                  <p className="text-sm text-stone-500">Members</p>
                </div>
              </div>
            </Card>
            <Card variant="elevated" padding="md">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary-900/20 rounded-lg">
                  <Clock className="w-5 h-5 text-secondary-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-stone-50">{pendingRequests.length}</p>
                  <p className="text-sm text-stone-500">Pending</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AdminTab)}>
            <TabsList>
              <TabsTrigger value="members">
                <Users className="w-4 h-4 mr-1.5" />
                Members
              </TabsTrigger>
              <TabsTrigger value="pending">
                <Clock className="w-4 h-4 mr-1.5" />
                Pending
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="w-4 h-4 mr-1.5" />
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="members" className="mt-4">
              {/* Search */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                  <input
                    type="text"
                    placeholder="Search members..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-stone-800 rounded-xl border border-stone-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                  />
                </div>
              </div>

              {filteredMembers.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No members found"
                  description={searchQuery ? "Try a different search term" : "No members in this community yet"}
                />
              ) : (
                <AnimatePresence>
                  <div className="space-y-3">
                    {filteredMembers.map((member, index) => (
                      <motion.div
                        key={member.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                      >
                        <Card className="p-4">
                          <div className="flex items-center gap-4">
                            <Link href={`/profile/${member.user.id}`}>
                              <Avatar
                                src={member.user.avatar_url}
                                name={member.user.name || 'User'}
                                size="md"
                              />
                            </Link>
                            <div className="flex-1 min-w-0">
                              <Link href={`/profile/${member.user.id}`}>
                                <p className="font-semibold text-stone-50 hover:text-primary-400 transition-colors">
                                  {member.user.name}
                                </p>
                              </Link>
                              <div className="flex items-center gap-2 mt-0.5">
                                {member.role === 'admin' && (
                                  <Badge variant="primary" size="sm">
                                    <Shield className="w-3 h-3 mr-1" />
                                    Admin
                                  </Badge>
                                )}
                                <span className="text-sm text-stone-500">
                                  Joined {new Date(member.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            {member.user.id !== user.id && member.role !== 'admin' && (
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleMakeAdmin(member.id, member.user.name || 'User')}
                                  disabled={processingId === member.id}
                                >
                                  <Shield className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveMember(member.id, member.user.name || 'User')}
                                  disabled={processingId === member.id}
                                  className="text-tertiary-300 hover:bg-tertiary-900/30"
                                >
                                  <UserMinus className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </AnimatePresence>
              )}
            </TabsContent>

            <TabsContent value="pending" className="mt-4">
              {pendingRequests.length === 0 ? (
                <EmptyState
                  icon={Clock}
                  title="No pending requests"
                  description="All caught up! No join requests to review."
                />
              ) : (
                <AnimatePresence>
                  <div className="space-y-3">
                    {pendingRequests.map((request, index) => (
                      <motion.div
                        key={request.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                      >
                        <Card className="p-4">
                          <div className="flex items-center gap-4">
                            <Link href={`/profile/${request.user.id}`}>
                              <Avatar
                                src={request.user.avatar_url}
                                name={request.user.name || 'User'}
                                size="md"
                              />
                            </Link>
                            <div className="flex-1 min-w-0">
                              <Link href={`/profile/${request.user.id}`}>
                                <p className="font-semibold text-stone-50 hover:text-primary-400 transition-colors">
                                  {request.user.name}
                                </p>
                              </Link>
                              <p className="text-sm text-stone-500">
                                Requested {new Date(request.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleApprove(request.id)}
                                disabled={processingId === request.id}
                              >
                                <Check className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleReject(request.id)}
                                disabled={processingId === request.id}
                                className="text-tertiary-300 hover:bg-tertiary-900/30"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </AnimatePresence>
              )}
            </TabsContent>

            <TabsContent value="settings" className="mt-4">
              <Card variant="elevated" className="p-6">
                <h3 className="text-lg font-semibold text-stone-50 mb-4">Community Settings</h3>

                <div className="space-y-6">
                  {/* Cover Image */}
                  <div>
                    <label className="block text-sm font-medium text-stone-300 mb-2">
                      Cover Image
                    </label>
                    <input
                      ref={coverInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleCoverSelect}
                      className="hidden"
                    />
                    {coverPreview ? (
                      <div className="relative h-40 rounded-xl overflow-hidden group">
                        <img
                          src={coverPreview}
                          alt="Cover"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            onClick={() => coverInputRef.current?.click()}
                            className="p-2 bg-stone-800 rounded-full text-white hover:bg-stone-700"
                          >
                            <Camera className="w-5 h-5" />
                          </button>
                          <button
                            onClick={removeCover}
                            className="p-2 bg-stone-800 rounded-full text-white hover:bg-stone-700"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => coverInputRef.current?.click()}
                        className="w-full h-40 border-2 border-dashed border-stone-700 rounded-xl flex flex-col items-center justify-center text-stone-500 hover:border-stone-600 hover:text-stone-400 transition-colors"
                      >
                        <Camera className="w-8 h-8 mb-2" />
                        <span className="text-sm">Click to upload cover image</span>
                      </button>
                    )}
                  </div>

                  {/* Name */}
                  <Input
                    label="Community Name"
                    placeholder="e.g., Prestige Lakeside Habitat"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                  />

                  {/* Description */}
                  <Textarea
                    label="Description"
                    placeholder="Tell people what this community is about..."
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={3}
                  />

                  {/* Location */}
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-stone-300">
                      Location
                    </label>
                    <div className="space-y-3">
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                        <Input
                          placeholder="Address"
                          value={editAddress}
                          onChange={(e) => setEditAddress(e.target.value)}
                          className="pl-12"
                        />
                      </div>
                      <Input
                        placeholder="City"
                        value={editCity}
                        onChange={(e) => setEditCity(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="pt-4">
                    <Button
                      className="w-full"
                      onClick={handleSaveSettings}
                      isLoading={isSaving}
                      disabled={!editName.trim()}
                    >
                      Save Changes
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Danger Zone */}
              <Card variant="elevated" className="p-6 mt-6 border-2 border-tertiary-900/50">
                <h3 className="text-lg font-semibold text-tertiary-300 mb-2">Danger Zone</h3>
                <p className="text-sm text-stone-400 mb-4">
                  Once you delete a community, there is no going back. This will permanently delete all posts, hangouts, and memberships.
                  {members.length >= 10 && (
                    <span className="block mt-2 text-tertiary-300 font-medium">
                      ⚠️ Communities with 10+ members cannot be deleted. You must transfer ownership or remove members first.
                    </span>
                  )}
                </p>
                <Button
                  variant="ghost"
                  className="w-full bg-tertiary-900/30 text-tertiary-300 hover:bg-tertiary-900/50 border border-tertiary-800/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleDeleteCommunity}
                  disabled={isSaving || members.length >= 10}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {isSaving ? 'Deleting...' : members.length >= 10 ? `Cannot Delete (${members.length} members)` : 'Delete Community'}
                </Button>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

    </AppShell>
  )
}
