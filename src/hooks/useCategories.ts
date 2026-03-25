'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  iconName: string | null
  _count?: {
    posts: number
  }
}

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await fetch('/api/categories')
      if (!res.ok) throw new Error('Failed to fetch categories')
      return res.json()
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}
