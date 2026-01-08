/**
 * Hangout categories
 */
export const HANGOUT_CATEGORIES = [
  { id: 'sports', label: 'Sports', emoji: '🏃' },
  { id: 'food', label: 'Food', emoji: '🍕' },
  { id: 'shopping', label: 'Shopping', emoji: '🛍️' },
  { id: 'learning', label: 'Learning', emoji: '📚' },
  { id: 'chill', label: 'Chill', emoji: '😎' },
] as const

/**
 * Post visibility options
 */
export const POST_VISIBILITY_OPTIONS = [
  { id: 'friends', label: 'Friends Only', description: 'Only your friends can see this' },
  { id: 'friends_communities', label: 'Friends & Communities', description: 'Friends and community members can see this' },
  { id: 'community_only', label: 'Community Only', description: 'Only members of the selected community can see this' },
] as const

/**
 * Friendship status
 */
export const FRIENDSHIP_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
} as const

export type FriendshipStatus = typeof FRIENDSHIP_STATUS[keyof typeof FRIENDSHIP_STATUS]

/**
 * RSVP status
 */
export const RSVP_STATUS = {
  GOING: 'going',
  INTERESTED: 'interested',
} as const

export type RsvpStatus = typeof RSVP_STATUS[keyof typeof RSVP_STATUS]

/**
 * Reaction types
 */
export const REACTION_TYPES = [
  { id: 'like', emoji: '👍', label: 'Like' },
  { id: 'love', emoji: '❤️', label: 'Love' },
  { id: 'celebrate', emoji: '🎉', label: 'Celebrate' },
] as const

export type ReactionType = typeof REACTION_TYPES[number]['id']

/**
 * Gamification XP values
 */
export const XP_VALUES = {
  JOIN_HANGOUT: 25,
  COMPLETE_HANGOUT: 50,
  CREATE_HANGOUT: 35,
  MEET_NEW_PERSON: 100,
  REACH_CLOSE_FRIEND: 200,
  DAILY_STREAK: 10,
  WEEKLY_STREAK: 50,
  SPORTS_BONUS: 10,
  EARLY_BIRD_BONUS: 15,
  NIGHT_OWL_BONUS: 15,
} as const

/**
 * Level thresholds
 */
export const LEVEL_THRESHOLDS = [
  0,      // Level 1
  100,    // Level 2
  300,    // Level 3
  600,    // Level 4
  1000,   // Level 5
  1500,   // Level 6
  2100,   // Level 7
  2800,   // Level 8
  3600,   // Level 9
  4500,   // Level 10
] as const

/**
 * Get level from XP
 */
export function getLevelFromXP(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      return i + 1
    }
  }
  return 1
}

/**
 * Get XP needed for next level
 */
export function getXPForNextLevel(xp: number): number {
  const currentLevel = getLevelFromXP(xp)
  if (currentLevel >= LEVEL_THRESHOLDS.length) return 0
  return LEVEL_THRESHOLDS[currentLevel] - xp
}
