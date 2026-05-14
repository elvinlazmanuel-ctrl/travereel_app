import { useQuery } from '@tanstack/react-query'
import type { Post, CommunityType, SearchUserType } from '@/lib/store'

interface SearchResponse {
  users: SearchUserType[]
  usersNextCursor: string | null
  usersHasMore: boolean
  posts: Post[]
  postsNextCursor: string | null
  postsHasMore: boolean
  communities: CommunityType[]
  communitiesNextCursor: string | null
  communitiesHasMore: boolean
}

export function useSearch(query: string, currentUserId: string = '') {
  return useQuery<SearchResponse>({
    queryKey: ['search', query, currentUserId],
    queryFn: async () => {
      const params = new URLSearchParams({ q: query })
      if (currentUserId) params.set('currentUserId', currentUserId)
      const res = await fetch(`/api/search?${params}`)
      if (!res.ok) throw new Error('Search failed')
      return res.json()
    },
    enabled: query.length > 0,
    staleTime: 10 * 1000, // 10 seconds for search results
  })
}
