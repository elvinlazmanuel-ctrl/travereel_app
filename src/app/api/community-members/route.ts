import { db } from '@/lib/db'
import { verifyAdmin } from '@/lib/auth-utils'
import { NextResponse } from 'next/server'
import { withRateLimit } from '@/lib/api-utils'
import { z } from 'zod'

const addMemberSchema = z.object({
  communityId: z.string().min(1, 'Community ID is required'),
  userId: z.string().min(1, 'User ID is required'),
  role: z.enum(['admin', 'member']).default('member'),
  requestingUserId: z.string().min(1, 'Requesting user ID is required'),
})

const removeMemberSchema = z.object({
  communityId: z.string().min(1, 'Community ID is required'),
  userId: z.string().min(1, 'User ID is required'),
  requestingUserId: z.string().min(1, 'Requesting user ID is required'),
})

const changeRoleSchema = z.object({
  communityId: z.string().min(1, 'Community ID is required'),
  userId: z.string().min(1, 'User ID is required'),
  role: z.enum(['admin', 'member']),
  requestingUserId: z.string().min(1, 'Requesting user ID is required'),
})

// POST /api/community-members - Add a member to a community
export async function POST(request: Request) {
  try {
    const rateLimitResponse = withRateLimit(request, 'strict')
    if (rateLimitResponse) return rateLimitResponse

    const body = await request.json()
    const validation = addMemberSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    const { communityId, userId, role, requestingUserId } = validation.data

    // Verify admin access
    const isAdmin = await verifyAdmin(requestingUserId)
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: admin access required' },
        { status: 403 }
      )
    }

    // Verify community exists
    const community = await db.community.findUnique({
      where: { id: communityId },
    })
    if (!community) {
      return NextResponse.json(
        { error: 'Community not found' },
        { status: 404 }
      )
    }

    // Verify user exists
    const user = await db.user.findUnique({
      where: { id: userId },
    })
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if already a member
    const existingMember = await db.communityMember.findUnique({
      where: {
        userId_communityId: { userId, communityId },
      },
    })

    if (existingMember) {
      return NextResponse.json(
        { error: 'User is already a member of this community' },
        { status: 409 }
      )
    }

    // Add member
    const member = await db.communityMember.create({
      data: {
        userId,
        communityId,
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
            bio: true,
          },
        },
      },
    })

    // Increment member count
    await db.community.update({
      where: { id: communityId },
      data: { members: { increment: 1 } },
    })

    return NextResponse.json({ member }, { status: 201 })
  } catch (error) {
    console.error('Add community member error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/community-members - Remove a member from a community
export async function DELETE(request: Request) {
  try {
    const rateLimitResponse = withRateLimit(request, 'strict')
    if (rateLimitResponse) return rateLimitResponse

    const body = await request.json()
    const validation = removeMemberSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    const { communityId, userId, requestingUserId } = validation.data

    // Verify admin access
    const isAdmin = await verifyAdmin(requestingUserId)
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: admin access required' },
        { status: 403 }
      )
    }

    // Check if member exists
    const existingMember = await db.communityMember.findUnique({
      where: {
        userId_communityId: { userId, communityId },
      },
    })

    if (!existingMember) {
      return NextResponse.json(
        { error: 'User is not a member of this community' },
        { status: 404 }
      )
    }

    // Don't allow removing the community creator (original admin)
    if (existingMember.role === 'admin') {
      return NextResponse.json(
        { error: 'Cannot remove community admin' },
        { status: 400 }
      )
    }

    // Remove member
    await db.communityMember.delete({
      where: {
        userId_communityId: { userId, communityId },
      },
    })

    // Decrement member count
    await db.community.update({
      where: { id: communityId },
      data: { members: { decrement: 1 } },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Remove community member error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/community-members - Change member role
export async function PUT(request: Request) {
  try {
    const rateLimitResponse = withRateLimit(request, 'strict')
    if (rateLimitResponse) return rateLimitResponse

    const body = await request.json()
    const validation = changeRoleSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    const { communityId, userId, role, requestingUserId } = validation.data

    // Verify admin access
    const isAdmin = await verifyAdmin(requestingUserId)
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: admin access required' },
        { status: 403 }
      )
    }

    // Check if member exists
    const existingMember = await db.communityMember.findUnique({
      where: {
        userId_communityId: { userId, communityId },
      },
    })

    if (!existingMember) {
      return NextResponse.json(
        { error: 'User is not a member of this community' },
        { status: 404 }
      )
    }

    // Update role
    const member = await db.communityMember.update({
      where: {
        userId_communityId: { userId, communityId },
      },
      data: { role },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
            bio: true,
          },
        },
      },
    })

    return NextResponse.json({ member })
  } catch (error) {
    console.error('Change member role error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
