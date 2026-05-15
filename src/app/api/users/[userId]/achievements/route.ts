import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId

    // Try to fetch user achievements from database
    let userAchievements: any[] = []
    
    try {
      userAchievements = await (db as any).userAchievement?.findMany({
        where: { userId },
        include: {
          achievement: true,
        },
        orderBy: {
          unlockedAt: 'desc',
        },
      }) || []
    } catch (error) {
      console.log('Achievements table not available yet (migration pending)')
    }

    // If no achievements found in DB, calculate progress based on user data
    if (userAchievements.length === 0) {
      userAchievements = await calculateAchievementProgress(userId)
    }

    return NextResponse.json(userAchievements)
  } catch (error) {
    console.error('Error fetching achievements:', error)
    return NextResponse.json(
      { error: 'Failed to fetch achievements' },
      { status: 500 }
    )
  }
}

// Calculate achievement progress based on actual user data
async function calculateAchievementProgress(userId: string) {
  const achievements = [
    // Travel
    { slug: 'first-trip', requirement: 1 },
    { slug: 'world-explorer', requirement: 5 },
    { slug: 'globe-trotter', requirement: 10 },
    { slug: 'frequent-flyer', requirement: 10 },
    { slug: 'long-journey', requirement: 14 },
    // Social
    { slug: 'social-butterfly', requirement: 50 },
    { slug: 'influencer', requirement: 100 },
    { slug: 'community-builder', requirement: 5 },
    // Content
    { slug: 'storyteller', requirement: 25 },
    { slug: 'photographer', requirement: 100 },
    { slug: 'popular-post', requirement: 100 },
    // Milestone
    { slug: 'one-year', requirement: 365 },
    { slug: 'dedicated-traveler', requirement: 100 },
    { slug: 'budget-master', requirement: 10000 },
    { slug: 'legend', requirement: 14 },
  ]

  // Fetch user data
  const [itineraries, followers, posts] = await Promise.all([
    db.itinerary.findMany({ where: { authorId: userId } }),
    db.follow.count({ where: { followingId: userId } }),
    db.post.count({ where: { authorId: userId } }),
  ])

  // Calculate progress for each achievement
  const progress: Record<string, number> = {
    'first-trip': itineraries.length > 0 ? 1 : 0,
    'world-explorer': new Set(itineraries.map(i => i.country)).size,
    'globe-trotter': new Set(itineraries.map(i => i.country)).size,
    'frequent-flyer': itineraries.length,
    'long-journey': Math.max(...itineraries.map(i => i.days), 0),
    'social-butterfly': followers,
    'influencer': followers,
    'community-builder': 0, // Need to fetch community memberships
    'storyteller': posts,
    'photographer': 0, // Need to count photos
    'popular-post': 0, // Need to check max likes on a post
    'one-year': Math.floor((Date.now() - new Date().setFullYear(new Date().getFullYear() - 1)) / (1000 * 60 * 60 * 24)),
    'dedicated-traveler': itineraries.reduce((sum, i) => sum + i.days, 0),
    'budget-master': itineraries.reduce((sum, i) => sum + i.budget, 0),
    'legend': 0, // Special case - count unlocked achievements
  }

  // Map to achievement objects
  return achievements.map(ach => {
    const currentProgress = progress[ach.slug] || 0
    const isUnlocked = currentProgress >= ach.requirement

    return {
      achievement: {
        id: ach.slug,
        slug: ach.slug,
        title: ach.slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        description: `Achievement: ${ach.slug}`,
        icon: '🏆',
        category: 'travel',
        requirement: ach.requirement,
      },
      unlockedAt: isUnlocked ? new Date().toISOString() : null,
      progress: currentProgress,
    }
  })
}
