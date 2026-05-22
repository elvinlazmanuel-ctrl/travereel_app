import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { withRateLimit } from '@/lib/api-utils'
import { multiFieldSearch, rankSearchResults, SearchResult, tokenizeQuery } from '@/lib/search-utils'

export async function GET(request: Request) {
  try {
    // Rate limit GET requests
    const rateLimitResponse = withRateLimit(request, 'default')
    if (rateLimitResponse) return rateLimitResponse

    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''
    const currentUserId = searchParams.get('currentUserId') || ''
    const cursorParam = searchParams.get('cursor')
    const limitParam = searchParams.get('limit')
    const ranking = searchParams.get('ranking') || 'simple' // 'simple' or 'ranked'
    const limit = Math.max(1, Math.min(50, parseInt(limitParam || '20', 10)))
    const cursor = cursorParam || undefined

    if (!q) {
      return NextResponse.json({ users: [], posts: [], communities: [] })
    }

    // Search users, posts, and communities in parallel
    const [users, posts, communities] = await Promise.all([
      // Search users by username, name, or email
      db.user.findMany({
        where: {
          OR: [
            { username: { contains: q } },
            { name: { contains: q } },
            { email: { contains: q } },
          ],
          ...(currentUserId ? { id: { not: currentUserId } } : {}),
          ...(cursor ? { id: { lt: cursor } } : {}),
        },
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          avatar: true,
          bio: true,
          isPrivate: true,
          createdAt: true,
        },
        take: limit + 1,
        orderBy: { createdAt: 'desc' },
      }),

      // Search posts by caption, location, or tags
      db.post.findMany({
        where: {
          OR: [
            { caption: { contains: q } },
            { location: { contains: q } },
            { tags: { contains: q } },
          ],
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
        orderBy: { createdAt: 'desc' },
        take: limit + 1,
      }),

      // Search communities by name or description
      db.community.findMany({
        where: {
          OR: [
            { name: { contains: q } },
            { description: { contains: q } },
          ],
          ...(cursor ? { id: { lt: cursor } } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: limit + 1,
      }),
    ])

    // Determine hasMore and nextCursor for each result set
    const usersHasMore = users.length > limit
    const usersToReturn = usersHasMore ? users.slice(0, limit) : users
    const usersNextCursor = usersToReturn.length > 0 ? usersToReturn[usersToReturn.length - 1].id : null

    const postsHasMore = posts.length > limit
    const postsToReturn = postsHasMore ? posts.slice(0, limit) : posts
    const postsNextCursor = postsToReturn.length > 0 ? postsToReturn[postsToReturn.length - 1].id : null

    const communitiesHasMore = communities.length > limit
    const communitiesToReturn = communitiesHasMore ? communities.slice(0, limit) : communities
    const communitiesNextCursor = communitiesToReturn.length > 0 ? communitiesToReturn[communitiesToReturn.length - 1].id : null

    // Transform posts: flatten _count to likes/comments like NewsFeed does
    const transformedPosts = postsToReturn.map((post) => ({
      id: post.id,
      caption: post.caption,
      images: JSON.parse(post.images),
      isPublic: post.isPublic,
      isMemory: post.isMemory,
      isFlagged: post.isFlagged,
      location: post.location,
      tags: post.tags ? JSON.parse(post.tags) : [],
      authorId: post.authorId,
      author: post.author,
      createdAt: post.createdAt,
      likes: post._count.likes,
      comments: post._count.comments,
      relevanceScore: ranking === 'ranked' ? multiFieldSearch(q, {
        caption: post.caption,
        location: post.location,
        tags: post.tags,
      }, {
        caption: 1.5,
        location: 1.3,
        tags: 1.0,
      }) : 1.0,
    }))

    // Sort by relevance if ranking is enabled
    if (ranking === 'ranked') {
      transformedPosts.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
    }

    // Enrich users with friendRequestStatus and isFollowing
    let enrichedUsers = usersToReturn
    if (currentUserId) {
      // Get follow status
      const follows = await db.follow.findMany({
        where: {
          followerId: currentUserId,
          followingId: { in: usersToReturn.map((u) => u.id) },
        },
        select: { followingId: true },
      })
      const followingIds = new Set(follows.map((f) => f.followingId))

      // Get friend request status
      const friendRequests = await db.friendRequest.findMany({
        where: {
          OR: [
            {
              senderId: currentUserId,
              receiverId: { in: usersToReturn.map((u) => u.id) },
            },
            {
              receiverId: currentUserId,
              senderId: { in: usersToReturn.map((u) => u.id) },
            },
          ],
          status: { in: ['pending', 'accepted'] },
        },
        select: {
          senderId: true,
          receiverId: true,
          status: true,
        },
      })

      const friendRequestMap = new Map<string, string>()
      for (const fr of friendRequests) {
        const otherUserId =
          fr.senderId === currentUserId ? fr.receiverId : fr.senderId
        let status: string | null = null
        if (fr.status === 'accepted') {
          status = 'accepted'
        } else if (fr.senderId === currentUserId) {
          status = 'pending_sent'
        } else {
          status = 'pending_received'
        }
        friendRequestMap.set(otherUserId, status)
      }

      enrichedUsers = usersToReturn.map((user) => ({
        ...user,
        isFollowing: followingIds.has(user.id),
        friendRequestStatus: friendRequestMap.get(user.id) || null,
        relevanceScore: ranking === 'ranked' ? multiFieldSearch(q, {
          username: user.username,
          name: user.name,
          bio: user.bio,
        }, {
          username: 1.5, // Username matches are more important
          name: 1.2,
          bio: 0.8,
        }) : 1.0,
      }))
    }

    return NextResponse.json({
      users: enrichedUsers,
      usersNextCursor,
      usersHasMore,
      posts: transformedPosts,
      postsNextCursor,
      postsHasMore,
      communities: communitiesToReturn,
      communitiesNextCursor,
      communitiesHasMore,
    })
  } catch (error) {
    console.error('Unified search error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
