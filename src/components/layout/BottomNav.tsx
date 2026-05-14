'use client'

import { Home, Compass, PlusCircle, Users, User } from 'lucide-react'
import { useAppStore, type ViewType } from '@/lib/store'
import { motion } from 'framer-motion'

const navItems: { icon: typeof Home; label: string; view: ViewType }[] = [
  { icon: Home, label: 'Home', view: 'feed' },
  { icon: Compass, label: 'Discovery', view: 'discovery' },
  { icon: PlusCircle, label: 'Create', view: 'create' },
  { icon: Users, label: 'Community', view: 'community' },
  { icon: User, label: 'Profile', view: 'profile' },
]

export default function BottomNav() {
  const { currentView, setCurrentView, setShowCreateMenu, hasUnreadNotifications, pendingFriendRequestCount } = useAppStore()

  const handleTap = (view: ViewType) => {
    if (view === 'create') {
      setShowCreateMenu(true)
    } else {
      setCurrentView(view)
    }
  }

  const isActive = (view: ViewType) => {
    if (view === 'create') return false
    return currentView === view
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 w-full h-14 bg-background border-t border-border flex justify-around items-center px-2 safe-area-pb">
      {navItems.map((item) => {
        const active = isActive(item.view)
        const isCreate = item.view === 'create'
        const Icon = item.icon

        return (
          <button
            key={item.view}
            onClick={() => handleTap(item.view)}
            className="flex flex-col items-center justify-center gap-0.5 relative outline-none focus:outline-none"
            aria-label={item.label}
          >
            {isCreate ? (
              <motion.div
                whileTap={{ scale: 0.9 }}
                className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-[#FF6B6B] via-[#FF8C42] to-[#FFBA49]"
              >
                <PlusCircle className="size-6 text-white" strokeWidth={2.5} />
              </motion.div>
            ) : (
              <div className="relative flex items-center justify-center">
                <Icon
                  className={`size-6 transition-colors duration-200 ${
                    active
                      ? 'text-[#FF6B6B] fill-[#FF6B6B]/20'
                      : 'text-muted-foreground'
                  }`}
                  strokeWidth={active ? 2.5 : 1.8}
                />
                {active && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute -bottom-1 w-1 h-1 rounded-full bg-[#FF6B6B]"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
                {/* Notification indicator for Community icon */}
                {item.view === 'community' && (hasUnreadNotifications || pendingFriendRequestCount > 0) && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#FF6B6B]" />
                )}
              </div>
            )}
            {!isCreate && (
              <span
                className={`text-[10px] leading-tight ${
                  active ? 'text-[#FF6B6B] font-semibold' : 'text-muted-foreground'
                }`}
              >
                {item.label}
              </span>
            )}
          </button>
        )
      })}
    </nav>
  )
}
