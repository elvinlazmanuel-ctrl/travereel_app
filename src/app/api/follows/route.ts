import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { withRateLimit } from '@/lib/api-utils'
import { validateBody, validateQuery, followSchema, userIdSchema } from '@/lib/validation'

export async function GET(request: Request) {
  try {
    // Rate limit GET requests
    const rateLimitResponse = withRateLimit(request, 'default')
    if (rateLimitResponse) return rateLimitResponse

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const type = searchParams.get('type') || 'followers'

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const validation = validateQuery(userIdSchema, userId)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    if (type === 'followers') {
      const followers = await db.follow.findMany({
        where: { followingId: userId },
        include: {
          follower: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true,
              bio: true,
              isPrivate: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      return NextResponse.json({
        count: followers.length,
        users: followers.map((f) => f.follower),
      })
    }

    if (type === 'following') {
      const following = await db.follow.findMany({
        where: { followerId: userId },
        include: {
          following: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true,
              bio: true,
              isPrivate: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      return NextResponse.json({
        count: following.length,
        users: following.map((f) => f.following),
      })
    }

    // Return both counts
    const [followersCount, followingCount] = await Promise.all([
      db.follow.count({ where: { followingId: userId } }),
      db.follow.count({ where: { followerId: userId } }),
    ])

    return NextResponse.json({ followersCount, followingCount })
  } catch (error) {
    console.error('Get follows error:', error)
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
    const validation = validateBody(followSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { followerId, followingId } = validation.data

    const follow = await db.follow.create({
      data: { followerId, followingId },
    })

    // Create notification for the followed user
    const follower = await db.user.findUnique({
      where: { id: followerId },
      select: { name: true, username: true },
    })

    if (follower) {
      await db.notification.create({
        data: {
          userId: followingId,
          type: 'follow',
          message: `${follower.name || follower.username} started following you`,
          fromUserId: followerId,
        },
      })
    }

    return NextResponse.json({ follow }, { status: 201 })
  } catch (error) {
    console.error('Create follow error:', error)
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
    const followerId = searchParams.get('followerId')
    const followingId = searchParams.get('followingId')

    if (!followerId || !followingId) {
      return NextResponse.json({ error: 'Both IDs are required' }, { status: 400 })
    }

    const validation = validateQuery(followSchema, { followerId, followingId })
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    await db.follow.deleteMany({
      where: { followerId, followingId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete follow error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
