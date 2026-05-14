import type { StateCreator } from 'zustand'
import type { ViewType } from './types'
import type { AppStore } from './index'

export interface NavSlice {
  currentView: ViewType
  previousView: ViewType | null
  setCurrentView: (view: ViewType) => void
}

export const createNavSlice: StateCreator<AppStore, [], [], NavSlice> = (set) => ({
  currentView: 'auth',
  previousView: null,

  setCurrentView: (view) => set((state) => ({
    currentView: view,
    previousView: state.currentView,
    showCreateMenu: false,
  })),
})
