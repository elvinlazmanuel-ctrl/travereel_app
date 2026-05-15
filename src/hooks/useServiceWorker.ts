'use client'

import { useEffect, useState, useCallback } from 'react'

interface UseServiceWorkerReturn {
  isOnline: boolean
  isOffline: boolean
  serviceWorkerReady: boolean
  showInstallPrompt: boolean
  installApp: () => Promise<void>
  registerServiceWorker: () => Promise<void>
}

export function useServiceWorker(): UseServiceWorkerReturn {
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof window !== 'undefined') {
      return navigator.onLine
    }
    return true
  })
  const [serviceWorkerReady, setServiceWorkerReady] = useState(false)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  // Register service worker
  const registerServiceWorker = useCallback(async () => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      console.log('[PWA] Service workers not supported')
      return
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js')
      console.log('[PWA] Service Worker registered:', registration.scope)
      setServiceWorkerReady(true)

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        newWorker?.addEventListener('statechange', () => {
          console.log('[PWA] Service Worker state changed:', newWorker.state)
        })
      })
    } catch (error) {
      console.error('[PWA] Service Worker registration failed:', error)
    }
  }, [])

  // Install app
  const installApp = useCallback(async () => {
    if (!deferredPrompt) {
      console.log('[PWA] No install prompt available')
      return
    }

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      console.log('[PWA] User choice:', outcome)
      setDeferredPrompt(null)
      setShowInstallPrompt(false)
    } catch (error) {
      console.error('[PWA] Install prompt failed:', error)
    }
  }, [deferredPrompt])

  // Setup online/offline detection
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleOnline = () => {
      setIsOnline(true)
      console.log('[PWA] App is online')
    }

    const handleOffline = () => {
      setIsOnline(false)
      console.log('[PWA] App is offline')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Setup install prompt
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      console.log('[PWA] beforeinstallprompt fired')
      setDeferredPrompt(e)
      setShowInstallPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  // Register service worker on mount
  useEffect(() => {
    registerServiceWorker()
  }, [registerServiceWorker])

  return {
    isOnline,
    isOffline: !isOnline,
    serviceWorkerReady,
    showInstallPrompt,
    installApp,
    registerServiceWorker,
  }
}
