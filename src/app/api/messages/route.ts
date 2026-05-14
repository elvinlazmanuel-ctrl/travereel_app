import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { withRateLimit } from '@/lib/api-utils'
import { validateBody, validateQuery, sendMessageSchema, userIdSchema } from '@/lib/validation'

export async function GET(request: Request) {
  try {
    // Rate limit GET requests
    const rateLimitResponse = withRateLimit(request, 'default')
    if (rateLimitResponse) return rateLimitResponse

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const validation = validateQuery(userIdSchema, userId)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const chatRoomMembers = await db.chatRoomMember.findMany({
      where: { userId },
      include: {
        chatRoom: {
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
              take: 1,
              orderBy: { createdAt: 'desc' },
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
        },
      },
      orderBy: { joinedAt: 'desc' },
    })

    const chatRooms = chatRoomMembers.map((crm) => ({
      id: crm.chatRoom.id,
      name: crm.chatRoom.name,
      isGroup: crm.chatRoom.isGroup,
      createdAt: crm.chatRoom.createdAt,
      members: crm.chatRoom.members.map((m) => ({
        id: m.id,
        userId: m.userId,
        joinedAt: m.joinedAt,
        user: m.user,
      })),
      lastMessage: crm.chatRoom.messages[0] || null,
    }))

    return NextResponse.json({ chatRooms })
  } catch (error) {
    console.error('Get messages/chat-rooms error:', error)
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
    const validation = validateBody(sendMessageSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    const { content, senderId, chatRoomId } = validation.data

    const message = await db.message.create({
      data: {
        content,
        senderId,
        chatRoomId,
      },
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
    })

    return NextResponse.json({ message }, { status: 201 })
  } catch (error) {
    console.error('Send message error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
