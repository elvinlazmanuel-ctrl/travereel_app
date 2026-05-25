import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { withRateLimit } from '@/lib/api-utils'
import { validateBody, validateQuery, createChatRoomSchema, getOrCreateChatRoomSchema, updateChatRoomSchema } from '@/lib/validation'

export async function GET(request: Request) {
  try {
    // Rate limit GET requests
    const rateLimitResponse = withRateLimit(request, 'default')
    if (rateLimitResponse) return rateLimitResponse

    const { searchParams } = new URL(request.url)
    const userId1 = searchParams.get('userId1')
    const userId2 = searchParams.get('userId2')

    if (!userId1 || !userId2) {
      return NextResponse.json(
        { error: 'Both user IDs are required' },
        { status: 400 }
      )
    }

    const validation = validateQuery(getOrCreateChatRoomSchema, { userId1, userId2 })
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Cursor-based pagination for messages
    const cursorParam = searchParams.get('cursor')
    const limitParam = searchParams.get('limit')
    const limit = Math.max(1, Math.min(50, parseInt(limitParam || '20', 10)))
    const cursor = cursorParam || undefined

    // Find existing non-group chat room with both users
    const user1Rooms = await db.chatRoomMember.findMany({
      where: { userId: userId1 },
      select: { chatRoomId: true },
    })

    const user2Rooms = await db.chatRoomMember.findMany({
      where: { userId: userId2 },
      select: { chatRoomId: true },
    })

    const user1RoomIds = user1Rooms.map((r) => r.chatRoomId)
    const user2RoomIds = user2Rooms.map((r) => r.chatRoomId)

    const commonRoomIds = user1RoomIds.filter((id) =>
      user2RoomIds.includes(id)
    )

    let chatRoom: {
      id: string
      isGroup: boolean
      name: string | null
      members: Array<{ userId: string; user: { id: string; username: string; name: string; avatar: string | null } }>
      messages: Array<{ id: string; content: string; createdAt: Date; senderId: string; chatRoomId: string; sender: { id: string; username: string; name: string; avatar: string | null } }>
    } | null = null

    if (commonRoomIds.length > 0) {
      // Find a non-group room among common rooms
      const existingRoom = await db.chatRoom.findFirst({
        where: {
          id: { in: commonRoomIds },
          isGroup: false,
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  name: true,
                  avatar: true,
                },
              },
            },
          },
          messages: {
            where: cursor ? { id: { gt: cursor } } : {},
            orderBy: { createdAt: 'asc' },
            take: limit + 1,
            include: {
              sender: {
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
      })

      chatRoom = existingRoom
    }

    // If no existing room, create one
    if (!chatRoom) {
      chatRoom = await db.chatRoom.create({
        data: {
          isGroup: false,
          members: {
            create: [
              { userId: userId1 },
              { userId: userId2 },
            ],
          },
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  name: true,
                  avatar: true,
                },
              },
            },
          },
          messages: {
            orderBy: { createdAt: 'asc' },
            include: {
              sender: {
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
      })
    }

    // Add pagination metadata to response
    let hasMore = false
    let nextCursor: string | null = null
    if (chatRoom && chatRoom.messages && chatRoom.messages.length > limit) {
      hasMore = true
      chatRoom.messages = chatRoom.messages.slice(0, limit)
    }
    if (chatRoom && chatRoom.messages && chatRoom.messages.length > 0) {
      // Messages are ordered ASC (oldest first), so the last one is the newest
      nextCursor = chatRoom.messages[chatRoom.messages.length - 1].id
    }

    return NextResponse.json({ chatRoom, nextCursor, hasMore })
  } catch (error) {
    console.error('Get/create chat room error:', error)
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
    const validation = validateBody(createChatRoomSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    const { name, memberIds } = validation.data

    const chatRoom = await db.chatRoom.create({
      data: {
        name,
        isGroup: true,
        members: {
          create: memberIds.map((userId) => ({ userId })),
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: {
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
    })

    return NextResponse.json({ chatRoom }, { status: 201 })
  } catch (error) {
    console.error('Create group chat error:', error)
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
    const validation = validateBody(updateChatRoomSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    const { chatRoomId, userId } = validation.data

    // Update lastReadAt for the user in the chat room
    await db.chatRoomMember.updateMany({
      where: {
        chatRoomId,
        userId,
      },
      data: {
        lastReadAt: new Date(),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update lastReadAt error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
