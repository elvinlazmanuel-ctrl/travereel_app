# 🚀 Travereel Deployment Guide

Complete guide for deploying Travereel to production.

---

## 📋 Pre-Deployment Checklist

### ✅ Security (COMPLETED)
- [x] Password hashing with bcrypt
- [x] JWT authentication system
- [x] Token-based API authentication
- [x] CORS configuration for chat service
- [x] Environment variables setup
- [x] Error boundaries implemented

### 🔧 Required Before Deployment
- [ ] Migrate to PostgreSQL (see below)
- [ ] Set up cloud storage (Cloudinary configured, needs credentials)
- [ ] Add email service (optional, for password reset)
- [ ] Generate production JWT secret
- [ ] Set up monitoring (Sentry recommended)

---

## 🗄️ 1. Database Migration: SQLite → PostgreSQL

### Why Migrate?
- SQLite is file-based, not suitable for production
- PostgreSQL offers better performance, concurrency, and scalability
- Required for serverless deployments (Vercel, Netlify)

### Option A: Supabase (Recommended - Free Tier)
1. **Create Account**: Go to [supabase.com](https://supabase.com)
2. **Create New Project**
3. **Get Database URL**: Settings → Database → Connection string → URI
4. **Update `.env`**:
   ```env
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```

### Option B: Neon (Free Tier)
1. **Create Account**: Go to [neon.tech](https://neon.tech)
2. **Create Project**
3. **Get Connection String**
4. **Update `.env`**

### Option C: Railway ($5/month)
1. **Create Account**: Go to [railway.app](https://railway.app)
2. **Add PostgreSQL Plugin**
3. **Get DATABASE_URL from variables**

### Migration Steps
```bash
# 1. Update Prisma schema provider
# Change: provider = "sqlite"
# To:     provider = "postgresql"

# 2. Update .env with PostgreSQL URL
DATABASE_URL=postgresql://...

# 3. Generate Prisma client
bun run db:generate

# 4. Push schema to PostgreSQL
bun run db:push

# 5. (Optional) Migrate existing data
# Use tools like: https://github.com/supabase/pglite
```

---

## 📦 2. Cloud Storage Setup (Cloudinary)

### Why Cloudinary?
- Free tier: 25GB storage, 25GB bandwidth/month
- Automatic image optimization
- CDN delivery
- Works with serverless deployments

### Setup Steps
1. **Create Account**: Go to [cloudinary.com](https://cloudinary.com)
2. **Get Credentials** from Dashboard
3. **Add to `.env`**:
   ```env
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

### Code Already Updated
- Upload route automatically uses Cloudinary when configured
- Falls back to local storage for development
- Images are auto-optimized (quality + format)

---

## 🔐 3. Environment Variables for Production

### Required Variables
```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Authentication
JWT_SECRET=<generate-strong-random-string>

# Cloud Storage
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Chat Service
SOCKET_SERVER_URL=https://your-chat-server.com
ALLOWED_ORIGINS=https://your-domain.com

# Application
NODE_ENV=production
```

### Generate JWT Secret
```bash
# macOS/Linux
openssl rand -base64 32

# Windows PowerShell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})

# Or use online generator: https://generate-secret.vercel.app/32
```

---

## 🌐 4. Deployment Options

### Option 1: Vercel (Easiest - Recommended)

**Best for**: Quick deployment, zero config, free tier

#### Steps:
```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel --prod
```

#### Configuration:
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Add environment variables in dashboard
4. Deploy!

#### Vercel-Specific Changes:
- ✅ Already compatible (Next.js)
- ✅ Standalone output configured
- ⚠️ Need PostgreSQL (SQLite won't work)
- ⚠️ Need Cloudinary for uploads
- ⚠️ Chat service needs separate deployment

#### Chat Service on Railway:
```bash
# Deploy chat-service separately to Railway
# 1. Create Railway project
# 2. Point to mini-services/chat-service directory
# 3. Add environment variables:
#    - PORT=3003
#    - ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
```

---

### Option 2: Railway (Full Stack)

**Best for**: Full control, backend + database, WebSocket support

**Cost**: ~$5-10/month

#### Steps:
1. **Create Account**: [railway.app](https://railway.app)
2. **New Project** → Deploy from GitHub
3. **Add PostgreSQL** service
4. **Add Variables**:
   ```
   DATABASE_URL=<from PostgreSQL service>
   JWT_SECRET=<your-secret>
   CLOUDINARY_*=<your-credentials>
   NODE_ENV=production
   ```
5. **Deploy**

#### For Chat Service:
- Add another service in same project
- Point to `mini-services/chat-service`
- Set PORT=3003

---

### Option 3: VPS (DigitalOcean, Hetzner, AWS)

**Best for**: Full control, cost-effective at scale

**Cost**: $6-20/month

#### Server Setup:
```bash
# 1. Connect to server
ssh root@your-server-ip

# 2. Install dependencies
apt update
apt install -y nodejs npm postgresql caddy

# 3. Clone repository
git clone https://github.com/your-username/travereel.git
cd travereel

# 4. Install dependencies
npm install -g bun
bun install

# 5. Setup PostgreSQL
sudo -u postgres psql
CREATE DATABASE travereel;
CREATE USER travereel WITH PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE travereel TO travereel;
\q

# 6. Setup .env
nano .env
# Add all environment variables

# 7. Build
bun run db:generate
bun run db:push
bun run build

# 8. Start with Caddy (reverse proxy)
# Use provided Caddyfile
caddy start
```

#### Using Docker (Recommended for VPS):
```bash
# Create docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/travereel
      - JWT_SECRET=${JWT_SECRET}
      - CLOUDINARY_*=${CLOUDINARY_*}
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      POSTGRES_DB: travereel
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  chat:
    build: ./mini-services/chat-service
    ports:
      - "3003:3003"
    environment:
      - ALLOWED_ORIGINS=https://your-domain.com

volumes:
  postgres_data:
```

---

### Option 4: Hybrid (Best Performance)

**Architecture**:
- **Frontend**: Vercel (CDN + SSR)
- **Database**: Supabase/Neon (PostgreSQL)
- **Storage**: Cloudinary (images)
- **Real-time**: Pusher or Supabase Realtime
- **Chat Service**: Railway/Render

**Benefits**:
- Best performance (global CDN)
- Scalable
- Managed services (less maintenance)
- Free tiers available

---

## 🔧 5. Post-Deployment Steps

### 1. Test Authentication
```bash
# Register a new user
curl -X POST https://your-domain.com/api/auth \
  -H "Content-Type: application/json" \
  -d '{"action":"register","email":"test@test.com","username":"test","name":"Test","password":"Test123!@#"}'

# Login
curl -X POST https://your-domain.com/api/auth \
  -H "Content-Type: application/json" \
  -d '{"action":"login","email":"test@test.com","password":"Test123!@#"}'
```

### 2. Test File Upload
- Create a post with image
- Verify image loads from Cloudinary

### 3. Test Chat Service
- Open two browsers
- Send messages between them
- Verify real-time updates

### 4. Setup Monitoring
```bash
# Add Sentry (optional)
bun add @sentry/nextjs

# Configure in next.config.ts
const { withSentryConfig } = require('@sentry/nextjs');
```

### 5. Setup Backups
```bash
# PostgreSQL backup (if using VPS)
pg_dump travereel > backup-$(date +%Y%m%d).sql

# Or use managed backup services (Supabase, Railway have auto-backups)
```

---

## 🚨 Common Issues & Solutions

### Issue: "Prisma Client not generated"
```bash
bun run db:generate
```

### Issue: "Database connection error"
- Check DATABASE_URL format
- Ensure database is running
- Check firewall rules

### Issue: "Uploads not working on Vercel"
- Vercel serverless doesn't support local file storage
- Must use Cloudinary or similar

### Issue: "Chat service not connecting"
- Check CORS settings
- Verify SOCKET_SERVER_URL
- Check if port is open (for VPS)

### Issue: "JWT token invalid"
- Ensure JWT_SECRET matches between deployments
- Check token expiration (7 days by default)

---

## 📊 Performance Optimization

### Already Implemented:
- ✅ Turbopack for fast builds
- ✅ Standalone output for smaller deployments
- ✅ Image optimization (Cloudinary)
- ✅ Code splitting (dynamic imports)

### Recommended Additions:
1. **Redis Caching** (for API responses)
2. **CDN** (Cloudinary provides this)
3. **Database Indexing** (add to Prisma schema)
4. **React Query** (already implemented!)

---

## 🔒 Security Checklist

### Implemented:
- [x] Password hashing (bcrypt)
- [x] JWT authentication
- [x] Rate limiting
- [x] CORS configuration
- [x] Input validation (Zod)
- [x] Error boundaries

### To Add (Optional):
- [ ] Email verification
- [ ] Password reset
- [ ] 2FA (Two-factor authentication)
- [ ] CSRF protection
- [ ] Content Security Policy headers
- [ ] Helmet.js security headers

---

## 📝 Maintenance

### Regular Tasks:
1. **Update dependencies**: `bun update`
2. **Monitor error logs**
3. **Database backups**
4. **Check storage usage**
5. **Review user reports**

### Monitoring Tools:
- **Uptime**: UptimeRobot (free)
- **Errors**: Sentry (free tier)
- **Analytics**: Vercel Analytics / Google Analytics
- **Logs**: Railway/Vercel built-in logs

---

## 🆘 Support

### Documentation:
- Next.js: https://nextjs.org/docs
- Prisma: https://www.prisma.io/docs
- Cloudinary: https://cloudinary.com/documentation
- Socket.IO: https://socket.io/docs

### Get Help:
- Check `worklog.md` for project history
- Review `agent-ctx/` for development context
- Check GitHub Issues

---

## 🎯 Quick Deploy Summary

### Minimum Requirements:
1. PostgreSQL database (Supabase free)
2. Cloudinary account (free)
3. Vercel account (free)
4. Generate JWT_SECRET

### Time Estimate:
- **Experienced**: 30 minutes
- **First time**: 1-2 hours

### Cost:
- **Free tier**: $0/month (limited)
- **Production ready**: $5-15/month

---

**Ready to deploy? Start with Vercel + Supabase + Cloudinary!** 🚀
