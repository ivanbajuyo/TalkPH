import { create } from 'zustand'

export type ViewType = 'home' | 'profile' | 'categories' | 'notifications' | 'saved' | 'admin' | 'post-detail'

interface AppState {
  currentView: ViewType
  setCurrentView: (view: ViewType) => void
  
  // Selected items
  selectedPostId: string | null
  setSelectedPostId: (id: string | null) => void
  
  selectedUserId: string | null
  setSelectedUserId: (id: string | null) => void
  
  selectedCategoryId: string | null
  setSelectedCategoryId: (id: string | null) => void
  
  // Filters
  postTypeFilter: string | null
  setPostTypeFilter: (type: string | null) => void
  
  searchQuery: string
  setSearchQuery: (query: string) => void
  
  // Modals
  isCreatePostOpen: boolean
  setIsCreatePostOpen: (open: boolean) => void
  
  isLoginOpen: boolean
  setIsLoginOpen: (open: boolean) => void
  
  isRegisterOpen: boolean
  setIsRegisterOpen: (open: boolean) => void
  
  isEditProfileOpen: boolean
  setIsEditProfileOpen: (open: boolean) => void
  
  // Mobile
  isMobileMenuOpen: boolean
  setIsMobileMenuOpen: (open: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  currentView: 'home',
  setCurrentView: (view) => set({ currentView: view }),
  
  selectedPostId: null,
  setSelectedPostId: (id) => set({ selectedPostId: id }),
  
  selectedUserId: null,
  setSelectedUserId: (id) => set({ selectedUserId: id }),
  
  selectedCategoryId: null,
  setSelectedCategoryId: (id) => set({ selectedCategoryId: id }),
  
  postTypeFilter: null,
  setPostTypeFilter: (type) => set({ postTypeFilter: type }),
  
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  
  isCreatePostOpen: false,
  setIsCreatePostOpen: (open) => set({ isCreatePostOpen: open }),
  
  isLoginOpen: false,
  setIsLoginOpen: (open) => set({ isLoginOpen: open }),
  
  isRegisterOpen: false,
  setIsRegisterOpen: (open) => set({ isRegisterOpen: open }),
  
  isEditProfileOpen: false,
  setIsEditProfileOpen: (open) => set({ isEditProfileOpen: open }),
  
  isMobileMenuOpen: false,
  setIsMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),
}))
