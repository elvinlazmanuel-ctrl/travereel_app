'use client'

import { useEffect, useState, useCallback } from 'react'

interface PWAState {
  isInstalled: boolean
  isOnline: boolean
  serviceWorkerReady: boolean
  deferredPrompt: Event | null
}

export function usePWA() {
  const [state, setState] = useState<PWAState>(() => ({
    isInstalled: typeof window !== 'undefined' && (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches
    ),
    isOnline: typeof window !== 'undefined' ? navigator.onLine : true,
    serviceWorkerReady: false,
    deferredPrompt: null,
  }))

  // Register service worker
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return
    }

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        })

        console.log('[PWA] Service Worker registered:', registration.scope)

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          console.log('[PWA] New Service Worker version available')

          newWorker?.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New update available
              console.log('[PWA] Update available - refresh to get latest version')
            }
          })
        })

        setState((prev) => ({ ...prev, serviceWorkerReady: true }))
      } catch (error) {
        console.error('[PWA] Service Worker registration failed:', error)
      }
    }

    registerSW()
  }, [])

  // Check if app is installed
  useEffect(() => {
    // Listen for changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)')
    const handleChange = (e: MediaQueryListEvent) => {
      setState((prev) => ({ ...prev, isInstalled: e.matches }))
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // Online/offline status
  useEffect(() => {
    const handleOnline = () => setState((prev) => ({ ...prev, isOnline: true }))
    const handleOffline = () => setState((prev) => ({ ...prev, isOnline: false }))

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Listen for install prompt
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setState((prev) => ({ ...prev, deferredPrompt: e }))
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  // Install app
  const installApp = useCallback(async () => {
    if (!state.deferredPrompt) {
      console.log('[PWA] No install prompt available')
      return false
    }

    try {
      await (state.deferredPrompt as any).prompt()
      const { outcome } = await (state.deferredPrompt as any).userChoice

      setState((prev) => ({ ...prev, deferredPrompt: null }))

      if (outcome === 'accepted') {
        console.log('[PWA] User accepted install')
        setState((prev) => ({ ...prev, isInstalled: true }))
        return true
      } else {
        console.log('[PWA] User dismissed install')
        return false
      }
    } catch (error) {
      console.error('[PWA] Install error:', error)
      return false
    }
  }, [state.deferredPrompt])

  return {
    ...state,
    installApp,
    canInstall: !!state.deferredPrompt && !state.isInstalled,
  }
}
