# 🔧 Database Connection Pool Fix Guide

## ❌ Problem

Your Vercel deployment is experiencing **database connection pool exhaustion**:

```
FATAL: (EMAXCONNSESSION) max clients reached in session mode - max clients are limited to pool_size: 15
```

This causes **500 Internal Server Errors** on all API calls that access the database.

---

## 🔍 Root Cause

Supabase has **two connection modes**:

1. **Direct Connection** (Port 5432)
   - Limited to 15 concurrent connections
   - Each Vercel serverless function opens a new connection
   - **NOT suitable for production serverless deployments**

2. **Connection Pooler** (Port 6543)
   - Uses PgBouncer to manage connections
   - Reuses existing connections
   - **Designed for serverless/production use**

**Your Issue:** Vercel is likely using the **Direct Connection** URL instead of the **Connection Pooler** URL.

---

## ✅ Solution

### Step 1: Get Your Supabase Connection Pooler URL

Go to **Supabase Dashboard** → Your Project → **Settings** → **Database**

Find the **Connection Pooler** section. Your URL should look like:

```
postgresql://postgres.<project-ref>:<password>@<pooler-host>.pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Example:**
```
postgres://postgres.jsyqutvnibaxbmyvdxbw:U0evL5lI5XoTq3Cs@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
```

---

### Step 2: Update Vercel Environment Variables

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Select your project: `travereel-app`

2. **Navigate to Environment Variables**
   - Click **Settings** tab
   - Click **Environment Variables** in the left sidebar

3. **Update DATABASE_URL**
   - Find the `DATABASE_URL` variable
   - Click **Edit**
   - Replace with your **Connection Pooler URL** (port 6543)

   **✅ CORRECT (Pooler - Port 6543):**
   ```
   postgres://postgres.jsyqutvnibaxbmyvdxbw:U0evL5lI5XoTq3Cs@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
   ```

   **❌ WRONG (Direct - Port 5432):**
   ```
   postgresql://postgres.jsyqutvnibaxbmyvdxbw:U0evL5lI5XoTq3Cs@db.jsyqutvnibaxbmyvdxbw.supabase.co:5432/postgres
   ```

   **Key Differences:**
   - ✅ Host ends with `.pooler.supabase.com`
   - ✅ Port is `6543` (not `5432`)
   - ✅ Has `pgbouncer=true` parameter

4. **Save Changes**
   - Click **Save**
   - Make sure it's set for **Production**, **Preview**, and **Development** environments

---

### Step 3: Redeploy to Vercel

After updating the environment variable, you need to redeploy:

**Option A: Via Vercel Dashboard**
1. Go to **Deployments** tab
2. Click the latest deployment
3. Click **⋯** (more options)
4. Click **Redeploy**

**Option B: Via CLI**
```bash
cd c:\Users\Venok\Documents\travereel_app
vercel --prod
```

**Option C: Push a New Commit**
```bash
git add -A
git commit -m "chore: trigger redeploy"
git push origin main
```

---

## 🔧 Code Improvements (Already Applied)

I've also optimized your database client to better handle connections:

### Changes Made:

**File:** `src/lib/db.ts`

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Graceful shutdown for serverless environments
if (process.env.NODE_ENV === 'production') {
  process.on('beforeExit', async () => {
    await db.$disconnect()
  })
}
```

**Improvements:**
1. ✅ **Better logging** - Only logs errors in production (reduces overhead)
2. ✅ **Explicit datasource URL** - Ensures correct URL is used
3. ✅ **Graceful shutdown** - Properly disconnects in serverless environments

---

## 🎨 Favicon Fix (Already Applied)

I've also fixed the favicon 404 errors by adding proper metadata:

**File:** `src/app/layout.tsx`

```typescript
export const metadata: Metadata = {
  // ... other metadata
  icons: {
    icon: [
      { url: "/logo.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/logo.svg", type: "image/svg+xml" },
    ],
  },
  // ...
}
```

This eliminates the favicon.ico and icon-192x192.png 404 errors.

---

## 🧪 Testing After Fix

After redeploying, test these:

### 1. Check API Endpoints
```
✅ GET  /api/auth           → Should return 200
✅ POST /api/auth           → Should return 200
✅ GET  /api/posts          → Should return 200
✅ GET  /api/communities    → Should return 200
```

### 2. Check Vercel Logs
- Go to Vercel Dashboard → **Logs**
- Should see **NO** `EMAXCONNSESSION` errors
- Should see normal query logs

### 3. Test User Actions
- ✅ Login/Registration
- ✅ Creating posts
- ✅ Loading communities
- ✅ Viewing profiles

---

## 📊 Connection Pool Best Practices

### For Supabase + Vercel:

1. **Always use Connection Pooler** (port 6543)
2. **Enable PgBouncer** (`pgbouncer=true`)
3. **Use SSL** (`sslmode=require`)
4. **Keep Prisma Client singleton** (already done)
5. **Disconnect on shutdown** (already done)

### Connection Limits:

| Plan | Direct (5432) | Pooler (6543) |
|------|---------------|---------------|
| Free | 15 | 15 (managed) |
| Pro | 60 | Unlimited |
| Team | 120 | Unlimited |

**Note:** Pooler mode efficiently manages connections, so even with 15 limit, it can handle hundreds of concurrent requests.

---

## 🚨 Troubleshooting

### Still Getting Connection Errors?

**Check 1: Verify DATABASE_URL in Vercel**
```bash
vercel env ls
```
Make sure `DATABASE_URL` is listed and correct.

**Check 2: Test Connection Locally**
```bash
# Use the pooler URL locally
DATABASE_URL="your-pooler-url" npx prisma db pull
```

**Check 3: Check Supabase Dashboard**
- Go to **Database** → **Logs**
- Look for connection errors
- Check active connections count

**Check 4: Restart Vercel Deployment**
Sometimes old deployments cache old env vars:
```bash
vercel --prod --force
```

---

## 📝 Environment Variable Checklist

Make sure these are set in Vercel:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ Yes | Supabase pooler URL (port 6543) |
| `JWT_SECRET` | ✅ Yes | JWT signing secret |
| `OPENROUTER_API_KEY` | Optional | AI itinerary generation |
| `CLOUDINARY_CLOUD_NAME` | Optional | Image uploads |
| `CLOUDINARY_API_KEY` | Optional | Image uploads |
| `CLOUDINARY_API_SECRET` | Optional | Image uploads |

---

## 🎯 Quick Reference

### Connection Pooler URL Format:
```
postgres://<user>:<password>@<host>.pooler.supabase.com:6543/<database>?sslmode=require&pgbouncer=true
```

### Direct URL Format (DON'T USE):
```
postgresql://<user>:<password>@<host>.db.supabase.co:5432/<database>
```

---

## ✅ Summary

1. ✅ **Updated** `src/lib/db.ts` with connection optimizations
2. ✅ **Updated** `src/app/layout.tsx` with favicon metadata
3. ⏳ **TODO:** Update `DATABASE_URL` in Vercel to use pooler (port 6543)
4. ⏳ **TODO:** Redeploy to Vercel

Once you complete steps 3 and 4, your 500 errors will be resolved! 🎉

---

## 📞 Need Help?

If you're still experiencing issues:
1. Check Vercel logs for detailed error messages
2. Check Supabase logs for connection issues
3. Verify DATABASE_URL format matches the pooler URL exactly
4. Ensure all Vercel environments (Production, Preview, Development) use the pooler URL

---

**Last Updated:** 2026-05-14  
**Status:** Partially Fixed (code optimized, Vercel config pending)
