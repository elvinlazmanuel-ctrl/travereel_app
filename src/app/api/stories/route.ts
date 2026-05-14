import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { withRateLimit } from '@/lib/api-utils'
import { validateBody, createStorySchema, userIdSchema } from '@/lib/validation'

export async function GET(request: Request) {
  try {
    // Rate limit GET requests
    const rateLimitResponse = withRateLimit(request, 'default')
    if (rateLimitResponse) return rateLimitResponse

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    const stories = await db.story.findMany({
      where: {
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
        views: userId ? {
          where: { userId },
          select: { id: true },
        } : false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const storiesWithViewed = stories.map((story) => ({
      ...story,
      viewed: userId ? story.views.length > 0 : false,
      views: undefined,
    }))

    return NextResponse.json({ stories: storiesWithViewed })
  } catch (error) {
    console.error('Get stories error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    // Rate limit write operations
    const rateLimitResponse = withRateLimit(request, 'strict')
    if (rateLimitResponse) return rateLimitResponse

    const body = await request.json()
    const validation = validateBody(createStorySchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    const { mediaUrl, mediaType, caption, authorId } = validation.data

    // Set expiresAt to 24 hours from now
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    const story = await db.story.create({
      data: {
        mediaUrl,
        mediaType: mediaType || 'image',
        caption: caption || null,
        authorId,
        expiresAt,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
      },
    })

    return NextResponse.json({ story }, { status: 201 })
  } catch (error) {
    console.error('Create story error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
