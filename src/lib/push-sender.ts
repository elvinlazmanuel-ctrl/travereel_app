import { initializeWebPush, webpush } from './push-notification'
import { db } from '@/lib/db'

interface PushNotificationPayload {
  userId: string
  title: string
  body: string
  url?: string
  icon?: string
  tag?: string
  type?: string
  requireInteraction?: boolean
  silent?: boolean
  notificationId?: string
}

export async function sendPushNotification(payload: PushNotificationPayload) {
  try {
    // Initialize web push with VAPID keys
    initializeWebPush()

    // Get user's active push subscriptions
    const subscriptions = await (db as any).pushSubscription.findMany({
      where: {
        userId: payload.userId,
        isActive: true,
      },
    })

    if (!subscriptions || subscriptions.length === 0) {
      console.log(`[Push] No active subscriptions found for user ${payload.userId}`)
      return { success: false, reason: 'No subscriptions' }
    }

    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url || '/',
      icon: payload.icon || '/logo.png',
      tag: payload.tag || 'travereel-notification',
      type: payload.type || 'general',
      requireInteraction: payload.requireInteraction || false,
      silent: payload.silent || false,
      notificationId: payload.notificationId,
    })

    const sendResults = await Promise.allSettled(
      subscriptions.map(async (subscription: any) => {
        try {
          const pushSubscription = {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          }

          await webpush.sendNotification(pushSubscription, notificationPayload)

          // Update lastUsedAt
          await (db as any).pushSubscription.update({
            where: { id: subscription.id },
            data: { lastUsedAt: new Date() },
          })

          return { success: true, endpoint: subscription.endpoint }
        } catch (error: any) {
          console.error(`[Push] Failed to send to ${subscription.endpoint}:`, error)

          // If subscription is no longer valid (410 Gone), mark as inactive
          if (error.statusCode === 410) {
            await (db as any).pushSubscription.update({
              where: { id: subscription.id },
              data: { isActive: false },
            })
          }

          return { success: false, endpoint: subscription.endpoint, error: error.message }
        }
      })
    )

    const successful = sendResults.filter(
      (r) => r.status === 'fulfilled' && (r as PromiseFulfilledResult<any>).value.success
    ).length

    const failed = sendResults.length - successful

    console.log(`[Push] Sent ${successful} notifications, ${failed} failed for user ${payload.userId}`)

    return {
      success: successful > 0,
      sent: successful,
      failed,
      results: sendResults,
    }
  } catch (error) {
    console.error('[Push] Error sending push notification:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function sendBulkPushNotifications(
  userIds: string[],
  title: string,
  body: string,
  options?: Partial<PushNotificationPayload>
) {
  const results = await Promise.allSettled(
    userIds.map((userId) =>
      sendPushNotification({
        userId,
        title,
        body,
        ...options,
      })
    )
  )

  const successful = results.filter(
    (r) => r.status === 'fulfilled' && (r as PromiseFulfilledResult<any>).value.success
  ).length

  const failed = results.length - successful

  console.log(`[Push] Bulk send: ${successful} users succeeded, ${failed} failed`)

  return { successful, failed, total: userIds.length }
}
