'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  Database,
  ToggleLeft,
  Settings,
  LogOut,
  Menu,
  X,
  Globe,
} from 'lucide-react'

interface SuperAdminDashboardProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  adminUser: { id: string; email: string; username: string; name: string; role: string; avatar?: string | null } | null
  onLogout: () => void
  children: React.ReactNode
}

const sidebarItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'data', label: 'Data Tables', icon: Database },
  { id: 'features', label: 'Features', icon: ToggleLeft },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export default function SuperAdminDashboard({
  activeTab,
  setActiveTab,
  adminUser,
  onLogout,
  children,
}: SuperAdminDashboardProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen flex bg-background">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-50 h-screen w-64 flex flex-col
          bg-[#1a1a1a] text-white
          transform transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Sidebar header */}
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#2F5C9B' }}>
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-sm leading-tight">Travereel</h2>
              <p className="text-xs text-gray-400">Super Admin</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden absolute top-5 right-4 text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {sidebarItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id)
                  setSidebarOpen(false)
                }}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-colors duration-150
                  ${isActive
                    ? 'text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }
                `}
                style={isActive ? { backgroundColor: '#2F5C9B' } : undefined}
              >
                <Icon className="w-4.5 h-4.5" />
                {item.label}
              </button>
            )
          })}
        </nav>

        {/* User info & Logout */}
        <div className="p-3 border-t border-white/10">
          <div className="px-3 py-2 mb-2">
            <p className="text-sm font-medium text-white truncate">{adminUser?.name || 'Super Admin'}</p>
            <p className="text-xs text-gray-400 truncate">{adminUser?.email || ''}</p>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-white/5 transition-colors duration-150"
          >
            <LogOut className="w-4.5 h-4.5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-14 bg-background border-b border-border flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold text-foreground">
              {sidebarItems.find((i) => i.id === activeTab)?.label || 'Dashboard'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-sm text-muted-foreground">{adminUser?.email}</span>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: '#2F5C9B' }}>
              {(adminUser?.name || 'SA')[0].toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
