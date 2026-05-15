# Database Migration Instructions

## Schema Changes Summary

This migration adds the following database changes from Phase 2 and Phase 3:

### Phase 2 Changes:
1. **Itinerary Model** - Added fields:
   - `collaborators String?` - JSON array of user IDs for collaborative editing
   - `departureDate DateTime?` - Trip start date
   - `returnDate DateTime?` - Trip end date

### Phase 3 Changes:
2. **Achievement Model** (NEW)
   - Achievement badges system
   - Fields: id, slug, title, description, icon, category, requirement

3. **UserAchievement Model** (NEW)
   - Tracks which users unlocked which achievements
   - Fields: id, userId, achievementId, unlockedAt, progress

4. **TravelStats Model** (NEW)
   - Stores user travel statistics
   - Fields: totalTrips, totalCountries, totalCities, totalDays, totalSpent, etc.

5. **User Model** (UPDATED)
   - Added `achievements` relation
   - Added `travelStats` relation

---

## How to Run Migration

### Option 1: Automatic Migration (Recommended)

```bash
# Run this command in the project root
npx prisma migrate dev --name add_collaborations_achievements_and_travel_stats

# This will:
# 1. Create a new migration file
# 2. Apply it to your development database
# 3. Regenerate Prisma Client
```

### Option 2: Create Migration Without Applying

```bash
# Create migration file only (doesn't apply to DB)
npx prisma migrate dev --create-only --name add_collaborations_achievements_and_travel_stats

# Then apply later:
npx prisma migrate dev
```

### Option 3: Manual SQL (If needed)

If automatic migration fails, run this SQL directly in your Supabase dashboard:

```sql
-- Add fields to Itinerary model
ALTER TABLE "itineraries" 
ADD COLUMN "collaborators" TEXT,
ADD COLUMN "departureDate" TIMESTAMP(3),
ADD COLUMN "returnDate" TIMESTAMP(3);

-- Create Achievement table
CREATE TABLE "achievements" (
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

CREATE UNIQUE INDEX "achievements_slug_key" ON "achievements"("slug");

-- Create UserAchievement table
CREATE TABLE "user_achievements" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "progress" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "user_achievements_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_achievements_userId_achievementId_key" ON "user_achievements"("userId", "achievementId");

-- Create TravelStats table
CREATE TABLE "travel_stats" (
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
    "countriesVisited" TEXT NOT NULL,
    "citiesVisited" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "travel_stats_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "travel_stats_userId_key" ON "travel_stats"("userId");

-- Add foreign key constraints
ALTER TABLE "user_achievements" 
ADD CONSTRAINT "user_achievements_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "user_achievements" 
ADD CONSTRAINT "user_achievements_achievementId_fkey" 
FOREIGN KEY ("achievementId") REFERENCES "achievements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "travel_stats" 
ADD CONSTRAINT "travel_stats_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
```

---

## Seed Default Achievements

After migration, you should seed the default achievements. Create a seed script or run this:

```typescript
// Run in a Node.js script or prisma seed file
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const achievements = [
  // Travel Achievements
  { slug: 'first-trip', title: 'First Steps', description: 'Create your first itinerary', icon: '🎒', category: 'travel', requirement: 1 },
  { slug: 'world-explorer', title: 'World Explorer', description: 'Visit 5 different countries', icon: '🌍', category: 'travel', requirement: 5 },
  { slug: 'globe-trotter', title: 'Globe Trotter', description: 'Visit 10 different countries', icon: '✈️', category: 'travel', requirement: 10 },
  { slug: 'frequent-flyer', title: 'Frequent Flyer', description: 'Complete 10 trips', icon: '🛫', category: 'travel', requirement: 10 },
  { slug: 'long-journey', title: 'Long Journey', description: 'Complete a trip of 14+ days', icon: '🗓️', category: 'travel', requirement: 14 },

  // Social Achievements
  { slug: 'social-butterfly', title: 'Social Butterfly', description: 'Gain 50 followers', icon: '🦋', category: 'social', requirement: 50 },
  { slug: 'influencer', title: 'Influencer', description: 'Gain 100 followers', icon: '⭐', category: 'social', requirement: 100 },
  { slug: 'community-builder', title: 'Community Builder', description: 'Join 5 communities', icon: '👥', category: 'social', requirement: 5 },

  // Content Achievements
  { slug: 'storyteller', title: 'Storyteller', description: 'Create 25 posts', icon: '📝', category: 'content', requirement: 25 },
  { slug: 'photographer', title: 'Photographer', description: 'Upload 100 photos', icon: '📸', category: 'content', requirement: 100 },
  { slug: 'popular-post', title: 'Viral Moment', description: 'Get 100 likes on a single post', icon: '🔥', category: 'content', requirement: 100 },

  // Milestone Achievements
  { slug: 'one-year', title: 'One Year Club', description: 'Be a member for 1 year', icon: '🎉', category: 'milestone', requirement: 365 },
  { slug: 'dedicated-traveler', title: 'Dedicated Traveler', description: 'Travel for 100 total days', icon: '🏆', category: 'milestone', requirement: 100 },
  { slug: 'budget-master', title: 'Budget Master', description: 'Track $10,000 in travel budget', icon: '💰', category: 'milestone', requirement: 10000 },
  { slug: 'legend', title: 'Travel Legend', description: 'Unlock all other achievements', icon: '👑', category: 'milestone', requirement: 14 },
]

async function main() {
  console.log('Seeding achievements...')
  
  for (const achievement of achievements) {
    await prisma.achievement.upsert({
      where: { slug: achievement.slug },
      update: achievement,
      create: achievement,
    })
  }
  
  console.log('✅ Seeded 15 achievements!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

---

## Verify Migration

After running the migration, verify it worked:

```bash
# Check migration status
npx prisma migrate status

# Should show:
# Migration 'add_collaborations_achievements_and_travel_stats' is applied
```

---

## Troubleshooting

### Error: "Can't reach database server"
- Check your `DATABASE_URL` in `.env`
- Ensure you have network connectivity
- Try again when connection is stable

### Error: "Migration already exists"
- The migration was already run
- Use `npx prisma migrate status` to check

### Error: "Prisma Client not generated"
- Run: `npx prisma generate`
- Then restart your dev server

---

## Next Steps After Migration

1. ✅ Run migration (see above)
2. ✅ Seed default achievements
3. ✅ Create API routes for:
   - `GET /api/users/:userId/travel-stats`
   - `GET /api/users/:userId/achievements`
   - `GET /api/users/:userId/year-review`
4. ✅ Integrate components into profile page
5. ✅ Test achievement unlocking logic

---

**Migration Status:**
- ✅ Schema validated
- ✅ Prisma Client generated
- ⏳ Migration pending (run when DB connection is stable)
