import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { withRateLimit } from '@/lib/api-utils'
import { validateBody, validateQuery, toggleLikeSchema, userIdSchema } from '@/lib/validation'

export async function POST(request: Request) {
  try {
    // Rate limit write operations
    const rateLimitResponse = withRateLimit(request, 'strict')
    if (rateLimitResponse) return rateLimitResponse

    const body = await request.json()
    const validation = validateBody(toggleLikeSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    const { userId, postId } = validation.data

    // Check if already liked
    const existing = await db.like.findUnique({
      where: { userId_postId: { userId, postId } },
    })

    if (existing) {
      return NextResponse.json({ error: 'Already liked' }, { status: 409 })
    }

    const like = await db.like.create({
      data: { userId, postId },
    })

    // Create notification for post author
    const post = await db.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    })

    if (post && post.authorId !== userId) {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { username: true },
      })

      await db.notification.create({
        data: {
          userId: post.authorId,
          type: 'like',
          message: `${user?.username || 'Someone'} liked your post`,
          fromUserId: userId,
          postId,
        },
      })
    }

    return NextResponse.json({ like }, { status: 201 })
  } catch (error) {
    console.error('Create like error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    // Rate limit write operations
    const rateLimitResponse = withRateLimit(request, 'strict')
    if (rateLimitResponse) return rateLimitResponse

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const postId = searchParams.get('postId')

    if (!userId || !postId) {
      return NextResponse.json(
        { error: 'User ID and Post ID are required' },
        { status: 400 }
      )
    }

    const validation = validateQuery(toggleLikeSchema, { userId, postId })
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    await db.like.deleteMany({
      where: { userId, postId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete like error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    // Rate limit GET requests
    const rateLimitResponse = withRateLimit(request, 'default')
    if (rateLimitResponse) return rateLimitResponse

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const postIdsParam = searchParams.get('postIds')

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

    // Get all post IDs the user has liked
    const where: { userId: string; postId?: { in: string[] } } = { userId }
    if (postIdsParam) {
      where.postId = { in: postIdsParam.split(',') }
    }

    const likes = await db.like.findMany({
      where,
      select: { postId: true },
    })

    return NextResponse.json({ likedPostIds: likes.map((l) => l.postId) })
  } catch (error) {
    console.error('Get likes error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
