import { useQuery } from '@tanstack/react-query'
import type { User } from '@/lib/store'

interface UserResponse {
  user: User & {
    followersCount?: number
    followingCount?: number
    postsCount?: number
  }
}

export function useUser(userId: string | null | undefined) {
  return useQuery<UserResponse>({
    queryKey: ['user', userId],
    queryFn: async () => {
      const res = await fetch(`/api/users?id=${userId}`)
      if (!res.ok) throw new Error('Failed to fetch user')
      return res.json()
    },
    enabled: !!userId,
  })
}
