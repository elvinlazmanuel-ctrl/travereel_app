import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { withRateLimit } from '@/lib/api-utils'
import { validateBody, validateQuery, createStoryViewSchema } from '@/lib/validation'

// POST /api/story-views - mark story as viewed { userId, storyId }
export async function POST(request: Request) {
  try {
    // Rate limit write operations
    const rateLimitResponse = withRateLimit(request, 'strict')
    if (rateLimitResponse) return rateLimitResponse

    const body = await request.json()
    const validation = validateBody(createStoryViewSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    const { userId, storyId } = validation.data

    // Check if already viewed
    const existing = await db.storyView.findUnique({
      where: {
        userId_storyId: { userId, storyId },
      },
    })

    if (existing) {
      return NextResponse.json({ view: existing })
    }

    const view = await db.storyView.create({
      data: { userId, storyId },
    })

    return NextResponse.json({ view }, { status: 201 })
  } catch (error) {
    console.error('Create story view error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/story-views?storyId=xxx - get view count for a story
export async function GET(request: Request) {
  try {
    // Rate limit GET requests
    const rateLimitResponse = withRateLimit(request, 'default')
    if (rateLimitResponse) return rateLimitResponse

    const { searchParams } = new URL(request.url)
    const storyId = searchParams.get('storyId')
    const userId = searchParams.get('userId')

    if (!storyId) {
      return NextResponse.json(
        { error: 'Story ID is required' },
        { status: 400 }
      )
    }

    const views = await db.storyView.count({
      where: { storyId },
    })

    let isViewed = false
    if (userId) {
      const existing = await db.storyView.findUnique({
        where: {
          userId_storyId: { userId, storyId },
        },
      })
      isViewed = !!existing
    }

    return NextResponse.json({ views, isViewed })
  } catch (error) {
    console.error('Get story views error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
