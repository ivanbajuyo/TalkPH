import { create } from 'zustand';

export type View = 'home' | 'post' | 'profile' | 'create' | 'notifications' | 'saved' | 'categories' | 'search' | 'admin';

export type AuthModal = 'login' | 'register' | 'forgot' | null;

interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  role: string;
  isVerified: boolean;
}

interface Post {
  id: string;
  userId: string;
  title: string;
  body?: string;
  postType: string;
  isAnonymous: boolean;
  viewCount: number;
  commentCount: number;
  reactionCount: number;
  createdAt: string;
  user?: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
    isVerified: boolean;
  };
  category?: {
    id: string;
    name: string;
    slug: string;
    iconName?: string;
  };
  media?: Array<{
    id: string;
    mediaType: string;
    fileUrl: string;
    thumbnailUrl?: string;
  }>;
  poll?: {
    id: string;
    question: string;
    options: Array<{
      id: string;
      optionText: string;
      _count?: { votes: number };
    }>;
  };
  _count?: {
    comments: number;
    reactions: number;
  };
  tags?: Array<{ tag: string }>;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  iconName?: string;
}

interface Notification {
  id: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  actor?: {
    username: string;
    displayName: string;
    avatarUrl?: string;
  };
}

interface AppState {
  // Auth
  user: User | null;
  setUser: (user: User | null) => void;
  authModal: AuthModal;
  setAuthModal: (modal: AuthModal) => void;

  // Navigation
  currentView: View;
  setCurrentView: (view: View) => void;
  selectedPostId: string | null;
  setSelectedPostId: (id: string | null) => void;
  selectedUsername: string | null;
  setSelectedUsername: (username: string | null) => void;

  // Data
  posts: Post[];
  setPosts: (posts: Post[]) => void;
  addPost: (post: Post) => void;
  categories: Category[];
  setCategories: (categories: Category[]) => void;
  notifications: Notification[];
  setNotifications: (notifications: Notification[]) => void;

  // Filters
  selectedCategory: string | null;
  setSelectedCategory: (category: string | null) => void;
  selectedPostType: string | null;
  setSelectedPostType: (type: string | null) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // UI State
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  createPostOpen: boolean;
  setCreatePostOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Auth
  user: null,
  setUser: (user) => set({ user }),
  authModal: null,
  setAuthModal: (modal) => set({ authModal: modal }),

  // Navigation
  currentView: 'home',
  setCurrentView: (view) => set({ currentView: view }),
  selectedPostId: null,
  setSelectedPostId: (id) => set({ selectedPostId: id }),
  selectedUsername: null,
  setSelectedUsername: (username) => set({ selectedUsername: username }),

  // Data
  posts: [],
  setPosts: (posts) => set({ posts }),
  addPost: (post) => set((state) => ({ posts: [post, ...state.posts] })),
  categories: [],
  setCategories: (categories) => set({ categories }),
  notifications: [],
  setNotifications: (notifications) => set({ notifications }),

  // Filters
  selectedCategory: null,
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  selectedPostType: null,
  setSelectedPostType: (type) => set({ selectedPostType: type }),
  sortBy: 'latest',
  setSortBy: (sort) => set({ sortBy: sort }),
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),

  // UI State
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  createPostOpen: false,
  setCreatePostOpen: (open) => set({ createPostOpen: open }),
}));
