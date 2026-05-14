import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import type { CommunityType } from '@/lib/store'

interface CommunitiesResponse {
  communities: CommunityType[]
  nextCursor: string | null
  hasMore: boolean
}

interface CommunityDetailResponse {
  community: CommunityType
}

export function useCommunities(category?: string, search?: string) {
  return useInfiniteQuery<CommunitiesResponse>({
    queryKey: ['communities', category, search],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({ limit: '20' })
      if (category) params.set('category', category)
      if (search) params.set('search', search)
      if (pageParam) params.set('cursor', pageParam as string)
      const res = await fetch(`/api/communities?${params}`)
      if (!res.ok) throw new Error('Failed to fetch communities')
      return res.json()
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
  })
}

export function useCommunity(id: string | null | undefined) {
  return useQuery<CommunityDetailResponse>({
    queryKey: ['community', id],
    queryFn: async () => {
      const res = await fetch(`/api/communities?id=${id}`)
      if (!res.ok) throw new Error('Failed to fetch community')
      return res.json()
    },
    enabled: !!id,
  })
}
