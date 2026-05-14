import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { withRateLimit } from '@/lib/api-utils'
import { validateBody, validateQuery, createCommentSchema, deleteCommentSchema, postIdSchema, userIdSchema } from '@/lib/validation'

export async function GET(request: Request) {
  try {
    // Rate limit GET requests
    const rateLimitResponse = withRateLimit(request, 'default')
    if (rateLimitResponse) return rateLimitResponse

    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('postId')
    const blockedIdsParam = searchParams.get('blockedIds') || ''

    if (!postId) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 })
    }

    const validation = validateQuery(postIdSchema, postId)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const blockedIds = blockedIdsParam
      ? blockedIdsParam.split(',').filter(Boolean)
      : []

    const where: Record<string, unknown> = { postId }
    if (blockedIds.length > 0) {
      where.authorId = { notIn: blockedIds }
    }

    // Cursor-based pagination
    const cursorParam = searchParams.get('cursor')
    const limitParam = searchParams.get('limit')
    const limit = Math.max(1, Math.min(50, parseInt(limitParam || '20', 10)))
    const cursor = cursorParam || undefined

    const comments = await db.comment.findMany({
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
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
    })

    // Determine if there are more results
    let hasMore = false
    let commentsToReturn = comments
    if (comments.length > limit) {
      hasMore = true
      commentsToReturn = comments.slice(0, limit)
    }

    // Get nextCursor from the last comment
    const nextCursor = commentsToReturn.length > 0
      ? commentsToReturn[commentsToReturn.length - 1].id
      : null

    return NextResponse.json({ comments: commentsToReturn, nextCursor, hasMore })
  } catch (error) {
    console.error('Get comments error:', error)
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
    const validation = validateBody(createCommentSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { content, authorId, postId, parentId } = validation.data

    // If parentId is provided, verify it belongs to the same post
    if (parentId) {
      const parentComment = await db.comment.findUnique({
        where: { id: parentId },
      })
      if (!parentComment || parentComment.postId !== postId) {
        return NextResponse.json({ error: 'Invalid parent comment' }, { status: 400 })
      }
    }

    const comment = await db.comment.create({
      data: { content, authorId, postId, parentId: parentId || null },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
      },
    })

    // Create notification for post author
    const post = await db.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    })

    if (post && post.authorId !== authorId) {
      const user = await db.user.findUnique({
        where: { id: authorId },
        select: { username: true },
      })

      await db.notification.create({
        data: {
          userId: post.authorId,
          type: 'comment',
          message: `${user?.username || 'Someone'} commented on your post`,
          fromUserId: authorId,
          postId,
        },
      })
    }

    return NextResponse.json({ comment }, { status: 201 })
  } catch (error) {
    console.error('Create comment error:', error)
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
    const commentId = searchParams.get('commentId')
    const userId = searchParams.get('userId')

    if (!commentId || !userId) {
      return NextResponse.json(
        { error: 'Comment ID and User ID are required' },
        { status: 400 }
      )
    }

    const validation = validateQuery(deleteCommentSchema, { commentId, userId })
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Verify the user owns the comment
    const comment = await db.comment.findUnique({
      where: { id: commentId },
      select: { authorId: true },
    })

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    if (comment.authorId !== userId) {
      return NextResponse.json(
        { error: 'Not authorized to delete this comment' },
        { status: 403 }
      )
    }

    // Delete replies first
    await db.comment.deleteMany({ where: { parentId: commentId } })
    await db.comment.delete({ where: { id: commentId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete comment error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
