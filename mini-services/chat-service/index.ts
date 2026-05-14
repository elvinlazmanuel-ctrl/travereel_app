import { Server } from 'socket.io'

const PORT = process.env.PORT || 3003
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:3000',
  'http://localhost:3001',
]

const io = new Server(PORT, {
  path: '/',
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
})

// Track online users: socketId -> userId
const onlineUsers = new Map<string, string>()
// Track user rooms: userId -> Set of chatRoomIds
const userRooms = new Map<string, Set<string>>()

io.on('connection', (socket) => {
  console.log(`[Chat] User connected: ${socket.id}`)

  // User authenticates with their userId
  socket.on('authenticate', (data: { userId: string }) => {
    onlineUsers.set(socket.id, data.userId)
    console.log(`[Chat] User ${data.userId} authenticated`)

    // Notify others this user is online
    socket.broadcast.emit('user-online', { userId: data.userId })
  })

  // Join a chat room
  socket.on('join-room', (data: { chatRoomId: string; userId: string }) => {
    socket.join(data.chatRoomId)
    if (!userRooms.has(data.userId)) {
      userRooms.set(data.userId, new Set())
    }
    userRooms.get(data.userId)!.add(data.chatRoomId)
    console.log(`[Chat] User ${data.userId} joined room ${data.chatRoomId}`)
  })

  // Leave a chat room
  socket.on('leave-room', (data: { chatRoomId: string; userId: string }) => {
    socket.leave(data.chatRoomId)
    userRooms.get(data.userId)?.delete(data.chatRoomId)
  })

  // Send a message
  socket.on('send-message', (data: {
    id: string
    content: string
    senderId: string
    chatRoomId: string
    createdAt: string
    sender: { id: string; username: string; name: string; avatar: string | null }
  }) => {
    // Broadcast to everyone in the room (including sender for consistency)
    io.to(data.chatRoomId).emit('new-message', data)
    console.log(`[Chat] Message in room ${data.chatRoomId} from ${data.senderId}`)
  })

  // Typing indicator
  socket.on('typing', (data: { chatRoomId: string; userId: string; username: string }) => {
    socket.to(data.chatRoomId).emit('user-typing', data)
  })

  // Stop typing
  socket.on('stop-typing', (data: { chatRoomId: string; userId: string }) => {
    socket.to(data.chatRoomId).emit('user-stop-typing', data)
  })

  // Handle disconnect
  socket.on('disconnect', () => {
    const userId = onlineUsers.get(socket.id)
    if (userId) {
      onlineUsers.delete(socket.id)
      socket.broadcast.emit('user-offline', { userId })
      console.log(`[Chat] User ${userId} disconnected`)
    }
  })
})

console.log(`[Chat] Socket.io server running on port ${PORT}`)
