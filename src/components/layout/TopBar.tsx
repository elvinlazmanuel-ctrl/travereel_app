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
      <header className="sticky top-0 z-40 w-full h-14 bg-background/80 backdrop-blur-xl border-b border-border/50 flex items-center justify-between px-4">
        <h1 className="text-xl font-bold bg-gradient-to-r from-[#FF6B6B] via-[#FF8C42] to-[#FFBA49] bg-clip-text text-transparent">
          Travereel
        </h1>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="relative rounded-full hover:bg-muted/50 transition-all"
            onClick={() => setCurrentView('friends')}
            aria-label="Friends"
          >
            <UserPlus className="size-5 text-muted-foreground" />
            {pendingFriendRequestCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[18px] h-4.5 rounded-full bg-gradient-to-r from-[#FF6B6B] to-[#FF8C42] text-white text-[10px] font-bold flex items-center justify-center px-1 shadow-md">
                {pendingFriendRequestCount > 9 ? '9+' : pendingFriendRequestCount}
              </span>
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="relative rounded-full hover:bg-muted/50 transition-all"
            onClick={() => setCurrentView('notifications')}
            aria-label="Notifications"
          >
            <Bell className="size-5 text-muted-foreground" />
            {hasUnreadNotifications && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-gradient-to-r from-[#FF6B6B] to-[#FF8C42] shadow-md" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="relative rounded-full hover:bg-muted/50 transition-all"
            onClick={() => setCurrentView('messages')}
            aria-label="Messages"
          >
            <Mail className="size-5 text-muted-foreground" />
            {hasUnreadMessages && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-gradient-to-r from-[#FF6B6B] to-[#FF8C42] shadow-md" />
            )}
          </Button>
        </div>
      </header>
    )
  }

  // Discovery view: title (search is handled within DiscoveryPage)
  if (currentView === 'discovery') {
    return (
      <header className="sticky top-0 z-40 w-full h-14 bg-background border-b border-border flex items-center justify-between px-4">
        <h1 className="text-lg font-semibold text-foreground">Discover</h1>
        <Button variant="ghost" size="icon" aria-label="Search">
          <Search className="size-5 text-muted-foreground" />
        </Button>
      </header>
    )
  }

  // Community view: title
  if (currentView === 'community') {
    return (
      <header className="sticky top-0 z-40 w-full h-14 bg-background border-b border-border flex items-center px-4">
        <h1 className="text-lg font-semibold text-foreground">Communities</h1>
      </header>
    )
  }

  // Profile view: username + dropdown
  if (currentView === 'profile') {
    return (
      <header className="sticky top-0 z-40 w-full h-14 bg-background border-b border-border flex items-center justify-between px-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1 outline-none">
              <span className="text-lg font-bold text-foreground">
                {currentUser?.username || 'Profile'}
              </span>
              <svg
                className="size-4 text-muted-foreground"
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
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem onClick={() => setCurrentView('settings')}>
              <Settings className="size-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={logout} className="text-[#FF6B6B]">
              <LogOut className="size-4 mr-2" />
              Log Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="ghost" size="icon" aria-label="Menu">
          <div className="flex flex-col gap-0.5">
            <div className="w-5 h-0.5 bg-muted-foreground rounded" />
            <div className="w-5 h-0.5 bg-muted-foreground rounded" />
            <div className="w-5 h-0.5 bg-muted-foreground rounded" />
          </div>
        </Button>
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
    <header className="sticky top-0 z-40 w-full h-14 bg-background border-b border-border flex items-center px-4 gap-3">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => {
          if (previousView) {
            setCurrentView(previousView)
          } else {
            setCurrentView('feed')
          }
        }}
        aria-label="Go back"
      >
        <ArrowLeft className="size-5 text-muted-foreground" />
      </Button>
      <h2 className="text-lg font-semibold text-foreground">{getTitle()}</h2>
    </header>
  )
}
