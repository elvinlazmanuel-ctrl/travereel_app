# 🚀 Production Deployment Guide

## ✅ Pre-Deployment Checklist

- [x] All code committed to Git
- [x] Schema validated
- [ ] Database migration applied
- [ ] Environment variables configured
- [ ] Build successful

---

## 📋 Step 1: Push to GitHub

```bash
# Push all commits
git push origin main
```

**Expected Output:**
```
Enumerating objects: ...
Counting objects: 100% (...)
Delta compression using up to ... threads
Compressing objects: 100% (...)
Writing objects: 100% (...)
To github.com:username/travereel_app.git
   xxxxxxx..yyyyyyy  main -> main
```

---

## 🗄️ Step 2: Run Database Migration (Production)

### Option A: Via Supabase Dashboard (Recommended)

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor**
4. Run this SQL:

```sql
-- Create Reactions table
CREATE TABLE IF NOT EXISTS "reactions" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "postId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  UNIQUE ("postId", "userId")
);

-- Create Albums table
CREATE TABLE IF NOT EXISTS "albums" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" TEXT NOT NULL,
  "description" TEXT,
  "authorId" TEXT NOT NULL,
  "coverUrl" TEXT,
  "isPublic" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Create Photos table
CREATE TABLE IF NOT EXISTS "photos" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "albumId" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "caption" TEXT,
  "order" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Add foreign keys
ALTER TABLE "reactions" 
  ADD CONSTRAINT "reactions_postId_fkey" 
  FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE;

ALTER TABLE "reactions" 
  ADD CONSTRAINT "reactions_userId_fkey" 
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;

ALTER TABLE "albums" 
  ADD CONSTRAINT "albums_authorId_fkey" 
  FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE;

ALTER TABLE "photos" 
  ADD CONSTRAINT "photos_albumId_fkey" 
  FOREIGN KEY ("albumId") REFERENCES "albums"("id") ON DELETE CASCADE;

-- Create indexes
CREATE INDEX "reactions_postId_idx" ON "reactions"("postId");
CREATE INDEX "reactions_userId_idx" ON "reactions"("userId");
CREATE INDEX "albums_authorId_idx" ON "albums"("authorId");
CREATE INDEX "photos_albumId_idx" ON "photos"("albumId");
```

### Option B: Via Prisma CLI (Local with Production DB)

```bash
# Set production DATABASE_URL
export DATABASE_URL="postgresql://..."

# Run migration
npx prisma migrate deploy
```

### Option C: Via Vercel Deployment Hook

Vercel will run this automatically if configured:

```bash
npx prisma migrate deploy
```

---

## 🔧 Step 3: Configure Environment Variables

### Vercel Dashboard:

1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add/Verify these variables:

**Required:**
```
DATABASE_URL=postgresql://user:password@host:5432/db
DIRECT_URL=postgresql://user:password@host:5432/db
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=https://your-domain.vercel.app
OPENROUTER_API_KEY=your-openrouter-key
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

**Optional:**
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## 🚀 Step 4: Deploy to Vercel

### Option A: Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### Option B: Via GitHub Integration (Recommended)

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Configure project:
   - **Framework Preset:** Next.js
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`
   - **Install Command:** `npm install`
4. Add environment variables (from Step 3)
5. Click **Deploy**

### Option C: Use Vercel Skill

```bash
# This will guide you through deployment
# Type: /vercel-deploy in the chat
```

---

## ✅ Step 5: Post-Deployment Verification

### 1. Check Build Logs

- Go to Vercel Dashboard → Your Project → Deployments
- Click on latest deployment
- Verify build succeeded

### 2. Test Database Connection

Visit: `https://your-domain.vercel.app/api/users`

**Expected:** JSON response or 401 (auth required)

### 3. Test Features

**Reactions:**
- Open any post
- Long-press like button
- Verify reaction picker appears

**Voice Messages:**
- Go to Messages → Chat
- Tap mic icon
- Allow microphone access
- Record and send

**Photo Albums:**
- Go to Profile
- Tap Albums tab (📸)
- Create new album

### 4. Check Console

Open browser DevTools → Console
- No red errors
- API calls successful

---

## 🔍 Troubleshooting

### Issue: "Build Failed"

**Common Causes:**
- Missing environment variables
- TypeScript errors
- Memory limit exceeded

**Solution:**
```bash
# Test build locally
npm run build

# Fix any errors shown
# Push fixes and redeploy
```

### Issue: "Database Connection Error"

**Solution:**
1. Verify DATABASE_URL in Vercel
2. Check Supabase project is active
3. Ensure IP is whitelisted (if applicable)
4. Use direct connection URL (not pooler)

### Issue: "API Routes Not Working"

**Solution:**
```bash
# Check Vercel logs
vercel logs your-domain.vercel.app

# Verify environment variables
# Test locally first
```

### Issue: "Migration Not Applied"

**Solution:**
1. Run SQL manually in Supabase Dashboard
2. Or use Prisma Migrate:
```bash
npx prisma migrate deploy
```

---

## 📊 Deployment Checklist

### Before Deploy:
- [ ] All code committed
- [ ] Tests passing locally
- [ ] Schema validated
- [ ] Environment variables ready
- [ ] Database backup created

### During Deploy:
- [ ] Build succeeds
- [ ] No TypeScript errors
- [ ] Environment variables loaded
- [ ] Database connected

### After Deploy:
- [ ] Homepage loads
- [ ] Auth works (login/signup)
- [ ] Feed displays posts
- [ ] Reactions work
- [ ] Voice messages work
- [ ] Photo albums work
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Dark mode works

---

## 🎯 Quick Deploy Commands

```bash
# Full deployment flow
git push origin main
vercel --prod

# Or with GitHub integration
git push origin main
# Vercel auto-deploys!
```

---

## 📝 Post-Deployment Tasks

1. **Run Migration:**
   - Use Supabase SQL Editor (Step 2)
   - Or run `npx prisma migrate deploy`

2. **Seed Achievements:**
   - Use Vercel cron job
   - Or run manually via API

3. **Set Up Monitoring:**
   - Vercel Analytics
   - Sentry for errors
   - Log draining

4. **Configure Custom Domain:**
   - Vercel → Settings → Domains
   - Add your domain
   - Update DNS records

5. **Set Up CI/CD:**
   - GitHub Actions
   - Automatic deployments
   - Test before deploy

---

## 🌐 Production URLs

After deployment:
- **App:** https://your-app.vercel.app
- **API:** https://your-app.vercel.app/api
- **Admin:** https://your-app.vercel.app/superadmin-auth

---

## ✨ Summary

**Deployment Steps:**
1. ✅ Push to GitHub
2. ⏳ Run database migration
3. ⏳ Configure env variables
4. ⏳ Deploy to Vercel
5. ⏳ Test features

**All Phase 4 Features Ready:**
- ✅ Expanded Reactions
- ✅ Voice Messages
- ✅ Photo Albums
- ✅ All APIs
- ✅ Database schema

**Next:** Follow the steps above to go live! 🚀
