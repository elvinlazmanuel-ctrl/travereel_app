import { useInfiniteQuery } from '@tanstack/react-query'
import type { Post } from '@/lib/store'

interface PostsResponse {
  posts: Post[]
  nextCursor: string | null
  hasMore: boolean
}

export function usePosts(userId: string, blockedIds: string[] = []) {
  return useInfiniteQuery<PostsResponse>({
    queryKey: ['posts', userId, blockedIds],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({ limit: '20' })
      if (userId) params.set('userId', userId)
      if (pageParam) params.set('cursor', pageParam as string)
      if (blockedIds.length) params.set('blockedIds', blockedIds.join(','))
      const res = await fetch(`/api/posts?${params}`)
      if (!res.ok) throw new Error('Failed to fetch posts')
      return res.json()
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
    enabled: !!userId,
  })
}
