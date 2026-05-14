import type { StateCreator } from 'zustand'
import type { Post } from './types'
import type { AppStore } from './index'

export interface PostsSlice {
  posts: Post[]
  likedPostIds: string[]
  bookmarks: string[]
  comments: import('./types').CommentType[]
  setPosts: (posts: Post[]) => void
  addPost: (post: Post) => void
  toggleLike: (postId: string) => void
  toggleLikeWithAPI: (postId: string, userId: string) => void
  deletePost: (postId: string) => void
  removePost: (postId: string) => void
  updatePost: (postId: string, data: Partial<Post>) => void
  setLikedPostIds: (ids: string[]) => void
  setBookmarks: (ids: string[]) => void
  toggleBookmark: (postId: string) => void
  setComments: (comments: import('./types').CommentType[]) => void
  addComment: (comment: import('./types').CommentType) => void
}

export const createPostsSlice: StateCreator<AppStore, [], [], PostsSlice> = (set, get) => ({
  posts: [],
  likedPostIds: [],
  bookmarks: [],
  comments: [],

  setPosts: (posts) => set({ posts }),
  addPost: (post) => set((state) => ({ posts: [post, ...state.posts] })),

  toggleLike: (postId) => set((state) => ({
    posts: state.posts.map(p =>
      p.id === postId
        ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 }
        : p
    ),
    likedPostIds: state.likedPostIds.includes(postId)
      ? state.likedPostIds.filter((id) => id !== postId)
      : [...state.likedPostIds, postId],
  })),

  toggleLikeWithAPI: (postId, userId) => {
    const state = get()
    const isLiked = state.likedPostIds.includes(postId)

    // Optimistic update
    set((state) => ({
      posts: state.posts.map(p =>
        p.id === postId
          ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? (p.likes ?? 0) - 1 : (p.likes ?? 0) + 1 }
          : p
      ),
      likedPostIds: isLiked
        ? state.likedPostIds.filter((id) => id !== postId)
        : [...state.likedPostIds, postId],
    }))

    // API call
    if (isLiked) {
      fetch(`/api/likes?userId=${userId}&postId=${postId}`, { method: 'DELETE' }).catch(() => {
        // Revert on error
        set((state) => ({
          posts: state.posts.map(p =>
            p.id === postId
              ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? (p.likes ?? 0) - 1 : (p.likes ?? 0) + 1 }
              : p
          ),
          likedPostIds: [...state.likedPostIds, postId],
        }))
      })
    } else {
      fetch('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, postId }),
      }).catch(() => {
        // Revert on error
        set((state) => ({
          posts: state.posts.map(p =>
            p.id === postId
              ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? (p.likes ?? 0) - 1 : (p.likes ?? 0) + 1 }
              : p
          ),
          likedPostIds: state.likedPostIds.filter((id) => id !== postId),
        }))
      })
    }
  },

  removePost: (postId) => set((state) => ({
    posts: state.posts.filter((p) => p.id !== postId),
  })),
  deletePost: (postId) => set((state) => ({
    posts: state.posts.filter((p) => p.id !== postId),
    bookmarks: state.bookmarks.filter((id) => id !== postId),
    likedPostIds: state.likedPostIds.filter((id) => id !== postId),
  })),
  updatePost: (postId, data) => set((state) => ({
    posts: state.posts.map((p) =>
      p.id === postId ? { ...p, ...data } : p
    ),
  })),

  setLikedPostIds: (ids) => set({ likedPostIds: ids }),
  setBookmarks: (ids) => set({ bookmarks: ids }),
  toggleBookmark: (postId) => set((state) => {
    const isBookmarked = state.bookmarks.includes(postId)
    return {
      bookmarks: isBookmarked
        ? state.bookmarks.filter((id) => id !== postId)
        : [...state.bookmarks, postId],
      posts: state.posts.map(p =>
        p.id === postId ? { ...p, isBookmarked: !p.isBookmarked } : p
      ),
    }
  }),

  setComments: (comments) => set({ comments }),
  addComment: (comment) => set((state) => ({ comments: [...state.comments, comment] })),
})
