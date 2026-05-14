'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Loader2 } from 'lucide-react'

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { login, logout, currentUser } = useAppStore()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem('auth_token')
      
      if (!token) {
        setIsReady(true)
        return
      }

      try {
        // Verify token and get user data
        const res = await fetch('/api/auth', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (!res.ok) {
          // Token is invalid or expired
          localStorage.removeItem('auth_token')
          logout()
        } else {
          const data = await res.json()
          login(data.user, token)
        }
      } catch {
        localStorage.removeItem('auth_token')
        logout()
      } finally {
        setIsReady(true)
      }
    }

    verifyAuth()
  }, [login, logout])

  // Show loading screen while checking auth
  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="size-8 animate-spin text-[#FF8C42]" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
