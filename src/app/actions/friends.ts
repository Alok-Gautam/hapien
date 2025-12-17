'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { User } from '@/types/database'

export type FriendRequestWithUser = {
  id: string
  requester_id: string
  addressee_id: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  requester: User
}

// Get pending friend requests for the current user
export async function getPendingFriendRequests(): Promise<FriendRequestWithUser[]> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: requests, error } = await supabase
    .from('friendships')
    .select(`
      id,
      requester_id,
      addressee_id,
      status,
      created_at,
      requester:users!friendships_requester_id_fkey(*)
    `)
    .eq('addressee_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching friend requests:', error)
    return []
  }

  return (requests || []) as unknown as FriendRequestWithUser[]
}

// Accept a friend request
export async function acceptFriendRequest(requestId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Verify this request is addressed to the current user
  const { data: request } = await supabase
    .from('friendships')
    .select('*')
    .eq('id', requestId)
    .eq('addressee_id', user.id)
    .single()

  if (!request) {
    throw new Error('Friend request not found')
  }

  const { error } = await supabase
    .from('friendships')
    .update({
      status: 'accepted',
      updated_at: new Date().toISOString()
    })
    .eq('id', requestId)

  if (error) {
    console.error('Error accepting friend request:', error)
    throw new Error('Failed to accept friend request')
  }

  revalidatePath('/feed')
  revalidatePath('/profile')
  revalidatePath('/friends')
  return { success: true }
}

// Reject a friend request
export async function rejectFriendRequest(requestId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Verify this request is addressed to the current user
  const { data: request } = await supabase
    .from('friendships')
    .select('*')
    .eq('id', requestId)
    .eq('addressee_id', user.id)
    .single()

  if (!request) {
    throw new Error('Friend request not found')
  }

  const { error } = await supabase
    .from('friendships')
    .update({
      status: 'rejected',
      updated_at: new Date().toISOString()
    })
    .eq('id', requestId)

  if (error) {
    console.error('Error rejecting friend request:', error)
    throw new Error('Failed to reject friend request')
  }

  revalidatePath('/feed')
  revalidatePath('/profile')
  return { success: true }
}

// Send a friend request
export async function sendFriendRequest(addresseeId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Check if a friendship already exists (in either direction)
  const { data: existing } = await supabase
    .from('friendships')
    .select('*')
    .or(`and(requester_id.eq.${user.id},addressee_id.eq.${addresseeId}),and(requester_id.eq.${addresseeId},addressee_id.eq.${user.id})`)
    .single()

  if (existing) {
    if (existing.status === 'accepted') {
      return { success: false, message: 'Already connected' }
    }
    if (existing.status === 'pending') {
      // If they sent us a request, accept it
      if (existing.requester_id === addresseeId) {
        await supabase
          .from('friendships')
          .update({
            status: 'accepted',
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
        return { success: true, message: 'Connected!' }
      }
      return { success: false, message: 'Request already sent' }
    }
  }

  // Create new friend request
  const { error } = await supabase
    .from('friendships')
    .insert({
      requester_id: user.id,
      addressee_id: addresseeId,
      status: 'pending'
    })

  if (error) {
    console.error('Error sending friend request:', error)
    throw new Error('Failed to send friend request')
  }

  revalidatePath('/profile')
  return { success: true, message: 'Request sent!' }
}
