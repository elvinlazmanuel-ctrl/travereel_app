-- Phase 4 Database Migration
-- Run this in Supabase SQL Editor
-- Date: 2026-05-14

-- ============================================
-- 1. Create Reactions Table
-- ============================================
CREATE TABLE IF NOT EXISTS "reactions" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "postId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL, -- like, love, wow, haha, sad, angry
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE ("postId", "userId")
);

-- ============================================
-- 2. Create Albums Table
-- ============================================
CREATE TABLE IF NOT EXISTS "albums" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" TEXT NOT NULL,
  "description" TEXT,
  "authorId" TEXT NOT NULL,
  "coverUrl" TEXT,
  "isPublic" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. Create Photos Table
-- ============================================
CREATE TABLE IF NOT EXISTS "photos" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "albumId" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "caption" TEXT,
  "order" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 4. Add Foreign Key Constraints
-- ============================================

-- Reactions -> Posts
ALTER TABLE "reactions" 
  ADD CONSTRAINT "reactions_postId_fkey" 
  FOREIGN KEY ("postId") 
  REFERENCES "posts"("id") 
  ON DELETE CASCADE;

-- Reactions -> Users
ALTER TABLE "reactions" 
  ADD CONSTRAINT "reactions_userId_fkey" 
  FOREIGN KEY ("userId") 
  REFERENCES "users"("id") 
  ON DELETE CASCADE;

-- Albums -> Users
ALTER TABLE "albums" 
  ADD CONSTRAINT "albums_authorId_fkey" 
  FOREIGN KEY ("authorId") 
  REFERENCES "users"("id") 
  ON DELETE CASCADE;

-- Photos -> Albums
ALTER TABLE "photos" 
  ADD CONSTRAINT "photos_albumId_fkey" 
  FOREIGN KEY ("albumId") 
  REFERENCES "albums"("id") 
  ON DELETE CASCADE;

-- ============================================
-- 5. Create Indexes for Performance
-- ============================================

-- Reactions indexes
CREATE INDEX IF NOT EXISTS "reactions_postId_idx" ON "reactions"("postId");
CREATE INDEX IF NOT EXISTS "reactions_userId_idx" ON "reactions"("userId");
CREATE INDEX IF NOT EXISTS "reactions_type_idx" ON "reactions"("type");

-- Albums indexes
CREATE INDEX IF NOT EXISTS "albums_authorId_idx" ON "albums"("authorId");
CREATE INDEX IF NOT EXISTS "albums_isPublic_idx" ON "albums"("isPublic");

-- Photos indexes
CREATE INDEX IF NOT EXISTS "photos_albumId_idx" ON "photos"("albumId");
CREATE INDEX IF NOT EXISTS "photos_order_idx" ON "photos"("albumId", "order");

-- ============================================
-- 6. Add Comments (Optional but Helpful)
-- ============================================

COMMENT ON TABLE "reactions" IS 'Expanded reactions system (like, love, wow, etc.)';
COMMENT ON TABLE "albums" IS 'User photo albums';
COMMENT ON TABLE "photos" IS 'Photos within albums';

-- ============================================
-- Migration Complete!
-- ============================================
-- Verify tables created:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('reactions', 'albums', 'photos');
