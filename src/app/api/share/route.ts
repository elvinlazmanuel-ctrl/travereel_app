import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { withRateLimit } from '@/lib/api-utils'
import { validateBody, validateQuery, sharePostSchema, communityIdSchema, userIdSchema } from '@/lib/validation'

export async function GET(request: Request) {
  try {
    // Rate limit GET requests
    const rateLimitResponse = withRateLimit(request, 'default')
    if (rateLimitResponse) return rateLimitResponse

    const { searchParams } = new URL(request.url)
    const communityId = searchParams.get('communityId')
    const userId = searchParams.get('userId')

    if (communityId) {
      const validation = validateQuery(communityIdSchema, communityId)
      if (!validation.success) {
        return NextResponse.json({ error: validation.error }, { status: 400 })
      }
    }

    if (userId) {
      const validation = validateQuery(userIdSchema, userId)
      if (!validation.success) {
        return NextResponse.json({ error: validation.error }, { status: 400 })
      }
    }

    const where: Record<string, unknown> = {}
    if (communityId) where.communityId = communityId
    if (userId) where.userId = userId

    const sharedPosts = await db.sharedPost.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
        community: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
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

    const parsedSharedPosts = sharedPosts.map((sp) => ({
      ...sp,
      post: sp.post
        ? {
            ...sp.post,
            images: JSON.parse(sp.post.images),
            tags: sp.post.tags ? JSON.parse(sp.post.tags) : [],
          }
        : null,
    }))

    return NextResponse.json({ sharedPosts: parsedSharedPosts })
  } catch (error) {
    console.error('Get shared posts error:', error)
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
    const validation = validateBody(sharePostSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    const { postId, userId, communityId, caption } = validation.data

    // Verify post exists
    const post = await db.post.findUnique({ where: { id: postId } })
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
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

    const sharedPost = await db.sharedPost.create({
      data: {
        postId,
        userId,
        communityId,
        caption: caption || null,
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
        community: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        post: {
          select: {
            id: true,
            caption: true,
            images: true,
          },
        },
      },
    })

    return NextResponse.json({ sharedPost }, { status: 201 })
  } catch (error) {
    console.error('Share post error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
