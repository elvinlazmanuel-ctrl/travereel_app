import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { withRateLimit } from '@/lib/api-utils'
import { validateBody, validateQuery, toggleBookmarkSchema, userIdSchema } from '@/lib/validation'

// GET /api/bookmarks?userId=xxx - get user's bookmarked posts
export async function GET(request: Request) {
  try {
    // Rate limit GET requests
    const rateLimitResponse = withRateLimit(request, 'default')
    if (rateLimitResponse) return rateLimitResponse

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const validation = validateQuery(userIdSchema, userId)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const bookmarks = await db.bookmark.findMany({
      where: { userId },
      include: {
        post: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                name: true,
                avatar: true,
              },
            },
            _count: {
              select: {
                likes: true,
                comments: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const bookmarkedPosts = bookmarks.map((bookmark) => ({
      ...bookmark,
      post: {
        ...bookmark.post,
        images: JSON.parse(bookmark.post.images),
        tags: bookmark.post.tags ? JSON.parse(bookmark.post.tags) : [],
      },
    }))

    return NextResponse.json({ bookmarks: bookmarkedPosts })
  } catch (error) {
    console.error('Get bookmarks error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/bookmarks - create bookmark { userId, postId }
export async function POST(request: Request) {
  try {
    // Rate limit write operations
    const rateLimitResponse = withRateLimit(request, 'strict')
    if (rateLimitResponse) return rateLimitResponse

    const body = await request.json()
    const validation = validateBody(toggleBookmarkSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    const { userId, postId } = validation.data

    // Check if already bookmarked
    const existing = await db.bookmark.findUnique({
      where: {
        userId_postId: { userId, postId },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Already bookmarked' },
        { status: 409 }
      )
    }

    const bookmark = await db.bookmark.create({
      data: { userId, postId },
    })

    return NextResponse.json({ bookmark }, { status: 201 })
  } catch (error) {
    console.error('Create bookmark error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/bookmarks - remove bookmark { userId, postId }
export async function DELETE(request: Request) {
  try {
    // Rate limit write operations
    const rateLimitResponse = withRateLimit(request, 'strict')
    if (rateLimitResponse) return rateLimitResponse

    const body = await request.json()
    const validation = validateBody(toggleBookmarkSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    const { userId, postId } = validation.data

    await db.bookmark.deleteMany({
      where: { userId, postId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete bookmark error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
