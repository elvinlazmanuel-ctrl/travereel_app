import { db } from '@/lib/db'
import { verifyAdmin } from '@/lib/auth-utils'
import { NextResponse } from 'next/server'
import { withRateLimit } from '@/lib/api-utils'
import { validateBody, validateQuery, userIdSchema } from '@/lib/validation'

export async function GET(request: Request) {
  try {
    // Rate limit GET requests
    const rateLimitResponse = withRateLimit(request, 'default')
    if (rateLimitResponse) return rateLimitResponse

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    const id = searchParams.get('id')

    // Get single user by ID
    if (id && !search && !role) {
      const validation = validateQuery(userIdSchema, id)
      if (!validation.success) {
        return NextResponse.json({ error: validation.error }, { status: 400 })
      }

      const user = await db.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          avatar: true,
          bio: true,
          isPrivate: true,
          role: true,
          createdAt: true,
          _count: {
            select: {
              posts: true,
              followers: true,
              following: true,
            },
          },
        },
      })

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      return NextResponse.json({
        user: {
          ...user,
          followersCount: user._count.followers,
          followingCount: user._count.following,
          postsCount: user._count.posts,
        },
      })
    }

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { username: { contains: search } },
        { name: { contains: search } },
        { email: { contains: search } },
      ]
    }

    if (role) {
      where.role = role
    }

    const users = await db.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        avatar: true,
        bio: true,
        isPrivate: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            posts: true,
            followers: true,
            following: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Get users error:', error)
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
    const { userId, role, action, name, bio, requestingUserId } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const validation = validateBody(userIdSchema, userId)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Admin actions - verify requesting user is admin
    if (action === 'ban' || action === 'unban') {
      if (!requestingUserId) {
        return NextResponse.json({ error: 'Requesting user ID is required for admin actions' }, { status: 401 })
      }
      const isAdmin = await verifyAdmin(requestingUserId)
      if (!isAdmin) {
        return NextResponse.json({ error: 'Forbidden: admin access required' }, { status: 403 })
      }
      const user = await db.user.update({
        where: { id: userId },
        data: { isBanned: action === 'ban' },
      })
      return NextResponse.json({ user: { id: user.id, isBanned: user.isBanned } })
    }

    if (role) {
      if (!requestingUserId) {
        return NextResponse.json({ error: 'Requesting user ID is required for role changes' }, { status: 401 })
      }
      const isAdmin = await verifyAdmin(requestingUserId)
      if (!isAdmin) {
        return NextResponse.json({ error: 'Forbidden: admin access required' }, { status: 403 })
      }
      const user = await db.user.update({
        where: { id: userId },
        data: { role },
      })
      return NextResponse.json({ user: { id: user.id, role: user.role } })
    }

    // Profile update
    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (bio !== undefined) updateData.bio = bio

    if (Object.keys(updateData).length > 0) {
      const user = await db.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          avatar: true,
          bio: true,
          isPrivate: true,
          role: true,
        },
      })
      return NextResponse.json({ user })
    }

    return NextResponse.json({ error: 'No action specified' }, { status: 400 })
  } catch (error) {
    console.error('Update user error:', error)
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
    const requestingUserId = searchParams.get('requestingUserId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    if (!requestingUserId) {
      return NextResponse.json({ error: 'Requesting user ID is required' }, { status: 401 })
    }

    const isAdmin = await verifyAdmin(requestingUserId)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: admin access required' }, { status: 403 })
    }

    await db.user.delete({ where: { id: userId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
