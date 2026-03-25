import { create } from 'zustand'

interface User {
  id: string
  email: string
  username: string
  displayName: string
  avatarUrl?: string | null
  role: string
  isVerified: boolean
  bio?: string | null
  region?: string | null
  province?: string | null
  city?: string | null
  barangay?: string | null
  reputationPoints?: number
}

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  
  setUser: (user) => set({ 
    user, 
    isAuthenticated: !!user,
    isLoading: false 
  }),
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  logout: () => set({ 
    user: null, 
    isAuthenticated: false 
  }),
}))
