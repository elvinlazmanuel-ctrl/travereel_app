import { useQuery } from '@tanstack/react-query'
import type { FriendRequestType } from '@/lib/store'

interface FriendsResponse {
  friends: FriendRequestType[]
  pending: FriendRequestType[]
  sent: FriendRequestType[]
  pendingCount: number
}

export function useFriends(userId: string | null | undefined, type?: 'pending' | 'sent' | 'friends') {
  return useQuery<FriendsResponse>({
    queryKey: ['friends', userId, type],
    queryFn: async () => {
      const params = new URLSearchParams({ userId: userId! })
      if (type) params.set('type', type)
      const res = await fetch(`/api/friend-requests?${params}`)
      if (!res.ok) throw new Error('Failed to fetch friends')
      return res.json()
    },
    enabled: !!userId,
    staleTime: 15 * 1000, // 15 seconds
  })
}
