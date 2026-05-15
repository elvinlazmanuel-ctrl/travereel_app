import { db } from '@/lib/db'
import { verifyAdmin } from '@/lib/auth-utils'
import { NextResponse } from 'next/server'
import { withRateLimit } from '@/lib/api-utils'
import { validateBody, validateQuery, createCommunitySchema, updateCommunitySchema, deleteCommunitySchema, communityIdSchema } from '@/lib/validation'

// GET /api/communities - list communities or get single by id
export async function GET(request: Request) {
  try {
    // Rate limit GET requests
    const rateLimitResponse = withRateLimit(request, 'default')
    if (rateLimitResponse) return rateLimitResponse

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const id = searchParams.get('id')
    const search = searchParams.get('search') || ''

    // Get single community by ID
    if (id) {
      const validation = validateQuery(communityIdSchema, id)
      if (!validation.success) {
        return NextResponse.json({ error: validation.error }, { status: 400 })
      }

      const community = await db.community.findUnique({
        where: { id },
        include: {
          sharedPosts: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  name: true,
                  avatar: true,
                },
              },
              post: {
                select: {
                  id: true,
                  caption: true,
                  images: true,
                  location: true,
                  tags: true,
                  author: {
                    select: {
                      id: true,
                      username: true,
                      name: true,
                      avatar: true,
                    },
                  },
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
          communityMembers: {
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
            orderBy: { joinedAt: 'desc' },
          },
        },
      })

      if (!community) {
        return NextResponse.json(
          { error: 'Community not found' },
          { status: 404 }
        )
      }

      const parsedCommunity = {
        ...community,
        sharedPosts: community.sharedPosts.map((sp) => ({
          ...sp,
          post: {
            ...sp.post,
            images: JSON.parse(sp.post.images),
            tags: sp.post.tags ? JSON.parse(sp.post.tags) : [],
          },
        })),
      }

      return NextResponse.json({ community: parsedCommunity })
    }

    // List communities
    const where: Record<string, unknown> = {}
    if (category) where.category = category

    // Search by name or description
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ]
    }

    // Cursor-based pagination parameters
    const cursorParam = searchParams.get('cursor')
    const limitParam = searchParams.get('limit')
    const isPaginated = cursorParam !== null || limitParam !== null
    const cursor = cursorParam || undefined
    const limit = Math.max(1, Math.min(50, parseInt(limitParam || '20', 10)))

    const communities = await db.community.findMany({
      where: {
        ...where,
        ...(cursor ? { id: { lt: cursor } } : {}),
      },
      orderBy: {
        createdAt: 'desc',
      },
      ...(isPaginated ? { take: limit + 1 } : {}),
      ...(search && !isPaginated ? { take: 20 } : {}),
    })

    // Determine if there are more results
    let hasMore = false
    let communitiesToReturn = communities
    if (isPaginated && communities.length > limit) {
      hasMore = true
      communitiesToReturn = communities.slice(0, limit)
    }

    // Get nextCursor from the last community
    const nextCursor = isPaginated && communitiesToReturn.length > 0
      ? communitiesToReturn[communitiesToReturn.length - 1].id
      : null

    const parsedCommunities = communitiesToReturn.map((community) => ({
      ...community,
    }))

    if (isPaginated) {
      return NextResponse.json({ communities: parsedCommunities, nextCursor, hasMore })
    }

    return NextResponse.json({ communities: parsedCommunities })
  } catch (error) {
    console.error('Get communities error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/communities - create community { name, description?, image?, category?, authorId }
export async function POST(request: Request) {
  try {
    // Rate limit write operations
    const rateLimitResponse = withRateLimit(request, 'strict')
    if (rateLimitResponse) return rateLimitResponse

    const body = await request.json()
    const validation = validateBody(createCommunitySchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { name, description, image, category, authorId } = validation.data

    const community = await db.community.create({
      data: {
        name,
        description: description || undefined,
        image: image || undefined,
        category: category || undefined,
        members: 1,
      },
    })

    // Create a CommunityMember record for the creator as admin
    await db.communityMember.create({
      data: {
        userId: authorId,
        communityId: community.id,
        role: 'admin',
      },
    })

    return NextResponse.json({ community }, { status: 201 })
  } catch (error) {
    console.error('Create community error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/communities - update community { communityId|id, name?, description?, image?, category?, members?, joinCommunity?, leaveCommunity?, userId? }
export async function PUT(request: Request) {
  try {
    // Rate limit write operations
    const rateLimitResponse = withRateLimit(request, 'strict')
    if (rateLimitResponse) return rateLimitResponse

    const body = await request.json()
    const validation = validateBody(updateCommunitySchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // Accept both `communityId` and `id` (frontend sends `id`)
    const communityId = validation.data.communityId || validation.data.id
    const { name, description, image, category, members, isFeatured, requestingUserId, joinCommunity, leaveCommunity, userId } = validation.data

    if (!communityId) {
      return NextResponse.json(
        { error: 'Community ID is required' },
        { status: 400 }
      )
    }

    // Handle join community
    if (joinCommunity && userId) {
      const existing = await db.community.findUnique({ where: { id: communityId } })
      if (!existing) {
        return NextResponse.json(
          { error: 'Community not found' },
          { status: 404 }
        )
      }

      // Check if already a member
      const existingMember = await db.communityMember.findUnique({
        where: { userId_communityId: { userId, communityId } },
      })

      if (existingMember) {
        return NextResponse.json(
          { error: 'Already a member of this community' },
          { status: 409 }
        )
      }

      // Create membership and increment member count
      await db.communityMember.create({
        data: { userId, communityId, role: 'member' },
      })

      const community = await db.community.update({
        where: { id: communityId },
        data: { members: { increment: 1 } },
      })

      return NextResponse.json({ community: { ...community } })
    }

    // Handle leave community
    if (leaveCommunity && userId) {
      const existingMember = await db.communityMember.findUnique({
        where: { userId_communityId: { userId, communityId } },
      })

      if (!existingMember) {
        return NextResponse.json(
          { error: 'Not a member of this community' },
          { status: 404 }
        )
      }

      // Don't allow the community admin (creator) to leave
      if (existingMember.role === 'admin') {
        return NextResponse.json(
          { error: 'Community admin cannot leave. Transfer ownership or delete the community.' },
          { status: 400 }
        )
      }

      // Delete membership and decrement member count
      await db.communityMember.delete({
        where: { userId_communityId: { userId, communityId } },
      })

      const community = await db.community.update({
        where: { id: communityId },
        data: { members: { decrement: 1 } },
      })

      return NextResponse.json({ community: { ...community } })
    }

    // Admin-only: setting isFeatured requires admin privileges
    if (isFeatured !== undefined) {
      if (!requestingUserId) {
        return NextResponse.json(
          { error: 'Requesting user ID is required for featuring communities' },
          { status: 401 }
        )
      }
      const isAdmin = await verifyAdmin(requestingUserId)
      if (!isAdmin) {
        return NextResponse.json(
          { error: 'Forbidden: admin access required' },
          { status: 403 }
        )
      }
    }

    const existing = await db.community.findUnique({ where: { id: communityId } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Community not found' },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (image !== undefined) updateData.image = image
    if (category !== undefined) updateData.category = category
    if (members !== undefined) updateData.members = members

    const community = await db.community.update({
      where: { id: communityId },
      data: updateData,
    })

    return NextResponse.json({ community: { ...community } })
  } catch (error) {
    console.error('Update community error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/communities - delete community and related data { communityId }
export async function DELETE(request: Request) {
  try {
    // Rate limit write operations
    const rateLimitResponse = withRateLimit(request, 'strict')
    if (rateLimitResponse) return rateLimitResponse

    const body = await request.json()
    const validation = validateBody(deleteCommunitySchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    const { communityId, requestingUserId } = validation.data

    const isAdmin = await verifyAdmin(requestingUserId)
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: admin access required' },
        { status: 403 }
      )
    }

    const existing = await db.community.findUnique({ where: { id: communityId } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Community not found' },
        { status: 404 }
      )
    }

    // Delete related data first
    await db.sharedPost.deleteMany({ where: { communityId } })
    await db.communityMember.deleteMany({ where: { communityId } })
    await db.community.delete({ where: { id: communityId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete community error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
