'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface Notification {
  id: string
  type: string
  isRead: boolean
  createdAt: string
  actor: {
    id: string
    username: string
    displayName: string
    avatarUrl: string | null
  } | null
  post: {
    id: string
    title: string
  } | null
  comment: {
    id: string
    body: string
  } | null
}

interface NotificationsResponse {
  notifications: Notification[]
  unreadCount: number
  hasMore: boolean
}

export function useNotifications(limit = 20) {
  return useQuery<NotificationsResponse>({
    queryKey: ['notifications', limit],
    queryFn: async () => {
      const res = await fetch(`/api/notifications?limit=${limit}`)
      if (!res.ok) throw new Error('Failed to fetch notifications')
      return res.json()
    },
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: 'POST',
      })
      if (!res.ok) throw new Error('Failed to mark as read')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/notifications/read-all', {
        method: 'POST',
      })
      if (!res.ok) throw new Error('Failed to mark all as read')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}
