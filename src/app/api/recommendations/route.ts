import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { withRateLimit } from '@/lib/api-utils'
import { getPersonalizedRecommendations } from '@/lib/recommendations'

/**
 * GET /api/recommendations
 * 
 * Returns personalized travel recommendations based on:
 * - User's past itineraries
 * - Popular destinations
 * - Seasonal trends
 * - Similar users' preferences
 * 
 * Query params:
 * - userId: The user to get recommendations for
 * - limit: Max number of recommendations (default: 10)
 */
export async function GET(request: Request) {
  try {
    // Rate limit
    const rateLimitResponse = withRateLimit(request, 'default')
    if (rateLimitResponse) return rateLimitResponse

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const limit = Math.min(20, parseInt(searchParams.get('limit') || '10', 10))

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    // Get user's itineraries
    const userItineraries = await db.itinerary.findMany({
      where: { authorId: userId },
      select: {
        id: true,
        title: true,
        location: true,
        country: true,
        travelType: true,
        activities: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    // Get popular itineraries (for recommendations)
    const popularItineraries = await db.itinerary.findMany({
      where: { isPublic: true },
      select: {
        id: true,
        title: true,
        location: true,
        country: true,
        travelType: true,
        activities: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' }, // Use recent itineraries
      take: 200,
    })

    // Parse activities (stored as JSON string)
    const parseItinerary = (itinerary: any) => ({
      ...itinerary,
      activities: typeof itinerary.activities === 'string' 
        ? JSON.parse(itinerary.activities) 
        : (itinerary.activities || []),
      savesCount: 0, // TODO: Add saves tracking
      viewsCount: 0, // TODO: Add views tracking
    })

    const userItins = userItineraries.map(parseItinerary)
    const allItins = popularItineraries.map(parseItinerary)

    // Get current month for seasonal recommendations
    const currentMonth = new Date().getMonth()

    // Generate recommendations
    const recommendations = getPersonalizedRecommendations(
      userId,
      userItins,
      allItins,
      currentMonth,
      {
        popularLimit: 5,
        personalizedLimit: limit,
        seasonalLimit: 3,
      }
    )

    return NextResponse.json({
      recommendations,
      total: recommendations.length,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Recommendations error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
