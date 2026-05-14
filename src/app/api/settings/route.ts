import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { withRateLimit } from '@/lib/api-utils'
import { validateBody, validateQuery, updateSettingsSchema, userIdSchema } from '@/lib/validation'

// GET /api/settings?userId=xxx - get user settings
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

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        avatar: true,
        bio: true,
        isPrivate: true,
        role: true,
        currency: true,
        travelType: true,
        language: true,
        notificationsEnabled: true,
        activityStatus: true,
        darkMode: true,
        isBanned: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ settings: user })
  } catch (error) {
    console.error('Get settings error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/settings - update user settings { userId, ...fields }
export async function PUT(request: Request) {
  try {
    // Rate limit write operations
    const rateLimitResponse = withRateLimit(request, 'strict')
    if (rateLimitResponse) return rateLimitResponse

    const body = await request.json()
    const validation = validateBody(updateSettingsSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    const {
      userId,
      currency,
      travelType,
      language,
      notificationsEnabled,
      activityStatus,
      darkMode,
      isPrivate,
      bio,
      name,
      avatar,
    } = validation.data

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Build update data with only provided fields
    const updateData: Record<string, unknown> = {}
    if (currency !== undefined) updateData.currency = currency
    if (travelType !== undefined) updateData.travelType = travelType
    if (language !== undefined) updateData.language = language
    if (notificationsEnabled !== undefined) updateData.notificationsEnabled = notificationsEnabled
    if (activityStatus !== undefined) updateData.activityStatus = activityStatus
    if (darkMode !== undefined) updateData.darkMode = darkMode
    if (isPrivate !== undefined) updateData.isPrivate = isPrivate
    if (bio !== undefined) updateData.bio = bio
    if (name !== undefined) updateData.name = name
    if (avatar !== undefined) updateData.avatar = avatar

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        avatar: true,
        bio: true,
        isPrivate: true,
        role: true,
        currency: true,
        travelType: true,
        language: true,
        notificationsEnabled: true,
        activityStatus: true,
        darkMode: true,
        isBanned: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ settings: updatedUser })
  } catch (error) {
    console.error('Update settings error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
