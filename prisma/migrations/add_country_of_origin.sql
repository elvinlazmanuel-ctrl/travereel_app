-- Migration: Add countryOfOrigin field to users table
-- Created: 2026-05-24
-- Issue: Registration fails with "Unknown argument `countryOfOrigin`"
-- Solution: Add missing column to production database

-- Add countryOfOrigin column if it doesn't exist
ALTER TABLE "users" 
ADD COLUMN IF NOT EXISTS "countryOfOrigin" VARCHAR(255);

-- Optional: Set default country for existing users based on common patterns
-- Uncomment if you want to set defaults
-- UPDATE "users" SET "countryOfOrigin" = 'United States' WHERE "countryOfOrigin" IS NULL AND email LIKE '%.com';

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'countryOfOrigin';
