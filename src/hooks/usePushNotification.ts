'use client'

import { useEffect, useState, useCallback } from 'react'

interface PushNotificationState {
  isSupported: boolean
  permission: NotificationPermission
  isSubscribed: boolean
  subscription: PushSubscription | null
  error: string | null
}

export function usePushNotification() {
  const [state, setState] = useState<PushNotificationState>(() => ({
    isSupported: typeof window !== 'undefined' && 'PushManager' in window && 'serviceWorker' in navigator,
    permission: typeof window !== 'undefined' ? Notification.permission : 'default',
    isSubscribed: false,
    subscription: null,
    error: null,
  }))

  // Check current subscription status
  const checkSubscription = useCallback(async () => {
    if (!state.isSupported) return

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      
      setState((prev) => ({
        ...prev,
        isSubscribed: !!subscription,
        subscription,
      }))
    } catch (error) {
      console.error('[Push] Error checking subscription:', error)
    }
  }, [state.isSupported])

  // Subscribe to push notifications
  const subscribe = useCallback(async () => {
    if (!state.isSupported) {
      setState((prev) => ({ ...prev, error: 'Push notifications are not supported in this browser' }))
      return false
    }

    try {
      // Request permission
      const permission = await Notification.requestPermission()
      
      setState((prev) => ({ ...prev, permission }))

      if (permission !== 'granted') {
        setState((prev) => ({ ...prev, error: 'Notification permission denied' }))
        return false
      }

      // Get VAPID public key
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidPublicKey) {
        throw new Error('VAPID public key not configured')
      }

      // Convert VAPID key from base64 to Uint8Array
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey)

      // Subscribe to push manager
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      })

      // Send subscription to server
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subscription }),
      })

      if (!response.ok) {
        throw new Error('Failed to save subscription on server')
      }

      setState((prev) => ({
        ...prev,
        isSubscribed: true,
        subscription,
        error: null,
      }))

      console.log('[Push] Successfully subscribed to push notifications')
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to subscribe to push notifications'
      console.error('[Push] Subscription error:', error)
      setState((prev) => ({ ...prev, error: errorMessage }))
      return false
    }
  }, [state.isSupported])

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    if (!state.subscription) return false

    try {
      await state.subscription.unsubscribe()

      // Remove subscription from server
      const response = await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint: state.subscription.endpoint,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to remove subscription from server')
      }

      setState((prev) => ({
        ...prev,
        isSubscribed: false,
        subscription: null,
        error: null,
      }))

      console.log('[Push] Successfully unsubscribed from push notifications')
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to unsubscribe'
      console.error('[Push] Unsubscribe error:', error)
      setState((prev) => ({ ...prev, error: errorMessage }))
      return false
    }
  }, [state.subscription])

  // Check subscription on mount
  useEffect(() => {
    if (state.isSupported) {
      checkSubscription()
    }
  }, [state.isSupported, checkSubscription])

  return {
    ...state,
    subscribe,
    unsubscribe,
    checkSubscription,
  }
}

// Helper function to convert base64 to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray as Uint8Array
}
