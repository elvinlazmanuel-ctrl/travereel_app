import type { StateCreator } from 'zustand'
import type { AppStore } from './index'

export interface SocialSlice {
  followingIds: string[]
  friendIds: string[]
  pendingFriendRequestCount: number
  blockedIds: string[]
  mutedIds: string[]
  toggleFollow: (id: string) => void
  setFollowingIds: (ids: string[]) => void
  setFriendIds: (ids: string[]) => void
  addFriendId: (id: string) => void
  removeFriendId: (id: string) => void
  setPendingFriendRequestCount: (count: number) => void
  setBlockedIds: (ids: string[]) => void
  addBlockedId: (id: string) => void
  removeBlockedId: (id: string) => void
  toggleBlock: (userId: string) => void
  setMutedIds: (ids: string[]) => void
  addMutedId: (id: string) => void
  removeMutedId: (id: string) => void
  toggleMute: (userId: string) => void
}

export const createSocialSlice: StateCreator<AppStore, [], [], SocialSlice> = (set, get) => ({
  followingIds: [],
  friendIds: [],
  pendingFriendRequestCount: 0,
  blockedIds: [],
  mutedIds: [],

  setFollowingIds: (ids) => set({ followingIds: ids }),
  toggleFollow: (id) => set((state) => {
    const isFollowing = state.followingIds.includes(id)
    return {
      followingIds: isFollowing
        ? state.followingIds.filter((fid) => fid !== id)
        : [...state.followingIds, id],
    }
  }),

  setFriendIds: (ids) => set({ friendIds: ids }),
  addFriendId: (id) => set((state) => {
    if (state.friendIds.includes(id)) return state
    return { friendIds: [...state.friendIds, id] }
  }),
  removeFriendId: (id) => set((state) => ({
    friendIds: state.friendIds.filter((fid) => fid !== id),
  })),
  setPendingFriendRequestCount: (count) => set({ pendingFriendRequestCount: count }),

  setBlockedIds: (ids) => set({ blockedIds: ids }),
  addBlockedId: (id) => set((state) => {
    if (state.blockedIds.includes(id)) return state
    return { blockedIds: [...state.blockedIds, id] }
  }),
  removeBlockedId: (id) => set((state) => ({
    blockedIds: state.blockedIds.filter((bid) => bid !== id),
  })),
  toggleBlock: (userId) => {
    const state = get()
    const currentUser = state.currentUser
    if (!currentUser) return

    const isBlocked = state.blockedIds.includes(userId)

    if (isBlocked) {
      // Unblock
      fetch(`/api/blocks?userId=${currentUser.id}&blockedId=${userId}&type=block`, {
        method: 'DELETE',
      }).then((res) => {
        if (res.ok) {
          get().removeBlockedId(userId)
        }
      }).catch(() => {
        // Revert on error
        get().addBlockedId(userId)
      })
      set((s) => ({ blockedIds: s.blockedIds.filter((bid) => bid !== userId) }))
    } else {
      // Block
      set((s) => ({ blockedIds: [...s.blockedIds, userId] }))
      fetch('/api/blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockerId: currentUser.id, blockedId: userId, type: 'block' }),
      }).then((res) => {
        if (res.ok) {
          // Also remove from following if currently following
          if (get().followingIds.includes(userId)) {
            get().toggleFollow(userId)
          }
        } else {
          // Revert on error
          get().removeBlockedId(userId)
        }
      }).catch(() => {
        // Revert on error
        get().removeBlockedId(userId)
      })
    }
  },

  setMutedIds: (ids) => set({ mutedIds: ids }),
  addMutedId: (id) => set((state) => {
    if (state.mutedIds.includes(id)) return state
    return { mutedIds: [...state.mutedIds, id] }
  }),
  removeMutedId: (id) => set((state) => ({
    mutedIds: state.mutedIds.filter((mid) => mid !== id),
  })),
  toggleMute: (userId) => {
    const state = get()
    const currentUser = state.currentUser
    if (!currentUser) return

    const isMuted = state.mutedIds.includes(userId)

    if (isMuted) {
      // Unmute
      fetch(`/api/blocks?userId=${currentUser.id}&blockedId=${userId}&type=mute`, {
        method: 'DELETE',
      }).then((res) => {
        if (res.ok) {
          get().removeMutedId(userId)
        }
      }).catch(() => {
        // Revert on error
        get().addMutedId(userId)
      })
      set((s) => ({ mutedIds: s.mutedIds.filter((mid) => mid !== userId) }))
    } else {
      // Mute
      set((s) => ({ mutedIds: [...s.mutedIds, userId] }))
      fetch('/api/blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockerId: currentUser.id, blockedId: userId, type: 'mute' }),
      }).then((res) => {
        if (!res.ok) {
          // Revert on error
          get().removeMutedId(userId)
        }
      }).catch(() => {
        // Revert on error
        get().removeMutedId(userId)
      })
    }
  },
})
