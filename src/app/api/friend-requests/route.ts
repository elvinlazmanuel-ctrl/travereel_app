import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { withRateLimit } from '@/lib/api-utils'
import { validateBody, validateQuery, sendFriendRequestSchema, handleFriendRequestSchema, unfriendSchema, userIdSchema } from '@/lib/validation'

const USER_SELECT = {
  id: true,
  username: true,
  name: true,
  avatar: true,
  bio: true,
  isPrivate: true,
} as const

export async function GET(request: Request) {
  try {
    // Rate limit GET requests
    const rateLimitResponse = withRateLimit(request, 'default')
    if (rateLimitResponse) return rateLimitResponse

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const type = searchParams.get('type') // "pending" | "sent" | "friends"

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

    // Always compute pendingCount for the user
    const pendingCount = await db.friendRequest.count({
      where: {
        receiverId: userId,
        status: 'pending',
      },
    })

    if (type === 'pending') {
      // Received pending requests — include sender info
      const requests = await db.friendRequest.findMany({
        where: {
          receiverId: userId,
          status: 'pending',
        },
        include: {
          sender: { select: USER_SELECT },
        },
        orderBy: { createdAt: 'desc' },
      })

      return NextResponse.json({ requests, pendingCount })
    }

    if (type === 'sent') {
      // Sent pending requests — include receiver info
      const requests = await db.friendRequest.findMany({
        where: {
          senderId: userId,
          status: 'pending',
        },
        include: {
          receiver: { select: USER_SELECT },
        },
        orderBy: { createdAt: 'desc' },
      })

      return NextResponse.json({ requests, pendingCount })
    }

    if (type === 'friends') {
      // Accepted friends — include the other user's info
      const sent = await db.friendRequest.findMany({
        where: {
          senderId: userId,
          status: 'accepted',
        },
        include: {
          receiver: { select: USER_SELECT },
        },
        orderBy: { createdAt: 'desc' },
      })

      const received = await db.friendRequest.findMany({
        where: {
          receiverId: userId,
          status: 'accepted',
        },
        include: {
          sender: { select: USER_SELECT },
        },
        orderBy: { createdAt: 'desc' },
      })

      // Map to a uniform shape: each item has the request info + the "other" user
      const friends = [
        ...sent.map((r) => ({ ...r, friend: r.receiver })),
        ...received.map((r) => ({ ...r, friend: r.sender })),
      ]

      return NextResponse.json({ friends, pendingCount })
    }

    // Default: return all categories
    const [pending, sent, friendsSent, friendsReceived] = await Promise.all([
      db.friendRequest.findMany({
        where: { receiverId: userId, status: 'pending' },
        include: { sender: { select: USER_SELECT } },
        orderBy: { createdAt: 'desc' },
      }),
      db.friendRequest.findMany({
        where: { senderId: userId, status: 'pending' },
        include: { receiver: { select: USER_SELECT } },
        orderBy: { createdAt: 'desc' },
      }),
      db.friendRequest.findMany({
        where: { senderId: userId, status: 'accepted' },
        include: { receiver: { select: USER_SELECT } },
        orderBy: { createdAt: 'desc' },
      }),
      db.friendRequest.findMany({
        where: { receiverId: userId, status: 'accepted' },
        include: { sender: { select: USER_SELECT } },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    const friends = [
      ...friendsSent.map((r) => ({ ...r, friend: r.receiver })),
      ...friendsReceived.map((r) => ({ ...r, friend: r.sender })),
    ]

    return NextResponse.json({ pending, sent, friends, pendingCount })
  } catch (error) {
    console.error('Get friend requests error:', error)
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
    const validation = validateBody(sendFriendRequestSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    const { senderId, receiverId } = validation.data

    if (senderId === receiverId) {
      return NextResponse.json(
        { error: 'Cannot send a friend request to yourself' },
        { status: 400 }
      )
    }

    // Validate both users exist
    const [sender, receiver] = await Promise.all([
      db.user.findUnique({ where: { id: senderId } }),
      db.user.findUnique({ where: { id: receiverId } }),
    ])

    if (!sender) {
      return NextResponse.json(
        { error: 'Sender not found' },
        { status: 404 }
      )
    }

    if (!receiver) {
      return NextResponse.json(
        { error: 'Receiver not found' },
        { status: 404 }
      )
    }

    // Check for existing request in either direction
    const existingRequest = await db.friendRequest.findFirst({
      where: {
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
      },
    })

    if (existingRequest) {
      if (existingRequest.status === 'accepted') {
        return NextResponse.json(
          { error: 'Already friends' },
          { status: 409 }
        )
      }

      if (existingRequest.status === 'pending') {
        // If the pending request is from the receiver to the sender, auto-accept it
        if (existingRequest.senderId === receiverId && existingRequest.receiverId === senderId) {
          const updated = await db.friendRequest.update({
            where: { id: existingRequest.id },
            data: { status: 'accepted' },
          })

          // Create mutual follows
          await Promise.all([
            db.follow.upsert({
              where: {
                followerId_followingId: {
                  followerId: senderId,
                  followingId: receiverId,
                },
              },
              update: {},
              create: { followerId: senderId, followingId: receiverId },
            }),
            db.follow.upsert({
              where: {
                followerId_followingId: {
                  followerId: receiverId,
                  followingId: senderId,
                },
              },
              update: {},
              create: { followerId: receiverId, followingId: senderId },
            }),
          ])

          // Notify the original sender that their request was accepted
          await db.notification.create({
            data: {
              userId: receiverId,
              type: 'friend_request_accepted',
              message: `${sender.name || sender.username} accepted your friend request`,
              fromUserId: senderId,
            },
          })

          return NextResponse.json(
            { request: updated, autoAccepted: true },
            { status: 200 }
          )
        }

        // A pending request already exists in this direction or the other
        return NextResponse.json(
          { error: 'Friend request already pending' },
          { status: 409 }
        )
      }

      if (existingRequest.status === 'rejected') {
        // If previously rejected, allow re-sending by deleting the old one
        await db.friendRequest.delete({
          where: { id: existingRequest.id },
        })
      }
    }

    // Create the friend request
    const friendRequest = await db.friendRequest.create({
      data: {
        senderId,
        receiverId,
        status: 'pending',
      },
      include: {
        sender: { select: USER_SELECT },
        receiver: { select: USER_SELECT },
      },
    })

    // Create notification for the receiver
    await db.notification.create({
      data: {
        userId: receiverId,
        type: 'friend_request',
        message: `${sender.name || sender.username} sent you a friend request`,
        fromUserId: senderId,
      },
    })

    return NextResponse.json({ request: friendRequest }, { status: 201 })
  } catch (error) {
    console.error('Create friend request error:', error)
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
    const validation = validateBody(handleFriendRequestSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    const { requestId, action, userId } = validation.data

    // Find the friend request
    const friendRequest = await db.friendRequest.findUnique({
      where: { id: requestId },
      include: {
        sender: { select: USER_SELECT },
        receiver: { select: USER_SELECT },
      },
    })

    if (!friendRequest) {
      return NextResponse.json(
        { error: 'Friend request not found' },
        { status: 404 }
      )
    }

    // Verify the userId is the receiver
    if (friendRequest.receiverId !== userId) {
      return NextResponse.json(
        { error: 'Only the receiver can accept or reject a friend request' },
        { status: 403 }
      )
    }

    if (friendRequest.status !== 'pending') {
      return NextResponse.json(
        { error: `Friend request is already ${friendRequest.status}` },
        { status: 400 }
      )
    }

    if (action === 'accept') {
      const updated = await db.friendRequest.update({
        where: { id: requestId },
        data: { status: 'accepted' },
        include: {
          sender: { select: USER_SELECT },
          receiver: { select: USER_SELECT },
        },
      })

      // Create mutual follows (both directions)
      await Promise.all([
        db.follow.upsert({
          where: {
            followerId_followingId: {
              followerId: friendRequest.senderId,
              followingId: friendRequest.receiverId,
            },
          },
          update: {},
          create: {
            followerId: friendRequest.senderId,
            followingId: friendRequest.receiverId,
          },
        }),
        db.follow.upsert({
          where: {
            followerId_followingId: {
              followerId: friendRequest.receiverId,
              followingId: friendRequest.senderId,
            },
          },
          update: {},
          create: {
            followerId: friendRequest.receiverId,
            followingId: friendRequest.senderId,
          },
        }),
      ])

      // Notify the sender that their request was accepted
      const receiver = friendRequest.receiver
      await db.notification.create({
        data: {
          userId: friendRequest.senderId,
          type: 'friend_request_accepted',
          message: `${receiver.name || receiver.username} accepted your friend request`,
          fromUserId: userId,
        },
      })

      return NextResponse.json({ request: updated })
    }

    // action === 'reject'
    const updated = await db.friendRequest.update({
      where: { id: requestId },
      data: { status: 'rejected' },
      include: {
        sender: { select: USER_SELECT },
        receiver: { select: USER_SELECT },
      },
    })

    return NextResponse.json({ request: updated })
  } catch (error) {
    console.error('Update friend request error:', error)
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

    // Check if this is an unfriend request (JSON body with userId + friendId)
    // vs a cancel-friend-request (query params with requestId + userId)
    const contentType = request.headers.get('content-type') || ''
    let body: { userId?: string; friendId?: string } = {}

    if (contentType.includes('application/json')) {
      try {
        body = await request.json()
      } catch {
        body = {}
      }
    }

    const { userId: bodyUserId, friendId } = body

    // Unfriend flow: body contains userId and friendId
    if (bodyUserId && friendId) {
      const validation = validateBody(unfriendSchema, { userId: bodyUserId, friendId })
      if (!validation.success) {
        return NextResponse.json(
          { error: validation.error },
          { status: 400 }
        )
      }

      if (bodyUserId === friendId) {
        return NextResponse.json(
          { error: 'Cannot unfriend yourself' },
          { status: 400 }
        )
      }

      // Find the accepted friend request between these two users (in either direction)
      const friendRequest = await db.friendRequest.findFirst({
        where: {
          status: 'accepted',
          OR: [
            { senderId: bodyUserId, receiverId: friendId },
            { senderId: friendId, receiverId: bodyUserId },
          ],
        },
      })

      if (!friendRequest) {
        return NextResponse.json(
          { error: 'Friendship not found' },
          { status: 404 }
        )
      }

      // Delete the friend request record
      await db.friendRequest.delete({
        where: { id: friendRequest.id },
      })

      // Remove mutual follows (both directions)
      await db.follow.deleteMany({
        where: {
          OR: [
            { followerId: bodyUserId, followingId: friendId },
            { followerId: friendId, followingId: bodyUserId },
          ],
        },
      })

      return NextResponse.json({ success: true })
    }

    // Cancel friend request flow: query params with requestId + userId
    const { searchParams } = new URL(request.url)
    const requestId = searchParams.get('requestId')
    const userId = searchParams.get('userId')

    if (!requestId || !userId) {
      return NextResponse.json(
        { error: 'Request ID and user ID are required' },
        { status: 400 }
      )
    }

    // Find the friend request
    const friendRequest = await db.friendRequest.findUnique({
      where: { id: requestId },
    })

    if (!friendRequest) {
      return NextResponse.json(
        { error: 'Friend request not found' },
        { status: 404 }
      )
    }

    // Verify userId is the sender
    if (friendRequest.senderId !== userId) {
      return NextResponse.json(
        { error: 'Only the sender can cancel a friend request' },
        { status: 403 }
      )
    }

    await db.friendRequest.delete({
      where: { id: requestId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete friend request error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
