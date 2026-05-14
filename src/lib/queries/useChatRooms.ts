import { useQuery } from '@tanstack/react-query'
import type { ChatRoomType } from '@/lib/store'

interface ChatRoomsResponse {
  chatRooms: ChatRoomType[]
}

export function useChatRooms(userId: string | null | undefined) {
  return useQuery<ChatRoomsResponse>({
    queryKey: ['chatRooms', userId],
    queryFn: async () => {
      const res = await fetch(`/api/messages?userId=${userId}`)
      if (!res.ok) throw new Error('Failed to fetch chat rooms')
      return res.json()
    },
    enabled: !!userId,
    refetchInterval: 10000, // Refresh every 10s as a fallback
  })
}
