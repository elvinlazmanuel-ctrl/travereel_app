import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const achievements = [
  // Travel Achievements (5)
  {
    slug: 'first-trip',
    title: 'First Steps',
    description: 'Create your first itinerary',
    icon: '🎒',
    category: 'travel',
    requirement: 1,
  },
  {
    slug: 'world-explorer',
    title: 'World Explorer',
    description: 'Visit 5 different countries',
    icon: '🌍',
    category: 'travel',
    requirement: 5,
  },
  {
    slug: 'globe-trotter',
    title: 'Globe Trotter',
    description: 'Visit 10 different countries',
    icon: '✈️',
    category: 'travel',
    requirement: 10,
  },
  {
    slug: 'frequent-flyer',
    title: 'Frequent Flyer',
    description: 'Complete 10 trips',
    icon: '🛫',
    category: 'travel',
    requirement: 10,
  },
  {
    slug: 'long-journey',
    title: 'Long Journey',
    description: 'Complete a trip of 14+ days',
    icon: '🗓️',
    category: 'travel',
    requirement: 14,
  },

  // Social Achievements (3)
  {
    slug: 'social-butterfly',
    title: 'Social Butterfly',
    description: 'Gain 50 followers',
    icon: '🦋',
    category: 'social',
    requirement: 50,
  },
  {
    slug: 'influencer',
    title: 'Influencer',
    description: 'Gain 100 followers',
    icon: '⭐',
    category: 'social',
    requirement: 100,
  },
  {
    slug: 'community-builder',
    title: 'Community Builder',
    description: 'Join 5 communities',
    icon: '👥',
    category: 'social',
    requirement: 5,
  },

  // Content Achievements (3)
  {
    slug: 'storyteller',
    title: 'Storyteller',
    description: 'Create 25 posts',
    icon: '📝',
    category: 'content',
    requirement: 25,
  },
  {
    slug: 'photographer',
    title: 'Photographer',
    description: 'Upload 100 photos',
    icon: '📸',
    category: 'content',
    requirement: 100,
  },
  {
    slug: 'popular-post',
    title: 'Viral Moment',
    description: 'Get 100 likes on a single post',
    icon: '🔥',
    category: 'content',
    requirement: 100,
  },

  // Milestone Achievements (4)
  {
    slug: 'one-year',
    title: 'One Year Club',
    description: 'Be a member for 1 year',
    icon: '🎉',
    category: 'milestone',
    requirement: 365,
  },
  {
    slug: 'dedicated-traveler',
    title: 'Dedicated Traveler',
    description: 'Travel for 100 total days',
    icon: '🏆',
    category: 'milestone',
    requirement: 100,
  },
  {
    slug: 'budget-master',
    title: 'Budget Master',
    description: 'Track $10,000 in travel budget',
    icon: '💰',
    category: 'milestone',
    requirement: 10000,
  },
  {
    slug: 'legend',
    title: 'Travel Legend',
    description: 'Unlock all other achievements',
    icon: '👑',
    category: 'milestone',
    requirement: 14,
  },
]

async function main() {
  console.log('🚀 Seeding achievements...\n')

  let created = 0
  let updated = 0

  for (const achievement of achievements) {
    try {
      const result = await (prisma as any).achievement?.upsert({
        where: { slug: achievement.slug },
        update: achievement,
        create: achievement,
      })

      if (!result) {
        console.log(`⚠️  Achievement table not ready (migration pending): ${achievement.title}`)
        continue
      }

      if (result.createdAt) {
        created++
        console.log(`✅ Created: ${achievement.icon} ${achievement.title}`)
      } else {
        updated++
        console.log(`🔄 Updated: ${achievement.icon} ${achievement.title}`)
      }
    } catch (error: any) {
      if (error.code === 'P2002') {
        console.log(`⚠️  Already exists: ${achievement.title}`)
        updated++
      } else {
        console.error(`❌ Error seeding ${achievement.slug}:`, error.message)
      }
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log(`🎉 Seeding complete!`)
  console.log(`📊 Created: ${created}`)
  console.log(`🔄 Updated: ${updated}`)
  console.log(`📋 Total: ${achievements.length} achievements`)
  console.log('='.repeat(50))
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e.message)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
