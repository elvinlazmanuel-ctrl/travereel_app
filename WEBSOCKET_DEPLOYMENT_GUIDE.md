# WebSocket Chat Service Deployment Guide

## Current Issue

Your Vercel deployment shows this error:
```
WebSocket connection to 'wss://travereel-app.vercel.app/socket.io/?EIO=4&transport=websocket' failed
```

**Root Cause**: Vercel is a serverless platform that **does NOT support persistent WebSocket connections**. Your chat service (Socket.io) requires a separate deployment.

---

## ✅ What We Fixed

We've updated the code to **gracefully handle** the missing WebSocket server:

1. **Socket client now returns `null`** when deployed on Vercel without chat service
2. **Error handling** prevents app crashes
3. **Console warnings** inform developers about the missing service
4. **Chat still works** via HTTP API calls (just not real-time)

The app will work perfectly - you'll just lose real-time features (typing indicators, instant message delivery) until you deploy the chat service.

---

## Solution Options

### Option 1: Deploy Chat Service to Railway (Recommended)

**Cost**: Free tier available (~$5/month for hobby)
**Time**: 15-20 minutes

#### Step 1: Create Railway Account

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project"

#### Step 2: Deploy Chat Service

1. Click **"Deploy from GitHub repo"**
2. Select your `travereel_app` repository
3. In project settings, set **Root Directory**: `mini-services/chat-service`
4. Railway will auto-detect it's a Node.js/Bun project

#### Step 3: Configure Environment Variables

In Railway project settings, add:

```
PORT=3003
ALLOWED_ORIGINS=https://travereel-app.vercel.app
NODE_ENV=production
```

**Important**: Replace `https://travereel-app.vercel.app` with your actual Vercel URL if different.

#### Step 4: Get Your Railway URL

1. Go to Railway dashboard
2. Click on your service
3. Go to **"Settings"** → **"Networking"**
4. Copy the public URL (e.g., `https://chat-service-abc123.up.railway.app`)

#### Step 5: Update Vercel Environment Variable

In your Vercel dashboard:

1. Go to **Settings** → **Environment Variables**
2. Add new variable:
   ```
   NEXT_PUBLIC_WS_URL=https://chat-service-abc123.up.railway.app
   ```
   (Replace with your actual Railway URL)
3. Click **Save**
4. **Redeploy** your Vercel app

#### Step 6: Test

1. Open your Vercel app
2. Open browser console (F12)
3. You should see: `[Chat] User connected: ...` in Railway logs
4. No more WebSocket errors!

---

### Option 2: Deploy to Render

**Cost**: Free tier available
**Time**: 15 minutes

#### Steps:

1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Click **"New +"** → **"Web Service"**
4. Connect your repository
5. Configure:
   - **Name**: `travereel-chat`
   - **Root Directory**: `mini-services/chat-service`
   - **Build Command**: `npm install` (or `bun install`)
   - **Start Command**: `npm start` (or `bun run index.ts`)
   - **Environment Variables**:
     ```
     PORT=3003
     ALLOWED_ORIGINS=https://travereel-app.vercel.app
     ```
6. Deploy and follow same steps as Railway to get URL

---

### Option 3: Deploy to Fly.io

**Cost**: Free tier available (~$5/month)
**Time**: 20 minutes

#### Steps:

1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Login: `fly auth login`
3. Navigate to chat service:
   ```bash
   cd mini-services/chat-service
   ```
4. Initialize app:
   ```bash
   fly launch --name travereel-chat
   ```
5. Set environment variables:
   ```bash
   fly secrets set ALLOWED_ORIGINS=https://travereel-app.vercel.app
   ```
6. Deploy:
   ```bash
   fly deploy
   ```
7. Get URL and update Vercel env var

---

### Option 4: Use a VPS (DigitalOcean, Hetzner, etc.)

**Cost**: $6-10/month
**Time**: 30-45 minutes

#### Steps:

1. Rent a VPS (Ubuntu 22.04 recommended)
2. SSH into server
3. Install Node.js/Bun:
   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```
4. Clone your repo:
   ```bash
   git clone https://github.com/your-username/travereel_app.git
   cd travereel_app/mini-services/chat-service
   bun install
   ```
5. Run with PM2:
   ```bash
   npm install -g pm2
   pm2 start index.ts --name chat-service
   pm2 save
   pm2 startup
   ```
6. Set up Caddy reverse proxy:
   ```bash
   apt install caddy
   ```
   Edit `/etc/caddy/Caddyfile`:
   ```
   chat.yourdomain.com {
     reverse_proxy localhost:3003
   }
   ```
7. Point DNS to your VPS IP
8. Update Vercel env var with your domain

---

## Current Status (After Our Fix)

### ✅ What Works Now:
- App loads without errors
- Messaging works via HTTP API
- No console errors breaking the app
- Graceful degradation with informative logs

### ⚠️ What's Disabled (Until Chat Service Deployed):
- Real-time message delivery
- Typing indicators ("User is typing...")
- Online/offline status
- Instant notifications for new messages

**Users will need to refresh or navigate to see new messages.**

---

## Testing After Deployment

Once you deploy the chat service:

1. **Open browser console** (F12)
2. **Login to the app**
3. **Look for these logs**:
   ```
   [Socket] Connected to chat service
   [Chat] User abc123 authenticated
   ```
4. **Test real-time chat**:
   - Open two browser tabs
   - Send message from one
   - Should appear instantly in the other (no refresh needed)
5. **Test typing indicator**:
   - Start typing in one tab
   - Should see "User is typing..." in the other tab

---

## Troubleshooting

### Error: "CORS error" after deployment

**Fix**: Make sure `ALLOWED_ORIGINS` includes your Vercel URL:
```
ALLOWED_ORIGINS=https://travereel-app.vercel.app
```

### Error: "Connection refused"

**Fix**: Check that:
1. Chat service is running (check Railway/Render logs)
2. `NEXT_PUBLIC_WS_URL` is set correctly in Vercel
3. You've redeployed Vercel after adding the env var

### Messages not appearing in real-time

**Fix**: 
1. Check Railway/Render logs for errors
2. Verify socket connection in browser console
3. Check that both users are in the same chat room

---

## Architecture Overview

```
┌─────────────────────────────────────┐
│         Vercel (Next.js App)        │
│                                     │
│  - Frontend UI                      │
│  - API Routes (/api/*)              │
│  - Serverless Functions             │
│  - ❌ NO WebSockets                 │
└──────────────┬──────────────────────┘
               │
               │ HTTP API calls
               │
┌──────────────▼──────────────────────┐
│    Supabase (PostgreSQL DB)         │
│                                     │
│  - Users, Posts, Messages           │
│  - All data storage                 │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  Railway/Render (Chat Service)      │
│                                     │
│  - Socket.io WebSocket Server       │
│  - Real-time messaging              │
│  - Typing indicators                │
│  - Online status                    │
│  - Port: 3003                       │
└─────────────────────────────────────┘
```

---

## Quick Start Commands

### Local Development (Already Working)

```bash
# Terminal 1: Start Next.js app
npm run dev

# Terminal 2: Start chat service
cd mini-services/chat-service
bun run index.ts
# or
npm start
```

### Production Deployment

1. **Vercel** (Already deployed):
   ```bash
   vercel --prod
   ```

2. **Railway** (Chat service - needs deployment):
   - Use web dashboard (see steps above)
   - OR use Railway CLI:
   ```bash
   npm i -g @railway/cli
   railway login
   cd mini-services/chat-service
   railway up
   ```

---

## Need Help?

If you encounter issues during deployment:

1. Check Railway/Render logs for errors
2. Verify environment variables are set correctly
3. Test WebSocket connection manually:
   ```javascript
   // In browser console
   const socket = io('YOUR_RAILWAY_URL')
   socket.on('connect', () => console.log('Connected!'))
   ```
4. Check that `ALLOWED_ORIGINS` includes your Vercel URL

---

## Summary

**Current State**: ✅ App works, chat uses HTTP (no real-time)

**After Chat Service Deployment**: ✅ Full real-time chat with WebSockets

**Recommended Next Step**: Deploy chat service to Railway (easiest, 15 minutes)
