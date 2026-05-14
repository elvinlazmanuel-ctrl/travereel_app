import { db } from '@/lib/db'
import { verifyAdmin } from '@/lib/auth-utils'
import { NextResponse } from 'next/server'
import { withRateLimit } from '@/lib/api-utils'
import { validateBody, validateQuery, createPostSchema, updatePostSchema, userIdSchema } from '@/lib/validation'

export async function GET(request: Request) {
  try {
    // Rate limit GET requests
    const rateLimitResponse = withRateLimit(request, 'default')
    if (rateLimitResponse) return rateLimitResponse

    const { searchParams } = new URL(request.url)
    const authorId = searchParams.get('authorId')
    const search = searchParams.get('search') || ''
    const userId = searchParams.get('userId') || ''
    const blockedIdsParam = searchParams.get('blockedIds') || ''

    // Validate authorId if provided
    if (authorId) {
      const validation = validateQuery(userIdSchema, authorId)
      if (!validation.success) {
        return NextResponse.json({ error: validation.error }, { status: 400 })
      }
    }

    // Cursor-based pagination parameters
    const cursorParam = searchParams.get('cursor')
    const limitParam = searchParams.get('limit')
    const isPaginated = cursorParam !== null || limitParam !== null
    const cursor = cursorParam || undefined
    const limit = Math.max(1, Math.min(50, parseInt(limitParam || '20', 10)))

    const where: Record<string, unknown> = {}
    if (authorId) where.authorId = authorId

    // Filter out posts from blocked users
    const blockedIds = blockedIdsParam
      ? blockedIdsParam.split(',').filter(Boolean)
      : []
    if (blockedIds.length > 0 && !authorId) {
      where.authorId = { notIn: blockedIds }
    } else if (blockedIds.length > 0 && authorId && blockedIds.includes(authorId)) {
      // If viewing a specific blocked user's posts, return empty
      return NextResponse.json({ posts: [] })
    }

    // Private account gating: when fetching posts by a specific author,
    // check if the author has isPrivate: true and the requesting user doesn't follow them
    if (authorId && userId && authorId !== userId) {
      const author = await db.user.findUnique({
        where: { id: authorId },
        select: { isPrivate: true },
      })
      if (author?.isPrivate) {
        const follow = await db.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: userId,
              followingId: authorId,
            },
          },
        })
        if (!follow) {
          return NextResponse.json({ posts: [] })
        }
      }
    }

    // Search by caption, location, or tags
    if (search) {
      where.OR = [
        { caption: { contains: search } },
        { location: { contains: search } },
        { tags: { contains: search } },
      ]
    }

    // Search-only limit: 20 results max
    const searchTake = search && !isPaginated ? { take: 20 } : {}

    const posts = await db.post.findMany({
      where: {
        ...where,
        ...(cursor ? { id: { lt: cursor } } : {}),
      },
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
      orderBy: {
        createdAt: 'desc',
      },
      ...(isPaginated ? { take: limit + 1 } : {}),
      ...searchTake,
    })

    // Determine if there are more results
    let hasMore = false
    let postsToReturn = posts
    if (isPaginated && posts.length > limit) {
      hasMore = true
      postsToReturn = posts.slice(0, limit)
    }

    // Get nextCursor from the last post
    const nextCursor = isPaginated && postsToReturn.length > 0
      ? postsToReturn[postsToReturn.length - 1].id
      : null

    // Get report counts for returned posts
    const postIds = postsToReturn.map((p) => p.id)
    const allReports = await db.postReport.findMany({
      where: { postId: { in: postIds } },
      select: { postId: true },
    })
    const reportCounts: Record<string, number> = {}
    for (const r of allReports) {
      reportCounts[r.postId] = (reportCounts[r.postId] || 0) + 1
    }

    const postsWithParsedFields = postsToReturn.map((post) => ({
      ...post,
      images: JSON.parse(post.images),
      tags: post.tags ? JSON.parse(post.tags) : [],
      reportCount: reportCounts[post.id] || 0,
    }))

    if (isPaginated) {
      return NextResponse.json({
        posts: postsWithParsedFields,
        nextCursor,
        hasMore,
      })
    }

    return NextResponse.json({ posts: postsWithParsedFields })
  } catch (error) {
    console.error('Get posts error:', error)
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
    const validation = validateBody(createPostSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { caption, images, isPublic, location, latitude, longitude, tags, authorId, itineraryId } = validation.data

    // Images are optional - text-only posts are allowed
    const imageArray = Array.isArray(images) ? images : []

    const post = await db.post.create({
      data: {
        caption: caption || null,
        images: JSON.stringify(imageArray),
        isPublic: isPublic !== undefined ? isPublic : true,
        location: location || null,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        tags: tags ? JSON.stringify(tags) : null,
        authorId,
        itineraryId: itineraryId || null,
      },
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
    })

    const postWithParsedFields = {
      ...post,
      images: JSON.parse(post.images),
      tags: post.tags ? JSON.parse(post.tags) : [],
    }

    return NextResponse.json({ post: postWithParsedFields }, { status: 201 })
  } catch (error) {
    console.error('Create post error:', error)
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
    const validation = validateBody(updatePostSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { id, postId, isFlagged, caption, isPublic, location, latitude, longitude, tags, requestingUserId, userId } = validation.data

    // Support both `id` and `postId` for backwards compatibility
    const targetPostId = postId || id

    if (!targetPostId) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 })
    }

    // Admin-only: setting isFlagged requires admin privileges
    if (isFlagged !== undefined) {
      if (!requestingUserId) {
        return NextResponse.json({ error: 'Requesting user ID is required for flagging posts' }, { status: 401 })
      }
      const isAdmin = await verifyAdmin(requestingUserId)
      if (!isAdmin) {
        return NextResponse.json({ error: 'Forbidden: admin access required' }, { status: 403 })
      }
    }

    // Author verification for caption/location/tags edits
    const editableFields = [caption, location, tags].some((f) => f !== undefined)
    if (userId && editableFields) {
      const existingPost = await db.post.findUnique({
        where: { id: targetPostId },
        select: { authorId: true },
      })
      if (!existingPost) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 })
      }
      if (existingPost.authorId !== userId) {
        return NextResponse.json({ error: 'Forbidden: you can only edit your own posts' }, { status: 403 })
      }
    }

    const data: Record<string, unknown> = {}
    if (isFlagged !== undefined) data.isFlagged = isFlagged
    if (caption !== undefined) data.caption = caption
    if (isPublic !== undefined) data.isPublic = isPublic
    if (location !== undefined) data.location = location
    if (latitude !== undefined) data.latitude = latitude
    if (longitude !== undefined) data.longitude = longitude
    if (tags !== undefined) data.tags = JSON.stringify(tags)

    const post = await db.post.update({
      where: { id: targetPostId },
      data,
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
    })

    const postWithParsedFields = {
      ...post,
      images: JSON.parse(post.images),
      tags: post.tags ? JSON.parse(post.tags) : [],
    }

    return NextResponse.json({ post: postWithParsedFields })
  } catch (error) {
    console.error('Update post error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    // Rate limit write operations
    const rateLimitResponse = withRateLimit(request, 'strict')
    if (rateLimitResponse) return rateLimitResponse

    // Support both query params and body params
    const { searchParams } = new URL(request.url)
    const queryId = searchParams.get('id') || searchParams.get('postId')
    const queryUserId = searchParams.get('userId') || searchParams.get('requestingUserId')

    let targetPostId = queryId
    let userId = queryUserId

    // Also try to read from body for POST-style delete requests
    try {
      const body = await request.json()
      targetPostId = targetPostId || body.postId || body.id
      userId = userId || body.userId || body.requestingUserId
    } catch {
      // Body may be empty for query-param-only requests
    }

    if (!targetPostId) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 })
    }

    // Verify the user is the author of the post (or an admin)
    if (userId) {
      const existingPost = await db.post.findUnique({
        where: { id: targetPostId },
        select: { authorId: true },
      })
      if (!existingPost) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 })
      }

      const isAdmin = await verifyAdmin(userId)
      if (!isAdmin && existingPost.authorId !== userId) {
        return NextResponse.json({ error: 'Forbidden: you can only delete your own posts' }, { status: 403 })
      }
    }

    // Delete related records first
    await db.like.deleteMany({ where: { postId: targetPostId } })
    await db.bookmark.deleteMany({ where: { postId: targetPostId } })
    await db.comment.deleteMany({ where: { postId: targetPostId } })
    await db.sharedPost.deleteMany({ where: { postId: targetPostId } })
    await db.postReport.deleteMany({ where: { postId: targetPostId } })
    await db.post.delete({ where: { id: targetPostId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete post error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
