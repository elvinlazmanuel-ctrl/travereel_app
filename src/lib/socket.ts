import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    socket = io('/?XTransformPort=3003', {
      transports: ['websocket'],
      autoConnect: false,
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
