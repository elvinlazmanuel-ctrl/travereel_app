import type { StateCreator } from 'zustand'
import type { NotificationType } from './types'
import type { AppStore } from './index'

export interface NotificationSlice {
  notifications: NotificationType[]
  hasUnreadNotifications: boolean
  hasUnreadMessages: boolean
  setNotifications: (notifications: NotificationType[]) => void
  setHasUnreadNotifications: (value: boolean) => void
  setHasUnreadMessages: (value: boolean) => void
}

export const createNotificationSlice: StateCreator<AppStore, [], [], NotificationSlice> = (set) => ({
  notifications: [],
  hasUnreadNotifications: true,
  hasUnreadMessages: true,

  setNotifications: (notifications) => set({ notifications }),
  setHasUnreadNotifications: (value) => set({ hasUnreadNotifications: value }),
  setHasUnreadMessages: (value) => set({ hasUnreadMessages: value }),
})
