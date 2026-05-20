-- Complete Migration for Production Database
-- Run this in Supabase SQL Editor: https://app.supabase.com/project/YOUR_PROJECT/sql
-- This adds all missing columns from the Prisma schema

-- ==========================================
-- 1. Add Security Columns to Users Table
-- ==========================================

-- Add two-factor authentication columns if they don't exist
DO $$ 
BEGIN
    -- twoFactorSecret
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'twoFactorSecret') THEN
        ALTER TABLE "users" ADD COLUMN "twoFactorSecret" TEXT;
    END IF;

    -- twoFactorEnabled
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'twoFactorEnabled') THEN
        ALTER TABLE "users" ADD COLUMN "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false;
    END IF;

    -- twoFactorBackupCodes
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'twoFactorBackupCodes') THEN
        ALTER TABLE "users" ADD COLUMN "twoFactorBackupCodes" TEXT;
    END IF;

    -- lastLoginAt
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'lastLoginAt') THEN
        ALTER TABLE "users" ADD COLUMN "lastLoginAt" TIMESTAMP(3);
    END IF;

    -- lastLoginIp
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'lastLoginIp') THEN
        ALTER TABLE "users" ADD COLUMN "lastLoginIp" TEXT;
    END IF;

    -- loginAttempts
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'loginAttempts') THEN
        ALTER TABLE "users" ADD COLUMN "loginAttempts" INTEGER NOT NULL DEFAULT 0;
    END IF;

    -- lockedUntil
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'lockedUntil') THEN
        ALTER TABLE "users" ADD COLUMN "lockedUntil" TIMESTAMP(3);
    END IF;
END $$;

-- ==========================================
-- 2. Create PushSubscription Table
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

-- Create unique index on endpoint
CREATE UNIQUE INDEX IF NOT EXISTS "push_subscriptions_endpoint_key" ON "push_subscriptions"("endpoint");

-- Add foreign key constraint
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
-- 3. Verify Migration
-- ==========================================

SELECT 'Migration completed successfully!' as status;

-- Verify users table has the new columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN (
    'twoFactorSecret', 
    'twoFactorEnabled', 
    'twoFactorBackupCodes',
    'lastLoginAt',
    'lastLoginIp',
    'loginAttempts',
    'lockedUntil'
)
ORDER BY column_name;

-- Verify push_subscriptions table exists
SELECT 'push_subscriptions table created' as check_result
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'push_subscriptions');
