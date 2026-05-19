# Push Notifications - Quick Start

## 🚀 Getting Started in 3 Steps

### Step 1: Generate VAPID Keys

Run this command to generate your push notification keys:

```bash
npx ts-node scripts/generate-vapid-keys.ts
```

You'll see output like this:
```
========================================
VAPID Keys for Push Notifications
========================================

Add these to your .env file:

NEXT_PUBLIC_VAPID_PUBLIC_KEY=BNx...
VAPID_PRIVATE_KEY=K7g...

========================================
IMPORTANT: Keep your private key secret!
========================================
```

### Step 2: Add Keys to .env

Copy the generated keys and add them to your `.env` file:

```env
# Push Notification VAPID Keys
NEXT_PUBLIC_VAPID_PUBLIC_KEY=paste-your-public-key-here
VAPID_PRIVATE_KEY=paste-your-private-key-here
```

### Step 3: Enable Push Notifications

1. Start your development server: `npm run dev`
2. Log in to your account
3. Go to Settings
4. Find "Push Notifications" card
5. Click "Enable Push Notifications"
6. Accept the browser permission prompt
7. ✅ Done! You're now subscribed

## 📱 What You'll Get Notifications For

- ❤️ Likes on your posts
- 💬 Comments on your posts
- 👥 New followers
- 🤝 Friend requests
- 💌 Direct messages
- 📤 Post shares
- @ Mentions

## 🔧 Testing

### Test the Setup

1. Open your app in Chrome/Edge
2. Enable push notifications in Settings
3. Open another browser (or incognito)
4. Log in with a different account
5. Like a post from the first account
6. You should see a push notification!

### Verify Service Worker

Check if service worker is registered:
- Chrome: `chrome://serviceworker-internals/`
- Edge: `edge://serviceworker-internals/`
- Firefox: `about:debugging#/runtime/this-firefox`

### Check Subscriptions

Verify your subscription is saved in the database:

```sql
SELECT * FROM push_subscriptions WHERE "userId" = 'your-user-id';
```

## ❓ Troubleshooting

### "Push notifications not supported"
- Use Chrome, Edge, or Firefox
- Push notifications don't work in all browsers on iOS

### Permission denied
1. Click the lock icon in address bar
2. Change notifications to "Allow"
3. Refresh page
4. Try again

### Keys not configured
- Make sure you added keys to `.env` (not `.env.example`)
- Restart your dev server after adding keys
- Public key must start with `NEXT_PUBLIC_`

## 📚 Full Documentation

See [PUSH_NOTIFICATIONS_SETUP.md](./PUSH_NOTIFICATIONS_SETUP.md) for complete documentation including:
- Architecture details
- API reference
- Production deployment
- Security considerations
- Advanced usage

## 🎯 Next Steps

- [ ] Add push notification preferences (notification types)
- [ ] Add notification sounds
- [ ] Add rich notifications with images
- [ ] Add notification analytics
- [ ] Add scheduled notifications (daily digest)

---

**Need help?** Check the full documentation or review the console logs for errors.
