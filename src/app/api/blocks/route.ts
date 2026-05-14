import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const blocks = await db.block.findMany({
      where: { blockerId: userId },
      include: {
        blocked: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ blocks })
  } catch (error) {
    console.error('Get blocks error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { blockerId, blockedId, type } = body

    if (!blockerId || !blockedId) {
      return NextResponse.json({ error: 'blockerId and blockedId are required' }, { status: 400 })
    }

    if (blockerId === blockedId) {
      return NextResponse.json({ error: 'Cannot block yourself' }, { status: 400 })
    }

    const blockType = type === 'mute' ? 'mute' : 'block'

    // Check if already blocked/muted
    const existing = await db.block.findUnique({
      where: {
        blockerId_blockedId_type: {
          blockerId,
          blockedId,
          type: blockType,
        },
      },
    })

    if (existing) {
      return NextResponse.json({ error: `User already ${blockType}ed`, block: existing }, { status: 409 })
    }

    // If blocking, remove follow relationships and friend requests
    if (blockType === 'block') {
      // Remove follow relationships (both directions)
      await db.follow.deleteMany({
        where: {
          OR: [
            { followerId: blockerId, followingId: blockedId },
            { followerId: blockedId, followingId: blockerId },
          ],
        },
      })

      // Remove friend requests (both directions)
      await db.friendRequest.deleteMany({
        where: {
          OR: [
            { senderId: blockerId, receiverId: blockedId },
            { senderId: blockedId, receiverId: blockerId },
          ],
        },
      })
    }

    const block = await db.block.create({
      data: {
        blockerId,
        blockedId,
        type: blockType,
      },
      include: {
        blocked: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
      },
    })

    return NextResponse.json({ block }, { status: 201 })
  } catch (error) {
    console.error('Create block error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const blockedId = searchParams.get('blockedId')
    const type = searchParams.get('type') || 'block'

    if (!userId || !blockedId) {
      return NextResponse.json({ error: 'userId and blockedId are required' }, { status: 400 })
    }

    const blockType = type === 'mute' ? 'mute' : 'block'

    await db.block.deleteMany({
      where: {
        blockerId: userId,
        blockedId,
        type: blockType,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete block error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
