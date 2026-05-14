'use client'

import { useState, useEffect, ReactNode } from 'react'
import { useAppStore } from '@/lib/store'

// Lazy view loader - only imports a component when it's actually needed
function useLazyView(viewName: string) {
  const [component, setComponent] = useState<ReactNode>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!viewName) return
    setLoading(true)

    const loadComponent = async () => {
      let mod: any
      switch (viewName) {
        case 'feed':
          mod = await import('@/components/feed/NewsFeed')
          break
        case 'discovery':
          mod = await import('@/components/discovery/DiscoveryPage')
          break
        case 'community':
          mod = await import('@/components/community/CommunityPage')
          break
        case 'community-detail':
          mod = await import('@/components/community/CommunityDetailPage')
          break
        case 'profile':
          mod = await import('@/components/profile/ProfilePage')
          break
        case 'user-profile':
          mod = await import('@/components/profile/UserProfilePage')
          break
        case 'settings':
          mod = await import('@/components/settings/SettingsPage')
          break
        case 'itinerary':
          mod = await import('@/components/itinerary/ItineraryWizard')
          break
        case 'itinerary-detail':
        case 'during-travel':
        case 'post-travel':
          mod = await import('@/components/itinerary/ItineraryDetail')
          break
        case 'budget-tracker':
          mod = await import('@/components/itinerary/BudgetTracker')
          break
        case 'notifications':
          mod = await import('@/components/notifications/NotificationsPage')
          break
        case 'messages':
          mod = await import('@/components/messages/MessagesPage')
          break
        case 'friends':
          mod = await import('@/components/friends/FriendsPage')
          break
        case 'create-post':
          mod = await import('@/components/feed/CreatePost')
          break
        case 'create-story':
          mod = await import('@/components/feed/CreateStory')
          break
        case 'story-viewer':
          mod = await import('@/components/feed/StoryViewer')
          break
        case 'chat-room':
          mod = await import('@/components/messages/ChatRoomPage')
          break
        case 'admin':
          mod = await import('@/components/admin/AdminPage')
          break
        case 'admin-users':
          mod = await import('@/components/admin/AdminUsersPage')
          break
        case 'admin-communities':
          mod = await import('@/components/admin/AdminCommunitiesPage')
          break
        case 'admin-posts':
          mod = await import('@/components/admin/AdminPostsPage')
          break
        default:
          setLoading(false)
          setComponent(
            <div className="max-w-md mx-auto px-4 py-6">
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <h2 className="text-xl font-bold text-foreground mb-2 capitalize">{viewName.replace(/-/g, ' ')}</h2>
                <p className="text-sm text-muted-foreground">Coming soon...</p>
              </div>
            </div>
          )
          return
      }
      setComponent(mod.default ? <mod.default /> : null)
      setLoading(false)
    }

    loadComponent()
  }, [viewName])

  return { component, loading }
}

// Lazy load layout components
function LazyLayout({ children }: { children: ReactNode }) {
  const [TopBar, setTopBar] = useState<any>(null)
  const [BottomNav, setBottomNav] = useState<any>(null)
  const [CreateMenu, setCreateMenu] = useState<any>(null)

  useEffect(() => {
    import('@/components/layout/TopBar').then(m => setTopBar(() => m.default))
    import('@/components/layout/BottomNav').then(m => setBottomNav(() => m.default))
    import('@/components/layout/CreateMenu').then(m => setCreateMenu(() => m.default))
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {TopBar && <TopBar />}
      <main className="flex-1 pb-14">{children}</main>
      {BottomNav && <BottomNav />}
      {CreateMenu && <CreateMenu />}
    </div>
  )
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="size-8 border-2 border-[#2EC4B6] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function AppShell() {
  const { currentView, selectedChatRoom } = useAppStore()
  const { component, loading } = useLazyView(currentView)

  // Full-screen views (no chrome)
  const fullScreenViews = ['story-viewer', 'create-story', 'itinerary', 'create-post']
  const isFullScreen = fullScreenViews.includes(currentView) || (currentView === 'chat-room' && selectedChatRoom)

  if (isFullScreen) {
    return loading ? <LoadingSpinner /> : component
  }

  return (
    <LazyLayout>
      {loading ? <LoadingSpinner /> : component}
    </LazyLayout>
  )
}
