# Push Notification Setup Guide for Travereel

## Overview

Push notifications have been successfully integrated into Travereel using the Web Push API. This allows you to send real-time notifications to users even when they're not actively using the app.

## Features Implemented

✅ **Client-Side**:
- Service worker enhanced with push notification handlers
- `usePushNotification` hook for subscription management
- UI component for notification preferences
- Automatic subscription/unsubscription

✅ **Server-Side**:
- VAPID key generation utility
- Push subscription storage in database
- API routes for subscription management
- Push notification sender utility
- Integration with existing notification system

✅ **Notifications Triggers**:
- Likes on posts
- Comments on posts
- New followers
- Friend requests
- Direct messages
- Post shares
- Mentions

## Setup Instructions

### 1. Generate VAPID Keys

VAPID (Voluntary Application Server Identification) keys are required for push notifications. Generate them once:

```bash
npx ts-node scripts/generate-vapid-keys.ts
```

This will output two keys:
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` - Safe to expose in client-side code
- `VAPID_PRIVATE_KEY` - **KEEP THIS SECRET** - never expose this

### 2. Update Environment Variables

Add the generated keys to your `.env` file:

```env
# Push Notification VAPID Keys
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BNx...your-public-key-here
VAPID_PRIVATE_KEY=K7g...your-private-key-here
```

**Important**: The `NEXT_PUBLIC_` prefix is required for the public key to be accessible in client-side code.

### 3. Run Database Migration

The push notification subscriptions need to be stored in the database:

```bash
npx prisma db push
```

Or if you're using migrations:

```bash
npx prisma migrate dev
```

This will create the `PushSubscription` table.

### 4. Regenerate Prisma Client

```bash
npx prisma generate
```

### 5. Restart Development Server

```bash
npm run dev
```

## Usage

### For Users

1. Navigate to Settings page
2. Find the "Push Notifications" section
3. Click "Enable Push Notifications"
4. Accept the browser permission prompt
5. You're now subscribed! You'll receive push notifications for:
   - New likes on your posts
   - New comments
   - New followers
   - Friend requests
   - Direct messages
   - And more...

### For Developers

#### Sending Push Notifications

```typescript
import { sendPushNotification } from '@/lib/push-sender'

// Send to a single user
await sendPushNotification({
  userId: 'user-id-here',
  title: 'New Message',
  body: 'John sent you a message',
  url: '/messages',
  type: 'message',
  tag: 'travereel-message',
})

// Send to multiple users
import { sendBulkPushNotifications } from '@/lib/push-sender'

await sendBulkPushNotifications(
  ['user-id-1', 'user-id-2', 'user-id-3'],
  'System Update',
  'New features are now available!',
  { url: '/settings', type: 'system' }
)
```

#### Checking Subscription Status

```typescript
import { usePushNotification } from '@/hooks/usePushNotification'

function MyComponent() {
  const { isSubscribed, permission, subscribe, unsubscribe } = usePushNotification()
  
  // isSubscribed: boolean - whether user is subscribed
  // permission: 'granted' | 'denied' | 'default' - browser permission
  // subscribe(): Promise<boolean> - subscribe to push notifications
  // unsubscribe(): Promise<boolean> - unsubscribe from push notifications
}
```

## Architecture

### Database Schema

```prisma
model PushSubscription {
  id              String   @id @default(cuid())
  userId          String
  endpoint        String   @unique
  p256dh          String
  auth            String
  userAgent       String?
  createdAt       DateTime @default(now())
  lastUsedAt      DateTime @default(now())
  isActive        Boolean  @default(true)
  
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

### API Endpoints

- `POST /api/push/subscribe` - Save/update push subscription
- `POST /api/push/unsubscribe` - Remove push subscription
- `GET /api/push/vapid-public-key` - Get VAPID public key

### File Structure

```
src/
├── hooks/
│   └── usePushNotification.ts          # Client-side hook
├── lib/
│   ├── push-notification.ts            # VAPID configuration
│   └── push-sender.ts                  # Server-side sender
├── app/api/push/
│   ├── subscribe/route.ts              # Subscribe endpoint
│   ├── unsubscribe/route.ts            # Unsubscribe endpoint
│   └── vapid-public-key/route.ts       # Get public key
└── components/settings/
    └── PushNotificationSettings.tsx    # Settings UI

public/
└── sw.js                               # Service worker (enhanced)

scripts/
└── generate-vapid-keys.ts              # VAPID key generator

prisma/
└── schema.prisma                       # Updated with PushSubscription
```

## Browser Support

Push notifications are supported in:
- ✅ Chrome/Edge (Desktop & Mobile)
- ✅ Firefox (Desktop)
- ✅ Safari (macOS)
- ❌ Firefox Mobile (limited support)
- ❌ iOS Safari (requires native app)

## Testing

### Local Testing

1. Push notifications require HTTPS in production
2. For local testing, `localhost` is treated as a secure origin
3. Test on Chrome/Edge for best results

### Testing Checklist

- [ ] Generate VAPID keys
- [ ] Add keys to `.env`
- [ ] Run `prisma db push`
- [ ] Start dev server
- [ ] Navigate to settings
- [ ] Enable push notifications
- [ ] Accept browser permission
- [ ] Trigger a test notification (like your own post from another account)
- [ ] Verify notification appears
- [ ] Click notification to verify navigation
- [ ] Test unsubscribe/resubscribe

## Troubleshooting

### "VAPID keys not found" Error

**Solution**: Generate VAPID keys and add them to `.env`:
```bash
npx ts-node scripts/generate-vapid-keys.ts
```

### "Push notifications are not supported" Message

**Solution**: Use a supported browser (Chrome, Edge, Firefox)

### Permission Denied

**Solution**: 
1. Click the lock icon in the address bar
2. Change notification permission to "Allow"
3. Refresh the page
4. Try enabling again

### Subscriptions Not Saving

**Solution**:
1. Check browser console for errors
2. Verify database migration was run
3. Check that user is authenticated
4. Verify API routes are accessible

### Notifications Not Appearing

**Solution**:
1. Check browser notification settings
2. Verify service worker is registered (`chrome://serviceworker-internals/`)
3. Check server logs for push send errors
4. Verify VAPID keys are correct
5. Check that user has active subscriptions in database

## Production Deployment

### Vercel

1. Add VAPID keys to Vercel environment variables:
   ```bash
   vercel env add NEXT_PUBLIC_VAPID_PUBLIC_KEY
   vercel env add VAPID_PRIVATE_KEY
   ```

2. Redeploy:
   ```bash
   vercel --prod
   ```

### HTTPS Requirement

Push notifications **require HTTPS** in production. Ensure your deployment has:
- Valid SSL certificate
- Proper HTTPS redirect
- Secure origin for service worker

## Security Considerations

✅ **VAPID Private Key**: Never expose in client-side code
✅ **Endpoint Validation**: Subscriptions are validated before saving
✅ **User Authentication**: Only authenticated users can subscribe
✅ **Automatic Cleanup**: Invalid subscriptions (410 Gone) are marked inactive
✅ **Rate Limiting**: API routes use existing rate limiting

## Performance

- Push notifications are sent asynchronously (fire-and-forget)
- Failed sends don't block the main application flow
- Bulk sends use `Promise.allSettled` for parallel execution
- Subscription cleanup happens automatically on 410 errors

## Future Enhancements

Potential improvements:
- [ ] Notification batching (multiple notifications in one push)
- [ ] Rich notifications with images
- [ ] Notification sound customization
- [ ] Notification categories/preferences
- [ ] Silent notifications for background sync
- [ ] Analytics on notification delivery/open rates
- [ ] Scheduled notifications (e.g., daily digest)

## Support

For issues or questions:
1. Check this documentation
2. Review browser console logs
3. Check server logs for push send errors
4. Verify service worker registration
5. Test in different browsers

---

**Last Updated**: May 20, 2026
**Version**: 1.0.0
