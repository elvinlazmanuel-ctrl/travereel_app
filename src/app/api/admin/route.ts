import { db } from '@/lib/db'
import { verifyAdmin } from '@/lib/auth-utils'
import { NextResponse } from 'next/server'
import { withRateLimit } from '@/lib/api-utils'
import { validateBody, validateQuery, adminActionSchema, userIdSchema } from '@/lib/validation'

// GET /api/admin - get admin dashboard stats
export async function GET(request: Request) {
  try {
    // Rate limit GET requests
    const rateLimitResponse = withRateLimit(request, 'strict')
    if (rateLimitResponse) return rateLimitResponse

    const { searchParams } = new URL(request.url)
    const requestingUserId = searchParams.get('requestingUserId')

    if (!requestingUserId) {
      return NextResponse.json(
        { error: 'Requesting user ID is required' },
        { status: 401 }
      )
    }

    const validation = validateQuery(userIdSchema, requestingUserId)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const isAdmin = await verifyAdmin(requestingUserId)
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: admin access required' },
        { status: 403 }
      )
    }
    const [
      userCount,
      postCount,
      communityCount,
      commentCount,
      likeCount,
      reportCount,
      storyCount,
      itineraryCount,
      pendingReports,
    ] = await Promise.all([
      db.user.count(),
      db.post.count(),
      db.community.count(),
      db.comment.count(),
      db.like.count(),
      db.postReport.count(),
      db.story.count(),
      db.itinerary.count(),
      db.postReport.count({ where: { status: 'pending' } }),
    ])

    // Get recent admin actions
    const recentActions = await db.adminAction.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        admin: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
      },
    })

    // Get user growth (last 7 users)
    const recentUsers = await db.user.findMany({
      take: 7,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        name: true,
        avatar: true,
        role: true,
        isBanned: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      stats: {
        userCount,
        postCount,
        communityCount,
        commentCount,
        likeCount,
        reportCount,
        storyCount,
        itineraryCount,
        pendingReports,
      },
      recentActions,
      recentUsers,
    })
  } catch (error) {
    console.error('Get admin stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/admin - log admin action { adminId, action, targetType, targetId, details }
export async function POST(request: Request) {
  try {
    // Rate limit write operations
    const rateLimitResponse = withRateLimit(request, 'strict')
    if (rateLimitResponse) return rateLimitResponse

    const body = await request.json()
    const validation = validateBody(adminActionSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    const { adminId, action, targetType, targetId, details } = validation.data

    const isAdmin = await verifyAdmin(adminId)
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: admin access required' },
        { status: 403 }
      )
    }

    const adminAction = await db.adminAction.create({
      data: {
        adminId,
        action,
        targetType,
        targetId,
        details: details || null,
      },
      include: {
        admin: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
      },
    })

    return NextResponse.json({ action: adminAction }, { status: 201 })
  } catch (error) {
    console.error('Create admin action error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
