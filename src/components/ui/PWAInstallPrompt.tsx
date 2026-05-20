'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, X, Share, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(() => {
    // Check if already installed during initialization
    return typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches
  })

  useEffect(() => {
    // Listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      
      // Show prompt after 3 seconds (don't be too aggressive)
      setTimeout(() => {
        setShowPrompt(true)
      }, 3000)
    }

    window.addEventListener('beforeinstallprompt', handler)

    // Listen for app installed
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true)
      setShowPrompt(false)
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        console.log('✅ User accepted the install prompt')
      } else {
        console.log('❌ User dismissed the install prompt')
      }
      
      setDeferredPrompt(null)
      setShowPrompt(false)
    } catch (error) {
      console.error('Install prompt error:', error)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    // Don't show again for this session
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('pwa-install-dismissed', 'true')
    }
  }

  // Don't show if already installed or dismissed
  // Check sessionStorage only on client-side
  const isDismissed = typeof window !== 'undefined' && sessionStorage.getItem('pwa-install-dismissed')
  
  if (isInstalled || isDismissed) {
    return null
  }

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm"
        >
          <div className="bg-card border border-border rounded-2xl shadow-2xl p-4 backdrop-blur-sm">
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted transition-colors"
              aria-label="Dismiss install prompt"
            >
              <X className="size-4 text-muted-foreground" />
            </button>

            {/* Content */}
            <div className="flex items-start gap-3">
              <div className="size-12 rounded-xl bg-gradient-to-br from-[#2F5C9B] to-[#5CA5CD] flex items-center justify-center shrink-0">
                <Download className="size-6 text-white" />
              </div>

              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">
                  Install Travereel
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Get the app experience on your device. Fast, offline-ready, and always up to date!
                </p>

                <div className="flex flex-wrap gap-2 mb-3">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Monitor className="size-3" />
                    <span>Works offline</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Download className="size-3" />
                    <span>Instant updates</span>
                  </div>
                </div>

                {/* Install buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={handleInstall}
                    size="sm"
                    className="flex-1 bg-gradient-to-r from-[#2F5C9B] to-[#5CA5CD] text-white hover:opacity-90"
                  >
                    <Download className="size-4 mr-1" />
                    Install App
                  </Button>
                  
                  {/* iOS instructions */}
                  {isIOS() && (
                    <Button
                      onClick={handleDismiss}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Share className="size-4 mr-1" />
                      Share → Add to Home
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Helper to detect iOS
function isIOS() {
  return [
    'iPad Simulator',
    'iPhone Simulator',
    'iPod Simulator',
    'iPad',
    'iPhone',
    'iPod',
  ].includes(navigator.platform) || 
  (navigator.userAgent.includes('Mac') && 'ontouchend' in document)
}
