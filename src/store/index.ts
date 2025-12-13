import { create } from 'zustand'
import { User, Community } from '@/types/database'

interface UserState {
  user: User | null
  isLoading: boolean
  communities: Community[]
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  setCommunities: (communities: Community[]) => void
  reset: () => void
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  isLoading: true,
  communities: [],
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  setCommunities: (communities) => set({ communities }),
  reset: () => set({ user: null, communities: [], isLoading: false }),
}))

interface UIState {
  isMobileNavOpen: boolean
  activeTab: 'home' | 'communities' | 'hangouts' | 'profile'
  setMobileNavOpen: (open: boolean) => void
  setActiveTab: (tab: UIState['activeTab']) => void
}

export const useUIStore = create<UIState>((set) => ({
  isMobileNavOpen: false,
  activeTab: 'home',
  setMobileNavOpen: (isMobileNavOpen) => set({ isMobileNavOpen }),
  setActiveTab: (activeTab) => set({ activeTab }),
}))
