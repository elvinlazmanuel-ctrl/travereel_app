import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null
let connectionAttempted = false

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
      // Vercel doesn't support WebSockets - chat service needs separate deployment
      // Return null to indicate WebSocket is unavailable
      console.warn('[Socket] WebSocket not available on Vercel. Chat service requires separate deployment (Railway, Render, etc.)')
      return null
    }
  }
  
  return 'http://localhost:3003'
}

export function getSocket(): Socket | null {
  // Return null if WebSocket is not available (e.g., Vercel deployment)
  const wsUrl = getWebSocketUrl()
  if (!wsUrl) {
    return null
  }

  if (!socket) {
    socket = io(wsUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 3,
      timeout: 5000, // Shorter timeout for faster failure detection
    })

    // Handle connection errors gracefully
    socket.on('connect_error', (error) => {
      console.warn('[Socket] Connection error:', error.message)
    })

    socket.on('connect_timeout', () => {
      console.warn('[Socket] Connection timeout - chat service may not be running')
    })
  }
  return socket
}

export function connectSocket(userId: string): Socket | null {
  const s = getSocket()
  if (!s) {
    // WebSocket not available (e.g., Vercel deployment without chat service)
    console.info('[Socket] WebSocket unavailable. Real-time chat disabled.')
    return null
  }

  if (!s.connected && !connectionAttempted) {
    connectionAttempted = true
    try {
      s.connect()
      s.emit('authenticate', { userId })
    } catch (error) {
      console.warn('[Socket] Failed to connect:', error)
      return null
    }
  }
  return s
}

export function disconnectSocket(): void {
  if (socket?.connected) {
    socket.disconnect()
  }
  socket = null
  connectionAttempted = false
}
