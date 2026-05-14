import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { withRateLimit } from '@/lib/api-utils'

export async function GET(request: Request) {
  try {
    // Rate limit GET requests
    const rateLimitResponse = withRateLimit(request, 'default')
    if (rateLimitResponse) return rateLimitResponse

    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.trim()
    const currentUserId = searchParams.get('currentUserId')?.trim() || null

    // Handle empty query - return empty array
    if (!q) {
      return NextResponse.json({ users: [] })
    }

    // Build the where clause - search across username and name fields
    // SQLite is case-insensitive by default for ASCII, so no mode parameter needed
    const whereClause: Record<string, unknown> = {
      OR: [
        { username: { contains: q } },
        { name: { contains: q } },
      ],
    }

    // Exclude current user from results
    if (currentUserId) {
      whereClause.id = { not: currentUserId }
    }

    // Search for users
    const users = await db.user.findMany({
      where: whereClause,
      select: {
        id: true,
        username: true,
        name: true,
        avatar: true,
        bio: true,
        isPrivate: true,
      },
      take: 20,
    })

    // If no currentUserId, return users without friendship status
    if (!currentUserId) {
      return NextResponse.json({ users })
    }

    // Enrich results with friendship status for each user
    const enrichedUsers = await Promise.all(
      users.map(async (user) => {
        // Check for friend request between current user and this user
        const friendRequest = await db.friendRequest.findFirst({
          where: {
            OR: [
              { senderId: currentUserId, receiverId: user.id },
              { senderId: user.id, receiverId: currentUserId },
            ],
          },
          select: {
            senderId: true,
            status: true,
          },
        })

        // Determine friend request status
        let friendRequestStatus: string | null = null
        if (friendRequest) {
          switch (friendRequest.status) {
            case 'pending':
              friendRequestStatus =
                friendRequest.senderId === currentUserId
                  ? 'pending_sent'
                  : 'pending_received'
              break
            case 'accepted':
              friendRequestStatus = 'accepted'
              break
            case 'rejected':
              friendRequestStatus = 'rejected'
              break
          }
        }

        // Check if current user follows this user
        const followRecord = await db.follow.findFirst({
          where: {
            followerId: currentUserId,
            followingId: user.id,
          },
          select: {
            id: true,
          },
        })

        return {
          ...user,
          friendRequestStatus,
          isFollowing: !!followRecord,
        }
      })
    )

    return NextResponse.json({ users: enrichedUsers })
  } catch (error) {
    console.error('Search users error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
