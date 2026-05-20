'use client'

import { Bell, Send, ArrowLeft, Search, Mail, UserPlus } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Settings, LogOut } from 'lucide-react'

export default function TopBar() {
  const { currentView, setCurrentView, currentUser, logout, previousView, hasUnreadNotifications, hasUnreadMessages, pendingFriendRequestCount } = useAppStore()

  // Feed view: logo + icons
  if (currentView === 'feed') {
    return (
      <header className="sticky top-0 z-40 w-full px-4 pt-2">
        <div className="glass rounded-2xl shadow-glass border border-white/20 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80">
          <div className="flex items-center justify-between h-14 px-4">
            {/* Logo with travel theme */}
            <h1 className="flex items-center gap-2 text-xl font-bold text-gradient-sky hover:scale-105 transition-transform cursor-default">
              <img src="/new-logo.png" alt="Travereel" className="h-8 w-8" />
              Travereel
            </h1>
            
            {/* Action buttons */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="relative rounded-xl hover:bg-gradient-to-br hover:from-[#2F5C9B]/10 hover:to-[#5CA5CD]/10 transition-all"
                onClick={() => setCurrentView('friends')}
                aria-label="Friends"
              >
                <UserPlus className="size-5 text-muted-foreground hover:text-[#2F5C9B] transition-colors" />
                {pendingFriendRequestCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 min-w-[18px] h-4.5 rounded-full bg-gradient-to-r from-[#2F5C9B] to-[#5CA5CD] text-white text-[10px] font-bold flex items-center justify-center px-1 shadow-md animate-pulse">
                    {pendingFriendRequestCount > 9 ? '9+' : pendingFriendRequestCount}
                  </span>
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="relative rounded-xl hover:bg-gradient-to-br hover:from-[#2F5C9B]/10 hover:to-[#5CA5CD]/10 transition-all"
                onClick={() => setCurrentView('notifications')}
                aria-label="Notifications"
              >
                <Bell className="size-5 text-muted-foreground hover:text-[#2F5C9B] transition-colors" />
                {hasUnreadNotifications && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-gradient-to-r from-[#2F5C9B] to-[#5CA5CD] shadow-md animate-pulse" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="relative rounded-xl hover:bg-gradient-to-br hover:from-[#2F5C9B]/10 hover:to-[#5CA5CD]/10 transition-all"
                onClick={() => setCurrentView('messages')}
                aria-label="Messages"
              >
                <Mail className="size-5 text-muted-foreground hover:text-[#2F5C9B] transition-colors" />
                {hasUnreadMessages && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-gradient-to-r from-[#2F5C9B] to-[#5CA5CD] shadow-md animate-pulse" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>
    )
  }

  // Discovery view: title (search is handled within DiscoveryPage)
  if (currentView === 'discovery') {
    return (
      <header className="sticky top-0 z-40 w-full px-4 pt-2">
        <div className="glass rounded-2xl shadow-glass border border-white/20 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80">
          <div className="flex items-center justify-between h-14 px-4">
            <h1 className="text-lg font-semibold text-gradient-sunset">🧭 Discover</h1>
            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-gradient-to-br hover:from-[#2F5C9B]/10 hover:to-[#5CA5CD]/10 transition-all" aria-label="Search">
              <Search className="size-5 text-muted-foreground hover:text-[#2F5C9B] transition-colors" />
            </Button>
          </div>
        </div>
      </header>
    )
  }

  // Community view: title
  if (currentView === 'community') {
    return (
      <header className="sticky top-0 z-40 w-full px-4 pt-2">
        <div className="glass rounded-2xl shadow-glass border border-white/20 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80">
          <div className="flex items-center h-14 px-4">
            <h1 className="text-lg font-semibold text-gradient-ocean">👥 Communities</h1>
          </div>
        </div>
      </header>
    )
  }

  // Profile view: username + dropdown
  if (currentView === 'profile') {
    return (
      <header className="sticky top-0 z-40 w-full px-4 pt-2">
        <div className="glass rounded-2xl shadow-glass border border-white/20 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80">
          <div className="flex items-center justify-between h-14 px-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 outline-none group">
                  <span className="text-lg font-bold text-gradient-sunset group-hover:scale-105 transition-transform">
                    {currentUser?.username || 'Profile'}
                  </span>
                  <svg
                    className="size-4 text-muted-foreground group-hover:text-[#2F5C9B] transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48 glass">
                <DropdownMenuItem onClick={() => setCurrentView('settings')}>
                  <Settings className="size-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout} className="text-[#E58BEA]">
                  <LogOut className="size-4 mr-2" />
                  Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-gradient-to-br hover:from-[#2F5C9B]/10 hover:to-[#5CA5CD]/10 transition-all" aria-label="Settings" onClick={() => setCurrentView('settings')}>
              <Settings className="size-5 text-muted-foreground hover:text-[#2F5C9B] transition-colors" />
            </Button>
          </div>
        </div>
      </header>
    )
  }

  // Default: back arrow + title
  const getTitle = () => {
    switch (currentView) {
      case 'notifications':
        return 'Notifications'
      case 'create-post':
        return 'New Post'
      case 'create-story':
        return 'New Story'
      case 'itinerary':
        return 'Itineraries'
      case 'itinerary-detail':
        return 'Itinerary Details'
      case 'during-travel':
        return 'During Travel'
      case 'post-travel':
        return 'Post Travel'
      case 'story-viewer':
        return 'Story'
      case 'budget-tracker':
        return 'Budget Tracker'
      case 'settings':
        return 'Settings'
      case 'messages':
        return 'Messages'
      case 'friends':
        return 'Friends'
      case 'chat-room':
        return 'Chat'
      case 'user-profile':
        return 'Profile'
      case 'admin':
        return 'Admin'
      case 'admin-users':
        return 'User Management'
      case 'admin-communities':
        return 'Community Management'
      case 'admin-posts':
        return 'Post Management'
      default:
        return ''
    }
  }

  // Admin views handle their own back buttons
  if (['admin', 'admin-users', 'admin-communities', 'admin-posts'].includes(currentView)) {
    return null
  }

  return (
    <header className="sticky top-0 z-40 w-full px-4 pt-2">
      <div className="glass rounded-2xl shadow-glass border border-white/20 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80">
        <div className="flex items-center h-14 px-4 gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl hover:bg-gradient-to-br hover:from-[#2F5C9B]/10 hover:to-[#5CA5CD]/10 transition-all"
            onClick={() => {
              if (previousView) {
                setCurrentView(previousView)
              } else {
                setCurrentView('feed')
              }
            }}
            aria-label="Go back"
          >
            <ArrowLeft className="size-5 text-muted-foreground hover:text-[#2F5C9B] transition-colors" />
          </Button>
          <h2 className="text-lg font-semibold text-gradient-sunset">{getTitle()}</h2>
        </div>
      </div>
    </header>
  )
}
