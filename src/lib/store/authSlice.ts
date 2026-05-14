import type { StateCreator } from 'zustand'
import type { User, MessageType } from './types'
import type { AppStore } from './index'

export interface AuthSlice {
  currentUser: User | null
  token: string | null
  isAuthenticated: boolean
  isSocketConnected: boolean
  onlineUserIds: string[]
  viewingUser: User | null
  login: (user: User, token?: string) => void
  logout: () => void
  updateCurrentUser: (data: Partial<User>) => void
  setViewingUser: (user: User | null) => void
  setIsSocketConnected: (value: boolean) => void
  setOnlineUserIds: (ids: string[]) => void
  addOnlineUser: (id: string) => void
  removeOnlineUser: (id: string) => void
  updateChatRoomLastMessage: (chatRoomId: string, message: MessageType) => void
}

export const createAuthSlice: StateCreator<AppStore, [], [], AuthSlice> = (set, get) => ({
  currentUser: null,
  token: null,
  isAuthenticated: false,
  isSocketConnected: false,
  onlineUserIds: [],
  viewingUser: null,

  login: (user, token) => {
    // Store token in localStorage for persistence
    if (token) {
      localStorage.setItem('auth_token', token)
    }
    set({ currentUser: user, token: token || null, isAuthenticated: true, currentView: 'feed', hasUnreadNotifications: true, hasUnreadMessages: true })
    // Connect socket on login
    import('@/lib/socket').then(({ connectSocket }) => {
      const socket = connectSocket(user.id)
      socket.on('connect', () => {
        get().setIsSocketConnected(true)
      })
      socket.on('disconnect', () => {
        get().setIsSocketConnected(false)
      })
      socket.on('user-online', (data: { userId: string }) => {
        get().addOnlineUser(data.userId)
      })
      socket.on('user-offline', (data: { userId: string }) => {
        get().removeOnlineUser(data.userId)
      })
      socket.on('new-message', (data: MessageType) => {
        // Only add if we're not the sender (sender already adds optimistically)
        const state = get()
        if (data.senderId !== state.currentUser?.id) {
          state.addMessage(data)
        }
        // Update chat room last message
        state.updateChatRoomLastMessage(data.chatRoomId, data)
      })
    })
  },

  logout: () => {
    // Disconnect socket on logout
    import('@/lib/socket').then(({ disconnectSocket }) => {
      disconnectSocket()
    })
    // Clear token from localStorage
    localStorage.removeItem('auth_token')
    set({ currentUser: null, token: null, isAuthenticated: false, currentView: 'auth', isSocketConnected: false, onlineUserIds: [] })
  },

  updateCurrentUser: (data) => set((state) => ({
    currentUser: state.currentUser ? { ...state.currentUser, ...data } : null,
  })),

  setViewingUser: (user) => set({ viewingUser: user }),

  setIsSocketConnected: (value) => set({ isSocketConnected: value }),
  setOnlineUserIds: (ids) => set({ onlineUserIds: ids }),
  addOnlineUser: (id) => set((state) => {
    if (state.onlineUserIds.includes(id)) return state
    return { onlineUserIds: [...state.onlineUserIds, id] }
  }),
  removeOnlineUser: (id) => set((state) => ({
    onlineUserIds: state.onlineUserIds.filter((uid) => uid !== id),
  })),
  updateChatRoomLastMessage: (chatRoomId, message) => set((state) => ({
    chatRooms: state.chatRooms.map((room) =>
      room.id === chatRoomId
        ? { ...room, lastMessage: message }
        : room
    ),
  })),
})
