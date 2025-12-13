import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPhone(phone: string): string {
  // Format Indian phone numbers
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`
  }
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`
  }
  return phone
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

export function pluralize(count: number, singular: string, plural?: string): string {
  if (count === 1) return singular
  return plural || `${singular}s`
}

export function generateAvatarColor(name: string): string {
  const colors = [
    'bg-primary-500',
    'bg-secondary-500',
    'bg-tertiary-500',
    'bg-category-sports',
    'bg-category-food',
    'bg-category-shopping',
    'bg-category-learning',
    'bg-category-chill',
  ]
  
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  return colors[Math.abs(hash) % colors.length]
}

export const categoryConfig = {
  sports: {
    label: 'Sports',
    color: 'bg-category-sports',
    textColor: 'text-category-sports',
    emoji: '🏃',
    gradient: 'from-green-500 to-emerald-600',
  },
  food: {
    label: 'Food',
    color: 'bg-category-food',
    textColor: 'text-category-food',
    emoji: '🍕',
    gradient: 'from-orange-500 to-amber-600',
  },
  shopping: {
    label: 'Shopping',
    color: 'bg-category-shopping',
    textColor: 'text-category-shopping',
    emoji: '🛍️',
    gradient: 'from-pink-500 to-rose-600',
  },
  learning: {
    label: 'Learning',
    color: 'bg-category-learning',
    textColor: 'text-category-learning',
    emoji: '📚',
    gradient: 'from-blue-500 to-indigo-600',
  },
  chill: {
    label: 'Chill',
    color: 'bg-category-chill',
    textColor: 'text-category-chill',
    emoji: '😎',
    gradient: 'from-purple-500 to-violet-600',
  },
} as const

export const communityTypeConfig = {
  society: {
    label: 'Residential Society',
    emoji: '🏠',
  },
  campus: {
    label: 'College Campus',
    emoji: '🎓',
  },
  office: {
    label: 'Office Complex',
    emoji: '🏢',
  },
} as const

export const visibilityConfig = {
  friends: {
    label: 'Friends Only',
    description: 'Only your friends can see this',
  },
  friends_communities: {
    label: 'Friends & Communities',
    description: 'Friends and community members can see this',
  },
  community_only: {
    label: 'Community Only',
    description: 'Only community members can see this',
  },
  community: {
    label: 'Community',
    description: 'All community members can see this',
  },
  public_in_community: {
    label: 'Public in Community',
    description: 'Anyone in the community can discover this',
  },
} as const
