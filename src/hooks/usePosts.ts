'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAppStore } from '@/stores/app-store'

export interface Post {
  id: string
  title: string
  body: string | null
  postType: string
  isAnonymous: boolean
  region: string | null
  province: string | null
  city: string | null
  barangay: string | null
  viewCount: number
  commentCount: number
  reactionCount: number
  createdAt: string
  updatedAt: string
  user: {
    id: string
    username: string
    displayName: string
    avatarUrl: string | null
  } | null
  category: {
    id: string
    name: string
    slug: string
  } | null
  media: Array<{
    id: string
    mediaType: string
    fileUrl: string
    thumbnailUrl: string | null
  }>
  poll: {
    id: string
    question: string
    endsAt: string | null
    options: Array<{
      id: string
      optionText: string
      _count: { votes: number }
    }>
  } | null
  reactions: Array<{
    reactionType: string
    _count: number
  }>
  userReaction: string | null
  isSaved: boolean
}

interface PostsResponse {
  posts: Post[]
  nextCursor: string | null
  hasMore: boolean
}

export function usePosts(limit = 10) {
  const { postTypeFilter, selectedCategoryId, searchQuery } = useAppStore()
  
  return useQuery<PostsResponse>({
    queryKey: ['posts', { postTypeFilter, selectedCategoryId, searchQuery, limit }],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (postTypeFilter) params.append('type', postTypeFilter)
      if (selectedCategoryId) params.append('categoryId', selectedCategoryId)
      if (searchQuery) params.append('search', searchQuery)
      params.append('limit', String(limit))
      
      const res = await fetch(`/api/posts?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch posts')
      return res.json()
    },
  })
}

export function usePost(id: string | null) {
  return useQuery<Post | null>({
    queryKey: ['post', id],
    queryFn: async () => {
      if (!id) return null
      const res = await fetch(`/api/posts/${id}`)
      if (!res.ok) throw new Error('Failed to fetch post')
      return res.json()
    },
    enabled: !!id,
  })
}

export function useCreatePost() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: {
      title: string
      body: string
      categoryId: string | null
      postType: string
      isAnonymous: boolean
      region?: string
      province?: string
      city?: string
      barangay?: string
      media?: File[]
      poll?: {
        question: string
        options: string[]
        endsAt?: string
      }
    }) => {
      const formData = new FormData()
      formData.append('title', data.title)
      formData.append('body', data.body)
      if (data.categoryId) formData.append('categoryId', data.categoryId)
      formData.append('postType', data.postType)
      formData.append('isAnonymous', String(data.isAnonymous))
      if (data.region) formData.append('region', data.region)
      if (data.province) formData.append('province', data.province)
      if (data.city) formData.append('city', data.city)
      if (data.barangay) formData.append('barangay', data.barangay)
      if (data.poll) formData.append('poll', JSON.stringify(data.poll))
      
      if (data.media) {
        data.media.forEach((file) => {
          formData.append('media', file)
        })
      }
      
      const res = await fetch('/api/posts', {
        method: 'POST',
        body: formData,
      })
      
      if (!res.ok) throw new Error('Failed to create post')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })
}

export function useDeletePost() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/posts/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete post')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })
}

export function useToggleSavePost() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (postId: string) => {
      const res = await fetch(`/api/posts/${postId}/save`, {
        method: 'POST',
      })
      if (!res.ok) throw new Error('Failed to toggle save')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      queryClient.invalidateQueries({ queryKey: ['saved-posts'] })
    },
  })
}
