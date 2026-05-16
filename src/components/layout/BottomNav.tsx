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
    <nav className="fixed bottom-0 left-0 right-0 z-50 w-full h-16 bg-background/90 backdrop-blur-xl border-t border-border/50 flex justify-around items-center px-3 safe-area-pb shadow-2xl">
      {navItems.map((item) => {
        const active = isActive(item.view)
        const isCreate = item.view === 'create'
        const Icon = item.icon

        return (
          <button
            key={item.view}
            onClick={() => handleTap(item.view)}
            className="flex flex-col items-center justify-center gap-1 relative outline-none focus:outline-none group"
            aria-label={item.label}
          >
            {isCreate ? (
              <motion.div
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.05 }}
                className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF6B6B] via-[#FF8C42] to-[#FFBA49] shadow-lg shadow-[#FF6B6B]/30 -mt-4"
              >
                <PlusCircle className="size-7 text-white" strokeWidth={2.5} />
              </motion.div>
            ) : (
              <div className="relative flex items-center justify-center">
                <Icon
                  className={`size-6 transition-all duration-200 ${
                    active
                      ? 'text-[#FF6B6B] fill-[#FF6B6B]/20 scale-110' 
                      : 'text-muted-foreground group-hover:text-[#2EC4B6]'
                  }`}
                  strokeWidth={active ? 2.5 : 1.8}
                />
                {active && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute -bottom-1.5 w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#FF6B6B] to-[#FF8C42]"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
                {/* Notification indicator for Community icon */}
                {item.view === 'community' && (hasUnreadNotifications || pendingFriendRequestCount > 0) && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-gradient-to-r from-[#FF6B6B] to-[#FF8C42] border-2 border-background shadow-sm" />
                )}
              </div>
            )}
            {!isCreate && (
              <span
                className={`text-[11px] leading-tight transition-all ${
                  active ? 'text-[#FF6B6B] font-bold' : 'text-muted-foreground group-hover:text-[#2EC4B6]'
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
