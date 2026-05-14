import type { StateCreator } from 'zustand'
import type { ChatRoomType, MessageType } from './types'
import type { AppStore } from './index'

export interface ChatSlice {
  chatRooms: ChatRoomType[]
  selectedChatRoom: ChatRoomType | null
  messages: MessageType[]
  setChatRooms: (rooms: ChatRoomType[]) => void
  setSelectedChatRoom: (room: ChatRoomType | null) => void
  setMessages: (messages: MessageType[]) => void
  addMessage: (message: MessageType) => void
}

export const createChatSlice: StateCreator<AppStore, [], [], ChatSlice> = (set) => ({
  chatRooms: [],
  selectedChatRoom: null,
  messages: [],

  setChatRooms: (rooms) => set({ chatRooms: rooms }),
  setSelectedChatRoom: (room) => set({ selectedChatRoom: room }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
})
