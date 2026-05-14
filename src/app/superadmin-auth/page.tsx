'use client'

import { useState, useEffect } from 'react'
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

export default function SuperAdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)

  // Check localStorage for existing auth on mount
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
  }

  const handleLogout = () => {
    localStorage.removeItem('superadmin_auth')
    setIsAuthenticated(false)
    setAdminUser(null)
    setActiveTab('overview')
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
