'use client'

import { useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useAuthStore } from '@/stores/auth-store'

export function useAuth() {
  const { data: session, status } = useSession()
  const { user, setUser, setLoading, isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (status === 'loading') {
      setLoading(true)
    } else if (status === 'authenticated' && session?.user) {
      setUser({
        id: session.user.id,
        email: session.user.email,
        username: session.user.username,
        displayName: session.user.displayName,
        avatarUrl: session.user.avatarUrl,
        role: session.user.role,
        isVerified: session.user.isVerified,
      })
    } else if (status === 'unauthenticated') {
      setUser(null)
    }
  }, [session, status, setUser, setLoading])

  const logout = async () => {
    await signOut({ redirect: false })
    useAuthStore.getState().logout()
  }

  return {
    user,
    isLoading: status === 'loading',
    isAuthenticated: !!session?.user,
    logout,
  }
}
