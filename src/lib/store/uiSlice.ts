import type { StateCreator } from 'zustand'
import type { AppStore } from './index'

export interface UISlice {
  isLoading: boolean
  showCreateMenu: boolean
  setIsLoading: (value: boolean) => void
  setShowCreateMenu: (value: boolean) => void
}

export const createUISlice: StateCreator<AppStore, [], [], UISlice> = (set) => ({
  isLoading: false,
  showCreateMenu: false,

  setIsLoading: (value) => set({ isLoading: value }),
  setShowCreateMenu: (value) => set({ showCreateMenu: value }),
})
