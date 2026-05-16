'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import dynamic from 'next/dynamic'

const SuperAdminAuth = dynamic(() => import('@/components/superadmin/SuperAdminAuth'))
const SuperAdminDashboard = dynamic(() => import('@/components/superadmin/SuperAdminDashboard'))
const DashboardOverview = dynamic(() => import('@/components/superadmin/DashboardOverview'))
const DataTablePage = dynamic(() => import('@/components/superadmin/DataTablePage'))
const FeatureToggles = dynamic(() => import('@/components/superadmin/FeatureToggles'))
const PlatformSettings = dynamic(() => import('@/components/superadmin/PlatformSettings'))

interface AdminUser {
  id: string
  email: string
  username: string
  name: string
  role: string
  avatar?: string | null
  token?: string
}

const SESSION_TIMEOUT = 30 * 60 * 1000 // 30 minutes in milliseconds

export default function SuperAdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Reset inactivity timer
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current)
    }

    inactivityTimerRef.current = setTimeout(() => {
      // Auto logout after 30 minutes of inactivity
      handleLogout()
    }, SESSION_TIMEOUT)
  }, [])

  // Set up activity listeners for session timeout
  useEffect(() => {
    if (!isAuthenticated) return

    const activityEvents = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart']
    
    // Reset timer on any user activity
    const handleActivity = () => {
      resetInactivityTimer()
    }

    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity)
    })

    // Initial timer setup
    resetInactivityTimer()

    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity)
      })
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current)
      }
    }
  }, [isAuthenticated, resetInactivityTimer])

  // Check for existing auth on mount
  useEffect(() => {
    try {
      const auth = localStorage.getItem('superadmin_auth')
      if (auth) {
        const parsed = JSON.parse(auth)
        setIsAuthenticated(true)
        setAdminUser(parsed)
      }
    } catch {
      localStorage.removeItem('superadmin_auth')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleAuth = (user: AdminUser) => {
    setIsAuthenticated(true)
    setAdminUser(user)
    // Note: Token is now in HttpOnly cookie, but we keep user data in state for UI
    localStorage.setItem('superadmin_auth', JSON.stringify(user))
    resetInactivityTimer()
  }

  const handleLogout = async () => {
    try {
      // Call logout API to clear cookie
      await fetch('/api/superadmin/logout', {
        method: 'POST',
      })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('superadmin_auth')
      setIsAuthenticated(false)
      setAdminUser(null)
      setActiveTab('overview')
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current)
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl" style={{ backgroundColor: '#FF6B6B' }} />
          <div className="h-4 w-32 bg-muted rounded" />
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <SuperAdminAuth onAuth={handleAuth} />
  }

  return (
    <SuperAdminDashboard
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      adminUser={adminUser}
      onLogout={handleLogout}
    >
      {activeTab === 'overview' && <DashboardOverview />}
      {activeTab === 'data' && <DataTablePage />}
      {activeTab === 'features' && <FeatureToggles />}
      {activeTab === 'settings' && <PlatformSettings />}
    </SuperAdminDashboard>
  )
}
