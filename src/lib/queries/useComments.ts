import { useInfiniteQuery } from '@tanstack/react-query'
import type { CommentType } from '@/lib/store'

interface CommentsResponse {
  comments: CommentType[]
  nextCursor: string | null
  hasMore: boolean
}

export function useComments(postId: string | null, blockedIds: string[] = []) {
  return useInfiniteQuery<CommentsResponse>({
    queryKey: ['comments', postId, blockedIds],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({ postId: postId!, limit: '20' })
      if (pageParam) params.set('cursor', pageParam as string)
      if (blockedIds.length) params.set('blockedIds', blockedIds.join(','))
      const res = await fetch(`/api/comments?${params}`)
      if (!res.ok) throw new Error('Failed to fetch comments')
      return res.json()
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
    enabled: !!postId,
  })
}
