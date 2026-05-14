# Travereel Database Migration Guide

## Quick Migration: SQLite → PostgreSQL

### Option 1: Automated Migration Script

```bash
# Run this script to prepare for PostgreSQL migration
bash migrate-to-postgres.sh
```

### Option 2: Manual Steps

#### 1. Update Prisma Schema
Change `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"  // Changed from "sqlite"
  url      = env("DATABASE_URL")
}
```

#### 2. Update .env
```env
# Comment out SQLite
# DATABASE_URL=file:./db/travel.db

# Add PostgreSQL
DATABASE_URL=postgresql://user:password@host:5432/travereel
```

#### 3. Run Migration
```bash
# Regenerate Prisma Client
bun run db:generate

# Push schema to PostgreSQL
bun run db:push

# Or use migrations
bun run db:migrate
```

### Data Migration (Optional)

If you have existing data in SQLite:

```bash
# Export SQLite data
sqlite3 db/travel.db ".dump" > backup.sql

# Use a migration tool
# Option 1: pgloader
# Option 2: Custom script
# Option 3: Manual export/import
```

### Recommended PostgreSQL Providers

1. **Supabase** (Free)
   - 500MB database
   - Built-in auth, storage
   - Dashboard included
   - URL: supabase.com

2. **Neon** (Free)
   - 512MB storage
   - Serverless PostgreSQL
   - Branching support
   - URL: neon.tech

3. **Railway** ($5/month)
   - 1GB storage
   - Easy deployment
   - URL: railway.app

### Verification

```bash
# Test connection
bun run db:generate

# Should show:
# ✔ Generated Prisma Client to ./node_modules/@prisma/client
```

### Rollback (if needed)

```bash
# Switch back to SQLite
# 1. Update schema.prisma: provider = "sqlite"
# 2. Update .env: DATABASE_URL=file:./db/travel.db
# 3. bun run db:generate
```
