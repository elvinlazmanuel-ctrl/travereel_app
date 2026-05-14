import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

// Get WebSocket URL from environment or use default
const getWebSocketUrl = () => {
  // For production, use your deployed chat service URL
  // For development, use localhost
  if (process.env.NEXT_PUBLIC_WS_URL) {
    return process.env.NEXT_PUBLIC_WS_URL
  }
  
  // Check if we're in production
  if (typeof window !== 'undefined') {
    const host = window.location.hostname
    if (host.includes('vercel.app')) {
      // Point to your deployed mini-service
      // You'll need to deploy the chat-service separately
      return `https://${host}`
    }
  }
  
  return 'http://localhost:3003'
}

export function getSocket(): Socket {
  if (!socket) {
    socket = io(getWebSocketUrl(), {
      transports: ['websocket', 'polling'],
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    })
  }
  return socket
}

export function connectSocket(userId: string): Socket {
  const s = getSocket()
  if (!s.connected) {
    s.connect()
    s.emit('authenticate', { userId })
  }
  return s
}

export function disconnectSocket(): void {
  if (socket?.connected) {
    socket.disconnect()
  }
}
