'use client'

import { useEffect, useState } from 'react'
import { WifiOff, RefreshCw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof window !== 'undefined') {
      return navigator.onLine
    }
    return true
  })
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleOnline = () => {
      setIsOnline(true)
      // Keep banner visible for 3 seconds after reconnecting
      setTimeout(() => setShowBanner(false), 3000)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowBanner(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleReload = () => {
    window.location.reload()
  }

  return (
    <AnimatePresence>
      {showBanner && !isOnline && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-50 bg-amber-500 dark:bg-amber-600 text-white shadow-lg"
        >
          <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <WifiOff className="size-5" />
              <div>
                <p className="text-sm font-semibold">You're offline</p>
                <p className="text-xs opacity-90">
                  Some features may not be available until you reconnect
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleReload}
              className="shrink-0 h-8 px-3"
            >
              <RefreshCw className="size-3.5 mr-1.5" />
              Retry
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
