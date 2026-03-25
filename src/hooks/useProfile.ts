'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface Profile {
  id: string
  email: string
  username: string
  displayName: string
  avatarUrl: string | null
  bio: string | null
  region: string | null
  province: string | null
  city: string | null
  barangay: string | null
  isVerified: boolean
  role: string
  reputationPoints: number
  createdAt: string
  _count: {
    posts: number
  }
}

export function useProfile(id: string | null) {
  return useQuery<Profile | null>({
    queryKey: ['profile', id],
    queryFn: async () => {
      if (!id) return null
      const res = await fetch(`/api/profiles/${id}`)
      if (!res.ok) throw new Error('Failed to fetch profile')
      return res.json()
    },
    enabled: !!id,
  })
}

export function useUserPosts(userId: string | null, limit = 10) {
  return useQuery({
    queryKey: ['user-posts', userId, limit],
    queryFn: async () => {
      if (!userId) return { posts: [], hasMore: false }
      const res = await fetch(`/api/posts?userId=${userId}&limit=${limit}`)
      if (!res.ok) throw new Error('Failed to fetch user posts')
      return res.json()
    },
    enabled: !!userId,
  })
}

export function useSavedPosts(limit = 10) {
  return useQuery({
    queryKey: ['saved-posts', limit],
    queryFn: async () => {
      const res = await fetch(`/api/posts/saved?limit=${limit}`)
      if (!res.ok) throw new Error('Failed to fetch saved posts')
      return res.json()
    },
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: {
      displayName?: string
      bio?: string
      region?: string
      province?: string
      city?: string
      barangay?: string
      avatar?: File
    }) => {
      const formData = new FormData()
      if (data.displayName) formData.append('displayName', data.displayName)
      if (data.bio) formData.append('bio', data.bio)
      if (data.region) formData.append('region', data.region)
      if (data.province) formData.append('province', data.province)
      if (data.city) formData.append('city', data.city)
      if (data.barangay) formData.append('barangay', data.barngay)
      if (data.avatar) formData.append('avatar', data.avatar)
      
      const res = await fetch('/api/profiles/me', {
        method: 'PATCH',
        body: formData,
      })
      
      if (!res.ok) throw new Error('Failed to update profile')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })
}
