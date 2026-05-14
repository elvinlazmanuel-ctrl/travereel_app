'use client'

import dynamic from 'next/dynamic'
import { useAppStore } from '@/lib/store'
import AuthPage from '@/components/auth/AuthPage'
import AuthProvider from '@/components/auth/AuthProvider'

// Load AppShell dynamically - this way the initial page compile is very lightweight
// AppShell itself will lazy-load individual views only when they're first navigated to
const AppShell = dynamic(() => import('@/components/AppShell'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-3">
        <div className="size-10 border-3 border-[#2EC4B6] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    </div>
  ),
})

export default function Home() {
  const { isAuthenticated } = useAppStore()

  return (
    <AuthProvider>
      {!isAuthenticated ? <AuthPage /> : <AppShell />}
    </AuthProvider>
  )
}
