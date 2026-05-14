import type { StateCreator } from 'zustand'
import type { CommunityType } from './types'
import type { AppStore } from './index'

export interface CommunitySlice {
  communities: CommunityType[]
  selectedCommunity: CommunityType | null
  joinedCommunityIds: string[]
  setCommunities: (communities: CommunityType[]) => void
  setSelectedCommunity: (community: CommunityType | null) => void
  setJoinedCommunityIds: (ids: string[]) => void
  joinCommunity: (id: string) => void
  leaveCommunity: (id: string) => void
  addCommunity: (community: CommunityType) => void
}

export const createCommunitySlice: StateCreator<AppStore, [], [], CommunitySlice> = (set) => ({
  communities: [],
  selectedCommunity: null,
  joinedCommunityIds: [],

  setCommunities: (communities) => set({ communities }),
  setSelectedCommunity: (community) => set({ selectedCommunity: community }),
  setJoinedCommunityIds: (ids) => set({ joinedCommunityIds: ids }),
  joinCommunity: (id) => set((state) => {
    if (state.joinedCommunityIds.includes(id)) return state
    return { joinedCommunityIds: [...state.joinedCommunityIds, id] }
  }),
  leaveCommunity: (id) => set((state) => ({
    joinedCommunityIds: state.joinedCommunityIds.filter((cid) => cid !== id),
  })),
  addCommunity: (community) => set((state) => ({
    communities: [community, ...state.communities],
  })),
})
