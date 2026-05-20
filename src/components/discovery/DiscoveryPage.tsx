'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Heart, MessageCircle, X, Users, MapPin, Calendar, Compass,
  UserPlus, Globe, ImageIcon, Loader2, TrendingUp, Crown
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useAppStore, type Post, type CommunityType } from '@/lib/store'
import { useSearch } from '@/lib/queries'
import { toast } from 'sonner'

const categories = ['All', 'Travel', 'Food', 'Adventure', 'Culture', 'Beach', 'Mountain', 'City']

const categoryTagMap: Record<string, string[]> = {
  All: [],
  Travel: ['travel', 'santorini', 'greece', 'bali', 'indonesia', 'tropical'],
  Food: ['food', 'coffee', 'morning', 'cuisine'],
  Adventure: ['adventure', 'hiking', 'mountains', 'dolomites'],
  Culture: ['culture', 'temples', 'history', 'siemreap', 'cambodia'],
  Beach: ['beach', 'tropical', 'bali', 'sunset'],
  Mountain: ['mountains', 'hiking', 'dolomites', 'adventure'],
  City: ['tokyo', 'japan', 'paris', 'france', 'streetphotography'],
}

interface DiscoveryUser {
  id: string
  username: string
  name: string
  avatar: string | null
  bio: string | null
  isPrivate: boolean
  isFollowing?: boolean
  friendRequestStatus?: 'pending_sent' | 'pending_received' | 'accepted' | null
}

interface DiscoveryItinerary {
  id: string
  title: string
  country: string
  location: string
  budget: number
  currency: string
  days: number
  travelType: string
  isPublic: boolean
  createdAt: string
  author: {
    id: string
    username: string
    name: string
    avatar: string | null
  }
}

interface SearchResultPost {
  id: string
  caption: string | null
  images: string[]
  isPublic: boolean
  location: string | null
  tags: string[]
  authorId: string
  author: {
    id: string
    username: string
    name: string
    avatar: string | null
  }
  createdAt: string
  likes: number
  comments: number
}

interface SearchResultCommunity {
  id: string
  name: string
  description: string | null
  image: string | null
  members: number
  category: string | null
  createdAt: string
}

export default function DiscoveryPage() {
  const {
    posts, setPosts, currentUser, toggleFollow, followingIds,
    setViewingUser, setCurrentView, setSelectedCommunity,
    friendIds, addFriendId, blockedIds,
  } = useAppStore()
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [activeTab, setActiveTab] = useState('trending')

  // Discovery data
  const [discoveryUsers, setDiscoveryUsers] = useState<DiscoveryUser[]>([])
  const [discoveryItineraries, setDiscoveryItineraries] = useState<DiscoveryItinerary[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [itinerariesLoading, setItinerariesLoading] = useState(false)

  // Global search with debounced query via React Query
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [searchActiveTab, setSearchActiveTab] = useState('users')

  // Debounce search input and update debouncedSearch
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!searchQuery.trim()) {
      setDebouncedSearch('')
      return
    }
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [searchQuery])

  // React Query search hook
  const { data: searchData, isLoading: isSearching } = useSearch(debouncedSearch, currentUser?.id || '')

  // Search results from React Query
  const searchUsers = (searchData?.users || []) as unknown as DiscoveryUser[]
  const searchPosts = (searchData?.posts || []) as unknown as SearchResultPost[]
  const searchCommunities = (searchData?.communities || []) as unknown as SearchResultCommunity[]
  const usersHasMore = searchData?.usersHasMore || false
  const postsHasMore = searchData?.postsHasMore || false
  const communitiesHasMore = searchData?.communitiesHasMore || false
  const usersCursor = searchData?.usersNextCursor || null
  const postsCursor = searchData?.postsNextCursor || null
  const communitiesCursor = searchData?.communitiesNextCursor || null
  const [isLoadingMoreSearch, setIsLoadingMoreSearch] = useState(false)

  const fetchPosts = useCallback(async () => {
    setIsLoading(true)
    try {
      const blockedIdsParam = blockedIds.length > 0 ? `?blockedIds=${blockedIds.join(',')}` : ''
      const res = await fetch(`/api/posts${blockedIdsParam}`)
      if (res.ok) {
        const data = await res.json()
        const mapped: Post[] = data.posts.map((p: Record<string, unknown>) => ({
          id: p.id,
          caption: p.caption || null,
          images: Array.isArray(p.images) ? p.images : [],
          isPublic: p.isPublic as boolean,
          isMemory: false,
          isFlagged: (p.isFlagged as boolean) || false,
          location: p.location || null,
          latitude: (p.latitude as number) || null,
          longitude: (p.longitude as number) || null,
          tags: Array.isArray(p.tags) ? p.tags : [],
          authorId: p.authorId as string,
          author: {
            id: (p.author as Record<string, unknown>)?.id as string,
            email: ((p.author as Record<string, unknown>)?.email as string) || '',
            username: (p.author as Record<string, unknown>)?.username as string,
            name: (p.author as Record<string, unknown>)?.name as string,
            avatar: ((p.author as Record<string, unknown>)?.avatar as string) || null,
            bio: null,
            isPrivate: false,
          },
          createdAt: p.createdAt as string,
          likes: (p._count as Record<string, number>)?.likes ?? 0,
          comments: (p._count as Record<string, number>)?.comments ?? 0,
          isLiked: false,
          reportCount: (p.reportCount as number) || 0,
        }))
        setPosts(mapped)
      }
    } catch (err) {
      console.error('Failed to fetch posts:', err)
    } finally {
      setIsLoading(false)
    }
  }, [setPosts])

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true)
    try {
      const res = await fetch('/api/users')
      if (res.ok) {
        const data = await res.json()
        setDiscoveryUsers(
          (data.users || [])
            .filter((u: DiscoveryUser) => u.id !== currentUser?.id)
            .slice(0, 20)
        )
      }
    } catch (err) {
      console.error('Failed to fetch users:', err)
    } finally {
      setUsersLoading(false)
    }
  }, [currentUser?.id])

  const fetchItineraries = useCallback(async () => {
    setItinerariesLoading(true)
    try {
      const res = await fetch('/api/itineraries?isPublic=true')
      if (res.ok) {
        const data = await res.json()
        setDiscoveryItineraries(data.itineraries || [])
      }
    } catch (err) {
      console.error('Failed to fetch itineraries:', err)
    } finally {
      setItinerariesLoading(false)
    }
  }, [])

  useEffect(() => {
    if (posts.length === 0) {
      fetchPosts()
    } else {
      setIsLoading(false)
    }
  }, [posts.length, fetchPosts])

  useEffect(() => {
    if (activeTab === 'people' && discoveryUsers.length === 0) {
      fetchUsers()
    }
  }, [activeTab, discoveryUsers.length, fetchUsers])

  useEffect(() => {
    if (activeTab === 'itineraries' && discoveryItineraries.length === 0) {
      fetchItineraries()
    }
  }, [activeTab, discoveryItineraries.length, fetchItineraries])

  // Load more for search (cursor-based per entity)
  const performSearch = useCallback(async (query: string, cursorParam?: string) => {
    if (!query.trim()) return
    setIsLoadingMoreSearch(true)
    try {
      const params = new URLSearchParams({ q: query, limit: '20' })
      if (currentUser?.id) params.set('currentUserId', currentUser.id)
      if (blockedIds.length > 0) params.set('blockedIds', blockedIds.join(','))
      if (cursorParam) params.set('cursor', cursorParam)
      const res = await fetch(`/api/search?${params}`)
      if (res.ok) {
        // For load-more, we just refetch from the server
        // React Query will handle the initial search
      }
    } catch (err) {
      console.error('Search load more failed:', err)
    } finally {
      setIsLoadingMoreSearch(false)
    }
  }, [currentUser?.id, blockedIds])

  // Filter posts based on category and search (for trending tab)
  const filteredPosts = posts.filter((post) => {
    const matchesCategory =
      selectedCategory === 'All' ||
      post.tags?.some((tag) =>
        categoryTagMap[selectedCategory]?.includes(tag.toLowerCase())
      ) ||
      post.caption?.toLowerCase().includes(selectedCategory.toLowerCase()) ||
      post.location?.toLowerCase().includes(selectedCategory.toLowerCase())

    const matchesSearch =
      !searchQuery ||
      post.caption?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

    return matchesCategory && matchesSearch
  })

  // Trending = sorted by (likes * 2 + comments * 3) descending
  const trendingPosts = [...filteredPosts].sort((a, b) => {
    const scoreA = a.likes * 2 + a.comments * 3
    const scoreB = b.likes * 2 + b.comments * 3
    return scoreB - scoreA
  })

  // Search across users (local filter for non-search mode)
  const filteredUsers = discoveryUsers.filter((user) => {
    if (!searchQuery) return true
    const s = searchQuery.toLowerCase()
    return (
      user.name.toLowerCase().includes(s) ||
      user.username.toLowerCase().includes(s) ||
      (user.bio || '').toLowerCase().includes(s)
    )
  })

  // Search across itineraries (local filter for non-search mode)
  const filteredItineraries = discoveryItineraries.filter((itinerary) => {
    if (!searchQuery) return true
    const s = searchQuery.toLowerCase()
    return (
      itinerary.title.toLowerCase().includes(s) ||
      itinerary.country.toLowerCase().includes(s) ||
      itinerary.location.toLowerCase().includes(s)
    )
  })

  // Determine which items should span 2 rows (every 5th and 9th item for Instagram-like layout)
  const isLargeItem = (index: number) => {
    return index % 9 === 2 || index % 9 === 5
  }

  const handleFollowUser = async (userId: string) => {
    if (!currentUser) return
    const isFollowing = followingIds.includes(userId)
    try {
      if (isFollowing) {
        await fetch(`/api/follows?followerId=${currentUser.id}&followingId=${userId}`, { method: 'DELETE' })
      } else {
        await fetch('/api/follows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ followerId: currentUser.id, followingId: userId }),
        })
      }
      toggleFollow(userId)
      toast.success(isFollowing ? 'Unfollowed' : 'Following!')
    } catch {
      toast.error('Failed to update follow')
    }
  }

  const handleSendFriendRequest = async (userId: string) => {
    if (!currentUser) return
    try {
      const res = await fetch('/api/friend-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId: currentUser.id, receiverId: userId }),
      })
      if (res.ok) {
        addFriendId(userId)
        toast.success('Friend request sent!')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to send friend request')
      }
    } catch {
      toast.error('Failed to send friend request')
    }
  }

  const handleViewUser = (user: DiscoveryUser | { id: string; username: string; name: string; avatar: string | null; bio: string | null; isPrivate: boolean }) => {
    setViewingUser({
      id: user.id,
      email: '',
      username: user.username,
      name: user.name,
      avatar: user.avatar,
      bio: user.bio || null,
      isPrivate: user.isPrivate,
    })
    setCurrentView('user-profile')
  }

  const handleViewCommunity = (community: SearchResultCommunity) => {
    const communityObj: CommunityType = {
      id: community.id,
      name: community.name,
      description: community.description,
      image: community.image,
      members: community.members,
      category: community.category,
    }
    setSelectedCommunity(communityObj)
    setCurrentView('community-detail')
  }

  const formatMembers = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
    return count.toString()
  }

  // Whether the search overlay should be shown
  const showSearchResults = searchQuery.trim().length > 0

  const totalSearchResults = searchUsers.length + searchPosts.length + searchCommunities.length

  return (
    <div className="max-w-md mx-auto">
      {/* Search Bar - Explorer Style */}
      <div className="px-4 pt-3 pb-2">
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-lg">🔍</div>
          <Input
            placeholder="Explore destinations, travelers, communities..."
            className="pl-10 h-11 glass border border-white/20 rounded-xl text-sm shadow-glass focus-visible:ring-2 focus-visible:ring-[#FF6B6B]/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted/50 transition-colors"
            >
              <X className="size-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Global Search Results Overlay */}
      <AnimatePresence>
        {showSearchResults && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="px-4 pb-4"
          >
            {/* Search results tabs */}
            <Tabs value={searchActiveTab} onValueChange={setSearchActiveTab}>
              <TabsList className="w-full bg-muted/80 rounded-xl h-10 p-1 mb-3">
                <TabsTrigger
                  value="users"
                  className="rounded-lg text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#2EC4B6] flex-1"
                >
                  <Users className="size-3.5 mr-1" />
                  Users
                  {searchUsers.length > 0 && (
                    <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                      {searchUsers.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="posts"
                  className="rounded-lg text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#2EC4B6] flex-1"
                >
                  <ImageIcon className="size-3.5 mr-1" />
                  Posts
                  {searchPosts.length > 0 && (
                    <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                      {searchPosts.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="communities"
                  className="rounded-lg text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#2EC4B6] flex-1"
                >
                  <Globe className="size-3.5 mr-1" />
                  Communities
                  {searchCommunities.length > 0 && (
                    <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                      {searchCommunities.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* Users Search Results */}
              <TabsContent value="users" className="mt-0">
                {isSearching ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3 p-3">
                        <Skeleton className="size-12 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                        <Skeleton className="h-7 w-16 rounded-lg" />
                      </div>
                    ))}
                  </div>
                ) : searchUsers.length === 0 ? (
                  <SearchEmptyState
                    icon={<Users className="size-10 text-gray-300" />}
                    title="No users found"
                    description="Try a different search to find travelers."
                  />
                ) : (
                  <>
                  <div className="space-y-2">
                    {searchUsers.map((user, index) => (
                      <motion.div
                        key={user.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05, duration: 0.3 }}
                        className="flex items-center gap-3 p-3 bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow"
                      >
                        <Avatar
                          className="size-12 cursor-pointer ring-2 ring-transparent hover:ring-[#2EC4B6]/30 transition-all"
                          onClick={() => handleViewUser(user)}
                        >
                          <AvatarImage src={user.avatar || undefined} alt={user.name} />
                          <AvatarFallback className="bg-gradient-to-br from-[#2EC4B6]/20 to-[#FFBA49]/20 text-[#2EC4B6]">
                            {user.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() => handleViewUser(user)}
                        >
                          <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
                          <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                          {user.bio && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">{user.bio}</p>
                          )}
                        </div>
                        <div className="flex gap-1.5 flex-shrink-0">
                          {/* Add Friend button */}
                          {user.friendRequestStatus !== 'accepted' && !friendIds.includes(user.id) && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs rounded-lg border-[#2EC4B6]/30 text-[#2EC4B6] hover:bg-[#2EC4B6]/10"
                              disabled={user.friendRequestStatus === 'pending_sent'}
                              onClick={() => handleSendFriendRequest(user.id)}
                            >
                              <UserPlus className="size-3 mr-0.5" />
                              {user.friendRequestStatus === 'pending_sent' ? 'Sent' : 'Add'}
                            </Button>
                          )}
                          {/* Follow button */}
                          <Button
                            size="sm"
                            className={`h-7 px-2.5 text-xs rounded-lg ${
                              user.isFollowing || followingIds.includes(user.id)
                                ? 'bg-muted text-muted-foreground hover:bg-muted/80 border border-border'
                                : 'bg-[#2EC4B6] hover:bg-[#2EC4B6]/90 text-white'
                            }`}
                            onClick={() => handleFollowUser(user.id)}
                          >
                            {user.isFollowing || followingIds.includes(user.id) ? 'Following' : 'Follow'}
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  {usersHasMore && usersCursor && (
                    <div className="flex justify-center pt-3">
                      <button
                        onClick={() => performSearch(searchQuery, usersCursor)}
                        disabled={isLoadingMoreSearch}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted"
                      >
                        {isLoadingMoreSearch ? (
                          <>
                            <Loader2 className="size-4 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          'Load more users'
                        )}
                      </button>
                    </div>
                  )}
                </>
                )}
              </TabsContent>

              {/* Posts Search Results */}
              <TabsContent value="posts" className="mt-0">
                {isSearching ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex gap-3 p-3">
                        <Skeleton className="size-16 rounded-xl" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : searchPosts.length === 0 ? (
                  <SearchEmptyState
                    icon={<ImageIcon className="size-10 text-gray-300" />}
                    title="No posts found"
                    description="Try searching for a destination, caption, or tag."
                  />
                ) : (
                  <>
                  <div className="space-y-2">
                    {searchPosts.map((post, index) => (
                      <motion.div
                        key={post.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05, duration: 0.3 }}
                        className="flex gap-3 p-3 bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => {
                          const fullPost: Post = {
                            id: post.id,
                            caption: post.caption,
                            images: post.images,
                            isPublic: post.isPublic,
                            isMemory: false,
                            location: post.location,
                            tags: post.tags,
                            authorId: post.authorId,
                            author: {
                              id: post.author.id,
                              email: '',
                              username: post.author.username,
                              name: post.author.name,
                              avatar: post.author.avatar,
                              bio: null,
                              isPrivate: false,
                            },
                            createdAt: post.createdAt,
                            likes: post.likes,
                            comments: post.comments,
                            isLiked: false,
                            latitude: null,
                            longitude: null,
                          }
                          setSelectedPost(fullPost)
                        }}
                      >
                        {/* Mini post image */}
                        <div className="size-16 rounded-xl overflow-hidden flex-shrink-0 bg-muted">
                          <img
                            src={post.images?.[0] || `https://picsum.photos/seed/${post.id}/200/200`}
                            alt={post.caption || 'Post'}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                        {/* Post info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {post.caption || 'No caption'}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Avatar className="size-4">
                              <AvatarImage src={post.author.avatar || undefined} />
                              <AvatarFallback className="text-[8px]">{post.author.name[0]}</AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-muted-foreground truncate">@{post.author.username}</span>
                          </div>
                          {post.location && (
                            <p className="text-xs text-muted-foreground flex items-center gap-0.5 mt-0.5 truncate">
                              <MapPin className="size-2.5" />
                              {post.location}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                              <Heart className="size-3 text-[#FF6B6B]" />
                              {post.likes}
                            </span>
                            <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                              <MessageCircle className="size-3" />
                              {post.comments}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  {postsHasMore && postsCursor && (
                    <div className="flex justify-center pt-3">
                      <button
                        onClick={() => performSearch(searchQuery, postsCursor)}
                        disabled={isLoadingMoreSearch}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted"
                      >
                        {isLoadingMoreSearch ? (
                          <>
                            <Loader2 className="size-4 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          'Load more posts'
                        )}
                      </button>
                    </div>
                  )}
                </>
                )}
              </TabsContent>

              {/* Communities Search Results */}
              <TabsContent value="communities" className="mt-0">
                {isSearching ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="p-4 rounded-2xl border border-border">
                        <Skeleton className="h-5 w-3/4 mb-2" />
                        <Skeleton className="h-3 w-1/2 mb-1" />
                        <Skeleton className="h-3 w-2/3" />
                      </div>
                    ))}
                  </div>
                ) : searchCommunities.length === 0 ? (
                  <SearchEmptyState
                    icon={<Globe className="size-10 text-gray-300" />}
                    title="No communities found"
                    description="Try a different search to find travel communities."
                  />
                ) : (
                  <>
                  <div className="space-y-2">
                    {searchCommunities.map((community, index) => (
                      <motion.div
                        key={community.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05, duration: 0.3 }}
                        className="bg-card rounded-2xl border border-border p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => handleViewCommunity(community)}
                      >
                        <div className="flex items-start gap-3">
                          {/* Community image or placeholder */}
                          <div className="size-12 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-[#2EC4B6]/20 to-[#FFBA49]/20 flex items-center justify-center">
                            {community.image ? (
                              <img
                                src={community.image}
                                alt={community.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Globe className="size-5 text-[#2EC4B6]" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-foreground truncate">{community.name}</h4>
                            {community.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{community.description}</p>
                            )}
                            <div className="flex items-center gap-3 mt-2">
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Users className="size-3" />
                                {formatMembers(community.members)} members
                              </span>
                              {community.category && (
                                <Badge variant="outline" className="text-[10px] h-5">
                                  {community.category}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <ChevronRightIcon className="size-4 text-muted-foreground flex-shrink-0 mt-1" />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  {communitiesHasMore && communitiesCursor && (
                    <div className="flex justify-center pt-3">
                      <button
                        onClick={() => performSearch(searchQuery, communitiesCursor)}
                        disabled={isLoadingMoreSearch}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted"
                      >
                        {isLoadingMoreSearch ? (
                          <>
                            <Loader2 className="size-4 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          'Load more communities'
                        )}
                      </button>
                    </div>
                  )}
                </>
                )}
              </TabsContent>
            </Tabs>

            {/* No results at all */}
            {!isSearching && totalSearchResults === 0 && searchQuery.trim() && (
              <SearchEmptyState
                icon={<Search className="size-10 text-gray-300" />}
                title="No results found"
                description={`No matches for "${searchQuery}". Try a different search term.`}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Default Content (hidden when searching) */}
      <AnimatePresence>
        {!showSearchResults && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {/* Category Filter Pills - Enhanced */}
            <div className="px-4 pb-3">
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {categories.map((cat) => {
                  const emojiMap: Record<string, string> = {
                    All: '🌍',
                    Travel: '✈️',
                    Food: '🍜',
                    Adventure: '🏔️',
                    Culture: '🏛️',
                    Beach: '🏖️',
                    Mountain: '⛰️',
                    City: '🏙️',
                  }
                  return (
                    <motion.button
                      key={cat}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedCategory(cat)}
                      className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                        selectedCategory === cat
                          ? 'bg-gradient-to-r from-[#FF6B6B] to-[#FF8C42] text-white shadow-lg shadow-[#FF6B6B]/30'
                          : 'glass text-muted-foreground hover:bg-gradient-to-r hover:from-[#FF6B6B]/10 hover:to-[#2EC4B6]/10'
                      }`}
                    >
                      <span>{emojiMap[cat]}</span>
                      <span>{cat}</span>
                    </motion.button>
                  )
                })}
              </div>
            </div>

            {/* Tabs - Glass Morphism */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="px-4">
                <TabsList className="w-full glass rounded-xl h-12 p-1">
                  <TabsTrigger
                    value="trending"
                    className="rounded-lg text-xs font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FF6B6B]/20 data-[state=active]:to-[#FF8C42]/20 data-[state=active]:shadow-md data-[state=active]:text-[#FF6B6B] flex-1 transition-all"
                  >
                    <TrendingUp className="size-3.5 mr-1" />
                    Trending
                  </TabsTrigger>
                  <TabsTrigger
                    value="people"
                    className="rounded-lg text-xs font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#4FACFE]/20 data-[state=active]:to-[#00F2FE]/20 data-[state=active]:shadow-md data-[state=active]:text-[#4FACFE] flex-1 transition-all"
                  >
                    <Users className="size-3.5 mr-1" />
                    People
                  </TabsTrigger>
                  <TabsTrigger
                    value="itineraries"
                    className="rounded-lg text-xs font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#43E97B]/20 data-[state=active]:to-[#38F9D7]/20 data-[state=active]:shadow-md data-[state=active]:text-[#43E97B] flex-1 transition-all"
                  >
                    <Compass className="size-3.5 mr-1" />
                    Trips
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Trending Posts Tab */}
              <TabsContent value="trending" className="mt-3">
                {isLoading ? (
                  <LoadingSkeleton />
                ) : trendingPosts.length === 0 ? (
                  <EmptyState />
                ) : (
                  <div className="grid grid-cols-3 gap-0.5 px-0.5">
                    {trendingPosts.map((post, index) => {
                      const large = isLargeItem(index)
                      const imageSrc = post.images?.[0] || `https://picsum.photos/seed/${post.id}/400/400`

                      return (
                        <motion.div
                          key={post.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3, delay: index * 0.03 }}
                          className={`relative overflow-hidden cursor-pointer group ${
                            large ? 'row-span-2 aspect-[3/4]' : 'aspect-square'
                          }`}
                          onClick={() => setSelectedPost(post)}
                        >
                          <img
                            src={imageSrc}
                            alt={post.caption || 'Travel post'}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                          />
                          {/* Hover Overlay */}
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-4">
                            <div className="flex items-center gap-1 text-white">
                              <Heart className="size-4 fill-white" />
                              <span className="text-sm font-semibold">{post.likes}</span>
                            </div>
                            <div className="flex items-center gap-1 text-white">
                              <MessageCircle className="size-4 fill-white" />
                              <span className="text-sm font-semibold">{post.comments}</span>
                            </div>
                          </div>
                          {/* Multiple images indicator */}
                          {post.images && post.images.length > 1 && (
                            <div className="absolute top-2 right-2">
                              <svg className="size-4 text-white drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                              </svg>
                            </div>
                          )}
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </TabsContent>

              {/* People Tab */}
              <TabsContent value="people" className="mt-3 px-4 pb-4">
                {usersLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3 p-3">
                        <Skeleton className="size-12 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                        <Skeleton className="h-7 w-16 rounded-lg" />
                      </div>
                    ))}
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Users className="size-12 text-gray-300 mb-3" />
                    <h3 className="text-lg font-semibold text-foreground mb-1">No people found</h3>
                    <p className="text-sm text-muted-foreground">Try a different search to find travelers.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredUsers.map((user, index) => {
                      const isFollowing = followingIds.includes(user.id)
                      return (
                        <motion.div
                          key={user.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center gap-3 p-3 bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow"
                        >
                          <Avatar
                            className="size-12 cursor-pointer"
                            onClick={() => handleViewUser(user)}
                          >
                            <AvatarImage src={user.avatar || undefined} alt={user.name} />
                            <AvatarFallback className="bg-gradient-to-br from-[#2EC4B6]/20 to-[#FFBA49]/20 text-[#2EC4B6]">
                              {user.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div
                            className="flex-1 min-w-0 cursor-pointer"
                            onClick={() => handleViewUser(user)}
                          >
                            <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
                            <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                            {user.bio && (
                              <p className="text-xs text-muted-foreground truncate mt-0.5">{user.bio}</p>
                            )}
                          </div>
                          <Button
                            size="sm"
                            className={`h-7 px-3 text-xs rounded-lg flex-shrink-0 ${
                              isFollowing
                                ? 'bg-muted text-muted-foreground hover:bg-muted/80 border border-border'
                                : 'bg-[#2EC4B6] hover:bg-[#2EC4B6]/90 text-white'
                            }`}
                            onClick={() => handleFollowUser(user.id)}
                          >
                            {isFollowing ? 'Following' : (
                              <>
                                <UserPlus className="size-3 mr-1" />
                                Follow
                              </>
                            )}
                          </Button>
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </TabsContent>

              {/* Itineraries Tab */}
              <TabsContent value="itineraries" className="mt-3 px-4 pb-4">
                {itinerariesLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="p-4 rounded-2xl border border-border">
                        <Skeleton className="h-5 w-3/4 mb-2" />
                        <Skeleton className="h-3 w-1/2 mb-1" />
                        <Skeleton className="h-3 w-2/3" />
                      </div>
                    ))}
                  </div>
                ) : filteredItineraries.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Compass className="size-12 text-gray-300 mb-3" />
                    <h3 className="text-lg font-semibold text-foreground mb-1">No itineraries found</h3>
                    <p className="text-sm text-muted-foreground">Be the first to share your travel plan!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredItineraries.map((itinerary, index) => (
                      <motion.div
                        key={itinerary.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-card rounded-2xl border border-border p-4 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Avatar className="size-6">
                            <AvatarImage src={itinerary.author.avatar || undefined} alt={itinerary.author.name} />
                            <AvatarFallback className="text-[10px]">{itinerary.author.name[0]}</AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground">@{itinerary.author.username}</span>
                        </div>
                        <h4 className="text-sm font-semibold text-foreground mb-1">{itinerary.title}</h4>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                          <span className="flex items-center gap-1">
                            <MapPin className="size-3" />
                            {itinerary.location}, {itinerary.country}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="size-3" />
                            {itinerary.days} days
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">
                            <Globe className="size-2.5 mr-0.5" />
                            {itinerary.travelType}
                          </Badge>
                          <span className="text-xs font-medium text-[#FF8C42]">
                            {itinerary.currency} {itinerary.budget.toLocaleString()}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Post Detail Overlay */}
      <AnimatePresence>
        {selectedPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
            onClick={() => setSelectedPost(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card rounded-2xl overflow-hidden max-w-sm w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Image */}
              <div className="relative aspect-square">
                <img
                  src={selectedPost.images?.[0] || `https://picsum.photos/seed/${selectedPost.id}/800/800`}
                  alt={selectedPost.caption || 'Post'}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => setSelectedPost(null)}
                  className="absolute top-3 right-3 size-8 rounded-full bg-black/40 flex items-center justify-center"
                >
                  <X className="size-4 text-white" />
                </button>
              </div>
              {/* Info */}
              <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={selectedPost.author.avatar || `https://picsum.photos/seed/${selectedPost.author.id}/100/100`}
                    alt={selectedPost.author.name}
                    className="size-9 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{selectedPost.author.username}</p>
                    {selectedPost.location && (
                      <p className="text-xs text-muted-foreground">{selectedPost.location}</p>
                    )}
                  </div>
                </div>
                {selectedPost.caption && (
                  <p className="text-sm text-foreground mb-3">{selectedPost.caption}</p>
                )}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Heart className="size-4 text-[#FF6B6B]" />
                    <span>{selectedPost.likes}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="size-4" />
                    <span>{selectedPost.comments}</span>
                  </div>
                </div>
                {selectedPost.tags && selectedPost.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {selectedPost.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  )
}

function SearchEmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="mb-3">{icon}</div>
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-[240px]">{description}</p>
    </motion.div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="px-4 py-3">
      <div className="glass rounded-2xl p-4">
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className={`${i % 5 === 2 || i % 5 === 4 ? 'row-span-2 aspect-[3/4]' : 'aspect-square'}`}
            >
              <Skeleton className="w-full h-full rounded-xl bg-gradient-to-br from-[#FF6B6B]/10 to-[#2EC4B6]/10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative mb-6"
      >
        <div className="size-20 rounded-full bg-gradient-to-br from-[#4FACFE]/20 via-[#00F2FE]/20 to-[#43E97B]/20 flex items-center justify-center">
          <Compass className="size-10 text-[#4FACFE]" strokeWidth={1.5} />
        </div>
        <div className="absolute -top-2 -right-2 text-3xl animate-bounce">🧭</div>
        <div className="absolute -bottom-2 -left-2 text-2xl animate-pulse">🗺️</div>
      </motion.div>
      <h3 className="text-2xl font-bold text-gradient-ocean mb-2">Discover Amazing Content</h3>
      <p className="text-sm text-muted-foreground max-w-[280px] leading-relaxed">
        Explore trending travel posts, connect with fellow travelers, and find inspiring itineraries.
      </p>
      <div className="mt-6 flex gap-2 text-2xl">
        <span className="animate-bounce" style={{ animationDelay: '0ms' }}>🌟</span>
        <span className="animate-bounce" style={{ animationDelay: '100ms' }}>🎯</span>
        <span className="animate-bounce" style={{ animationDelay: '200ms' }}>💫</span>
      </div>
    </div>
  )
}
