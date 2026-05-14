import { useInfiniteQuery } from '@tanstack/react-query'
import type { ChatRoomType, MessageType } from '@/lib/store'

interface MessagesResponse {
  chatRoom: ChatRoomType & { messages: MessageType[] }
  nextCursor: string | null
  hasMore: boolean
}

export function useMessages(userId1: string | null, userId2: string | null) {
  return useInfiniteQuery<MessagesResponse>({
    queryKey: ['messages', userId1, userId2],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({
        userId1: userId1!,
        userId2: userId2!,
        limit: '20',
      })
      if (pageParam) params.set('cursor', pageParam as string)
      const res = await fetch(`/api/chat-rooms?${params}`)
      if (!res.ok) throw new Error('Failed to fetch messages')
      return res.json()
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
    enabled: !!userId1 && !!userId2,
  })
}
