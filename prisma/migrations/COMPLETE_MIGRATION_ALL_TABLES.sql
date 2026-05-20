-- Complete Database Migration for Travereel
-- Run this ENTIRE script in Supabase SQL Editor
-- This adds ALL missing columns and tables

-- ==========================================
-- 1. Users Table - Security Columns
-- ==========================================

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'twoFactorSecret') THEN
        ALTER TABLE "users" ADD COLUMN "twoFactorSecret" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'twoFactorEnabled') THEN
        ALTER TABLE "users" ADD COLUMN "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'twoFactorBackupCodes') THEN
        ALTER TABLE "users" ADD COLUMN "twoFactorBackupCodes" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'lastLoginAt') THEN
        ALTER TABLE "users" ADD COLUMN "lastLoginAt" TIMESTAMP(3);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'lastLoginIp') THEN
        ALTER TABLE "users" ADD COLUMN "lastLoginIp" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'loginAttempts') THEN
        ALTER TABLE "users" ADD COLUMN "loginAttempts" INTEGER NOT NULL DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'lockedUntil') THEN
        ALTER TABLE "users" ADD COLUMN "lockedUntil" TIMESTAMP(3);
    END IF;
END $$;

-- ==========================================
-- 2. Itineraries Table - Missing Columns
-- ==========================================

DO $$ 
BEGIN
    -- departureDate
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'itineraries' AND column_name = 'departureDate') THEN
        ALTER TABLE "itineraries" ADD COLUMN "departureDate" TIMESTAMP(3);
    END IF;
    
    -- returnDate
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'itineraries' AND column_name = 'returnDate') THEN
        ALTER TABLE "itineraries" ADD COLUMN "returnDate" TIMESTAMP(3);
    END IF;
    
    -- requirements
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'itineraries' AND column_name = 'requirements') THEN
        ALTER TABLE "itineraries" ADD COLUMN "requirements" TEXT;
    END IF;
    
    -- collaborators
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'itineraries' AND column_name = 'collaborators') THEN
        ALTER TABLE "itineraries" ADD COLUMN "collaborators" TEXT;
    END IF;
END $$;

-- ==========================================
-- 3. PushSubscription Table
-- ==========================================

CREATE TABLE IF NOT EXISTS "push_subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "push_subscriptions_endpoint_key" ON "push_subscriptions"("endpoint");

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'push_subscriptions_userId_fkey'
    ) THEN
        ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_userId_fkey" 
            FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- ==========================================
-- 4. Achievement Tables
-- ==========================================

CREATE TABLE IF NOT EXISTS "achievements" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "requirement" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "achievements_slug_key" ON "achievements"("slug");

CREATE TABLE IF NOT EXISTS "user_achievements" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "progress" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "user_achievements_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "user_achievements_userId_achievementId_key" ON "user_achievements"("userId", "achievementId");

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_achievements_userId_fkey'
    ) THEN
        ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_userId_fkey" 
            FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_achievements_achievementId_fkey'
    ) THEN
        ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_achievementId_fkey" 
            FOREIGN KEY ("achievementId") REFERENCES "achievements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- ==========================================
-- 5. TravelStats Table
-- ==========================================

CREATE TABLE IF NOT EXISTS "travel_stats" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalTrips" INTEGER NOT NULL DEFAULT 0,
    "totalCountries" INTEGER NOT NULL DEFAULT 0,
    "totalCities" INTEGER NOT NULL DEFAULT 0,
    "totalDays" INTEGER NOT NULL DEFAULT 0,
    "totalSpent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "favoriteCountry" TEXT,
    "favoriteCity" TEXT,
    "longestTrip" INTEGER NOT NULL DEFAULT 0,
    "shortestTrip" INTEGER NOT NULL DEFAULT 0,
    "travelStreak" INTEGER NOT NULL DEFAULT 0,
    "firstTripDate" TIMESTAMP(3),
    "lastTripDate" TIMESTAMP(3),
    "countriesVisited" TEXT NOT NULL DEFAULT '[]',
    "citiesVisited" TEXT NOT NULL DEFAULT '[]',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "travel_stats_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "travel_stats_userId_key" UNIQUE ("userId")
);

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'travel_stats_userId_fkey'
    ) THEN
        ALTER TABLE "travel_stats" ADD CONSTRAINT "travel_stats_userId_fkey" 
            FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- ==========================================
-- 6. Reaction Tables
-- ==========================================

CREATE TABLE IF NOT EXISTS "reactions" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "reactions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "reactions_postId_userId_key" ON "reactions"("postId", "userId");

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'reactions_postId_fkey'
    ) THEN
        ALTER TABLE "reactions" ADD CONSTRAINT "reactions_postId_fkey" 
            FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'reactions_userId_fkey'
    ) THEN
        ALTER TABLE "reactions" ADD CONSTRAINT "reactions_userId_fkey" 
            FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- ==========================================
-- 7. Album Tables
-- ==========================================

CREATE TABLE IF NOT EXISTS "albums" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "authorId" TEXT NOT NULL,
    "coverUrl" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "albums_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "photos" (
    "id" TEXT NOT NULL,
    "albumId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "photos_pkey" PRIMARY KEY ("id")
);

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'albums_authorId_fkey'
    ) THEN
        ALTER TABLE "albums" ADD CONSTRAINT "albums_authorId_fkey" 
            FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'photos_albumId_fkey'
    ) THEN
        ALTER TABLE "photos" ADD CONSTRAINT "photos_albumId_fkey" 
            FOREIGN KEY ("albumId") REFERENCES "albums"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- ==========================================
-- 8. Verification
-- ==========================================

SELECT '✅ Migration completed successfully!' as status;

-- Show added columns to users table
SELECT 'users table columns:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('twoFactorSecret', 'twoFactorEnabled', 'lastLoginAt')
ORDER BY column_name;

-- Show itineraries columns
SELECT 'itineraries table columns:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'itineraries' 
AND column_name IN ('departureDate', 'returnDate', 'requirements', 'collaborators')
ORDER BY column_name;

-- Show new tables
SELECT 'New tables created:' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('push_subscriptions', 'achievements', 'user_achievements', 'travel_stats', 'reactions', 'albums', 'photos')
ORDER BY table_name;
