import { NextResponse, NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { authenticateUser } from '@/lib/auth-middleware'

/**
 * GET /api/users/search?query=xxx
 * Search users by username or name for tagging purposes
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const auth = await authenticateUser(request)
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ users: [] })
    }

    // Search for users by username or name
    const users = await db.user.findMany({
      where: {
        OR: [
          {
            username: {
              contains: query.trim(),
              mode: 'insensitive',
            },
          },
          {
            name: {
              contains: query.trim(),
              mode: 'insensitive',
            },
          },
        ],
        // Exclude the current user
        id: {
          not: auth.userId,
        },
      },
      select: {
        id: true,
        username: true,
        name: true,
        avatar: true,
        bio: true,
      },
      take: 10, // Limit results
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error('User search error:', error)
    return NextResponse.json(
      { error: 'Failed to search users' },
      { status: 500 }
    )
  }
}
