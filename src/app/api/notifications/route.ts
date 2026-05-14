import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { withRateLimit } from '@/lib/api-utils'
import { validateBody, validateQuery, markNotificationReadSchema, createNotificationSchema, userIdSchema } from '@/lib/validation'

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

    const notifications = await db.notification.findMany({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Enrich with fromUser info when fromUserId is present
    const enrichedNotifications = await Promise.all(
      notifications.map(async (notification) => {
        let fromUser: { id: string; username: string; name: string; avatar: string | null } | null = null
        if (notification.fromUserId) {
          fromUser = await db.user.findUnique({
            where: { id: notification.fromUserId },
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true,
            },
          })
        }
        return {
          ...notification,
          fromUser,
        }
      })
    )

    return NextResponse.json({ notifications: enrichedNotifications })
  } catch (error) {
    console.error('Get notifications error:', error)
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
    const validation = validateBody(createNotificationSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    const { userId, type, message, fromUserId, postId } = validation.data

    const notification = await db.notification.create({
      data: {
        userId,
        type,
        message,
        fromUserId: fromUserId || null,
        postId: postId || null,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
      },
    })

    // Fetch fromUser if provided
    let fromUser: { id: string; username: string; name: string; avatar: string | null } | null = null
    if (fromUserId) {
      fromUser = await db.user.findUnique({
        where: { id: fromUserId },
        select: {
          id: true,
          username: true,
          name: true,
          avatar: true,
        },
      })
    }

    return NextResponse.json(
      { notification: { ...notification, fromUser } },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create notification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    // Rate limit write operations
    const rateLimitResponse = withRateLimit(request, 'strict')
    if (rateLimitResponse) return rateLimitResponse

    const body = await request.json()
    const validation = validateBody(markNotificationReadSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    const { userId, notificationId } = validation.data

    if (notificationId) {
      // Mark a single notification as read
      await db.notification.updateMany({
        where: {
          id: notificationId,
          userId,
        },
        data: {
          read: true,
        },
      })
    } else {
      // Mark all notifications as read for the user
      await db.notification.updateMany({
        where: {
          userId,
          read: false,
        },
        data: {
          read: true,
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Mark notifications read error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
