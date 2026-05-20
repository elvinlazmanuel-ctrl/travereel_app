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
    <nav className="fixed bottom-0 left-0 right-0 z-50 w-full px-4 pb-2 safe-area-pb">
      {/* Glass morphism floating navigation */}
      <div className="mx-auto max-w-lg glass rounded-2xl shadow-glass border border-white/20 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80">
        <div className="flex justify-around items-center h-16 px-2">
          {navItems.map((item) => {
            const active = isActive(item.view)
            const isCreate = item.view === 'create'
            const Icon = item.icon

            return (
              <button
                key={item.view}
                onClick={() => handleTap(item.view)}
                className="flex flex-col items-center justify-center gap-1 relative outline-none focus:outline-none group transition-all duration-200"
                aria-label={item.label}
              >
                {isCreate ? (
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF6B6B] via-[#FF8C42] to-[#FFBA49] shadow-lg shadow-[#FF6B6B]/40 -mt-8 hover:shadow-xl hover:shadow-[#FF6B6B]/50 transition-all"
                  >
                    <PlusCircle className="size-8 text-white" strokeWidth={2.5} />
                  </motion.div>
                ) : (
                  <div className="relative flex items-center justify-center">
                    {/* Active background glow */}
                    {active && (
                      <motion.div
                        layoutId="navGlow"
                        className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#FF6B6B]/10 to-[#2EC4B6]/10"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}
                    
                    {/* Icon */}
                    <Icon
                      className={`size-6 transition-all duration-200 relative z-10 ${
                        active
                          ? 'text-[#FF6B6B] scale-110 drop-shadow-sm' 
                          : 'text-muted-foreground group-hover:text-[#2EC4B6]'
                      }`}
                      strokeWidth={active ? 2.5 : 1.8}
                    />
                    
                    {/* Active indicator dot */}
                    {active && (
                      <motion.div
                        layoutId="bottomNavIndicator"
                        className="absolute -bottom-2 w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#FF6B6B] to-[#2EC4B6] shadow-sm"
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                    
                    {/* Notification badge */}
                    {item.view === 'community' && (hasUnreadNotifications || pendingFriendRequestCount > 0) && (
                      <motion.span 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-gradient-to-r from-[#FF6B6B] to-[#FF8C42] border-2 border-white dark:border-slate-900 shadow-md"
                      />
                    )}
                  </div>
                )}
                
                {/* Label */}
                {!isCreate && (
                  <span
                    className={`text-[11px] font-medium leading-tight transition-all ${
                      active 
                        ? 'text-[#FF6B6B] font-semibold' 
                        : 'text-muted-foreground group-hover:text-[#2EC4B6]'
                    }`}
                  >
                    {item.label}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
