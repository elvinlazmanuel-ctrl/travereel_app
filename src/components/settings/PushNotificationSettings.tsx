'use client'

import { useState } from 'react'
import { Bell, BellOff, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { usePushNotification } from '@/hooks/usePushNotification'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function PushNotificationSettings() {
  const { isSupported, permission, isSubscribed, error, subscribe, unsubscribe } = usePushNotification()
  const [isLoading, setIsLoading] = useState(false)

  const handleToggle = async () => {
    setIsLoading(true)
    try {
      if (isSubscribed) {
        await unsubscribe()
      } else {
        await subscribe()
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Stay updated with real-time notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Push notifications are not supported in your browser. Please try using a modern browser like Chrome, Firefox, or Edge.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isSubscribed ? (
            <Bell className="h-5 w-5" />
          ) : (
            <BellOff className="h-5 w-5" />
          )}
          Push Notifications
        </CardTitle>
        <CardDescription>
          Get notified about likes, comments, messages, and more
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Status</p>
              <p className="text-sm text-muted-foreground">
                {isSubscribed ? 'Receiving push notifications' : 'Not subscribed to push notifications'}
              </p>
            </div>
            {isSubscribed ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <BellOff className="h-5 w-5 text-muted-foreground" />
            )}
          </div>

          {permission === 'granted' && (
            <p className="text-sm text-muted-foreground">
              Browser permission: ✓ Granted
            </p>
          )}

          {permission === 'denied' && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Notification permission has been denied. To enable push notifications, please update your browser settings.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <Button
          onClick={handleToggle}
          disabled={isLoading || permission === 'denied'}
          className="w-full"
          variant={isSubscribed ? 'outline' : 'default'}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isSubscribed ? 'Disabling...' : 'Enabling...'}
            </>
          ) : isSubscribed ? (
            <>
              <BellOff className="mr-2 h-4 w-4" />
              Disable Push Notifications
            </>
          ) : (
            <>
              <Bell className="mr-2 h-4 w-4" />
              Enable Push Notifications
            </>
          )}
        </Button>

        {isSubscribed && (
          <p className="text-xs text-muted-foreground text-center">
            You can disable push notifications at any time from your browser settings
          </p>
        )}
      </CardContent>
    </Card>
  )
}
