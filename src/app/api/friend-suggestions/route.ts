import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { withRateLimit } from '@/lib/api-utils'
import { generateFriendSuggestions } from '@/lib/friend-suggestions'

/**
 * GET /api/friend-suggestions
 * 
 * Returns personalized friend suggestions based on:
 * - Mutual friends (primary signal)
 * - Shared interests
 * - Activity overlap
 * 
 * Query params:
 * - userId: The user to get suggestions for
 * - limit: Max number of suggestions (default: 10)
 */
export async function GET(request: Request) {
  try {
    // Rate limit
    const rateLimitResponse = withRateLimit(request, 'default')
    if (rateLimitResponse) return rateLimitResponse

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const limit = Math.min(20, parseInt(searchParams.get('limit') || '10', 10))

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    // Get user's friends
    const userFriends = await db.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    })
    const userFriendIds = new Set(userFriends.map(f => f.followingId))

    // Get all users except self and existing friends
    const potentialFriends = await db.user.findMany({
      where: {
        id: {
          not: userId,
          notIn: Array.from(userFriendIds),
        },
      },
      select: {
        id: true,
        username: true,
        name: true,
        avatar: true,
      },
      take: 100, // Limit to 100 potential candidates
    })

    if (potentialFriends.length === 0) {
      return NextResponse.json({ suggestions: [] })
    }

    // Get friends for each potential friend
    const potentialFriendIds = potentialFriends.map(p => p.id)
    const theirFriends = await db.follow.findMany({
      where: {
        followerId: { in: potentialFriendIds },
      },
      select: {
        followerId: true,
        followingId: true,
      },
    })

    // Build friend sets for each potential friend
    const friendSets = new Map<string, Set<string>>()
    theirFriends.forEach(f => {
      if (!friendSets.has(f.followerId)) {
        friendSets.set(f.followerId, new Set())
      }
      friendSets.get(f.followerId)!.add(f.followingId)
    })

    // Get mutual friends details
    const allMutualFriendIds = new Set<string>()
    userFriendIds.forEach(fid => {
      potentialFriendIds.forEach(pid => {
        const theirFriendSet = friendSets.get(pid) || new Set()
        if (theirFriendSet.has(fid)) {
          allMutualFriendIds.add(fid)
        }
      })
    })

    const mutualFriendsData = await db.user.findMany({
      where: { id: { in: Array.from(allMutualFriendIds) } },
      select: {
        id: true,
        username: true,
        name: true,
        avatar: true,
      },
    })

    const mutualFriendsMap = new Map<string, typeof mutualFriendsData>()
    potentialFriendIds.forEach(pid => {
      const theirFriendSet = friendSets.get(pid) || new Set()
      const mutuals = mutualFriendsData.filter(m => theirFriendSet.has(m.id))
      mutualFriendsMap.set(pid, mutuals)
    })

    // Build user data for algorithm
    const userWithFriends = {
      id: userId,
      username: '',
      name: '',
      avatar: null,
      friendIds: userFriendIds,
    }

    const potentialsWithFriends = potentialFriends.map(p => ({
      id: p.id,
      username: p.username,
      name: p.name,
      avatar: p.avatar,
      friendIds: friendSets.get(p.id) || new Set(),
    }))

    // Generate suggestions
    const suggestions = generateFriendSuggestions(
      userId,
      userWithFriends,
      potentialsWithFriends,
      mutualFriendsMap
    )

    // Limit results
    const limitedSuggestions = suggestions.slice(0, limit)

    return NextResponse.json({
      suggestions: limitedSuggestions,
      total: suggestions.length,
    })
  } catch (error) {
    console.error('Friend suggestions error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
