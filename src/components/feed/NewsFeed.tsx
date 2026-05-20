'use client'

import { useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw, Compass, Loader2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore, type Post } from '@/lib/store'
import { usePosts } from '@/lib/queries'
import StoryBar from './StoryBar'
import PostCard from './PostCard'

const PAGE_LIMIT = 10

function FeedSkeleton() {
  return (
    <div className="space-y-0">
      {/* Story bar skeleton - Glass style */}
      <div className="px-4 pt-3 pb-2">
        <div className="glass rounded-2xl p-4">
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2 shrink-0">
                <Skeleton className="size-16 rounded-full bg-gradient-to-br from-[#2F5C9B]/10 to-[#5CA5CD]/10" />
                <Skeleton className="h-2.5 w-12 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Post skeletons - Enhanced */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="px-4 py-3">
          <div className="glass rounded-2xl overflow-hidden">
            {/* Author row */}
            <div className="flex items-center gap-3 px-5 py-4">
              <Skeleton className="size-12 rounded-full bg-gradient-to-br from-[#2F5C9B]/20 to-[#5CA5CD]/20" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-32 rounded" />
                <Skeleton className="h-3 w-24 rounded" />
              </div>
            </div>
            {/* Image */}
            <Skeleton className="w-full aspect-[4/3] bg-gradient-to-br from-[#2F5C9B]/5 to-[#5CA5CD]/5" />
            {/* Actions */}
            <div className="flex items-center justify-between px-5 py-3">
              <div className="flex gap-3">
                <Skeleton className="size-6 rounded" />
                <Skeleton className="size-6 rounded" />
                <Skeleton className="size-6 rounded" />
              </div>
              <Skeleton className="size-6 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyFeed() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative mb-6"
      >
        <div className="size-24 rounded-full bg-gradient-to-br from-[#2F5C9B]/20 via-[#5CA5CD]/20 to-[#E58BEA]/20 flex items-center justify-center">
          <Compass className="size-12 text-[#2F5C9B]" strokeWidth={1.5} />
        </div>
        <div className="absolute -top-2 -right-2 text-4xl animate-bounce">✈️</div>
        <div className="absolute -bottom-2 -left-2 text-3xl animate-pulse">🌍</div>
      </motion.div>
      <h2 className="text-2xl font-bold text-gradient-sunset mb-3">Ready to Explore?</h2>
      <p className="text-sm text-muted-foreground max-w-[300px] leading-relaxed">
        Follow travelers and discover amazing destinations to fill your feed with inspiration.
      </p>
      <div className="mt-6 flex gap-2 text-2xl">
        <span className="animate-bounce" style={{ animationDelay: '0ms' }}>🏔️</span>
        <span className="animate-bounce" style={{ animationDelay: '100ms' }}>🏖️</span>
        <span className="animate-bounce" style={{ animationDelay: '200ms' }}>🗼</span>
        <span className="animate-bounce" style={{ animationDelay: '300ms' }}>🌋</span>
      </div>
    </div>
  )
}

function LoadingMoreSpinner() {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="glass px-6 py-3 rounded-full shadow-glass">
        <div className="flex items-center gap-3">
          <Loader2 className="size-5 text-[#2F5C9B] animate-spin" />
          <span className="text-sm text-foreground font-medium">Loading more adventures...</span>
        </div>
      </div>
    </div>
  )
}

function EndOfFeedMessage() {
  return (
    <div className="flex flex-col items-center justify-center py-10">
      <div className="text-4xl mb-3">🎉</div>
      <div className="glass px-6 py-3 rounded-xl">
        <span className="text-sm text-foreground font-medium">You&apos;ve caught up with all travel stories!</span>
      </div>
      <div className="mt-3 text-2xl flex gap-1">
        <span>🗺️</span>
        <span>✨</span>
        <span>🌟</span>
      </div>
    </div>
  )
}

export default function NewsFeed() {
  const { stories, setStories, isLoading, setIsLoading, currentUser, setLikedPostIds, setBookmarks, setFollowingIds, setPendingFriendRequestCount, setPosts, blockedIds } = useAppStore()
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  // React Query for posts with cursor-based pagination
  const {
    data: postsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isPostsLoading,
    refetch: refetchPosts,
  } = usePosts(currentUser?.id || '', blockedIds)

  // Transform post data from API format
  const transformPost = useCallback((post: Record<string, unknown>) => ({
    ...post,
    isLiked: (post as { isLiked?: boolean }).isLiked || false,
    isBookmarked: (post as { isBookmarked?: boolean }).isBookmarked || false,
    likes: (post as { _count?: { likes?: number } })._count?.likes ?? (post as { likes?: number }).likes ?? 0,
    comments: (post as { _count?: { comments?: number } })._count?.comments ?? (post as { comments?: number }).comments ?? 0,
    author: {
      id: (post.author as { id?: string })?.id || (post.authorId as string) || '',
      email: (post.author as { email?: string })?.email || '',
      username: (post.author as { username?: string })?.username || 'unknown',
      name: (post.author as { name?: string })?.name || 'Unknown',
      avatar: (post.author as { avatar?: string | null })?.avatar || null,
      bio: null,
      isPrivate: false,
    },
  }), [])

  // Flatten pages into a single array of posts
  const allPosts = (postsData?.pages.flatMap((page) =>
    page.posts.map((post) => transformPost(post as unknown as Record<string, unknown>))
  ) || []) as Post[]

  // Sync posts to Zustand store for components that read from it
  useEffect(() => {
    if (allPosts.length > 0) {
      // Only update if the posts have actually changed
      const currentPosts = useAppStore.getState().posts
      if (currentPosts.length !== allPosts.length) {
        setPosts(allPosts)
      }
    }
  }, [allPosts, setPosts])

  // Fetch stories and social data on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true)
      try {
        const userId = currentUser?.id || ''
        const blockedIdsParam = blockedIds.length > 0 ? `&blockedIds=${blockedIds.join(',')}` : ''
        const storiesRes = await fetch(`/api/stories${userId ? `?userId=${userId}` : ''}${blockedIdsParam}`)

        if (storiesRes.ok) {
          const storiesData = await storiesRes.json()
          const storiesWithViewed = storiesData.stories.map(
            (story: Record<string, unknown>) => ({
              ...story,
              viewed: (story.viewed as boolean) || false,
              author: {
                id: (story.author as { id?: string })?.id || '',
                email: (story.author as { email?: string })?.email || '',
                username: (story.author as { username?: string })?.username || 'unknown',
                name: (story.author as { name?: string })?.name || 'Unknown',
                avatar: (story.author as { avatar?: string | null })?.avatar || null,
                bio: null,
                isPrivate: false,
              },
            })
          )
          setStories(storiesWithViewed)
        }

        // Fetch following IDs, friend request count, likes, and bookmarks
        if (userId) {
          try {
            const [followsRes, friendReqRes, likesRes, bookmarksRes] = await Promise.all([
              fetch(`/api/follows?userId=${userId}&type=following`),
              fetch(`/api/friend-requests?userId=${userId}&type=pending`),
              fetch(`/api/likes?userId=${userId}`),
              fetch(`/api/bookmarks?userId=${userId}`),
            ])
            if (followsRes.ok) {
              const followsData = await followsRes.json()
              setFollowingIds((followsData.users || []).map((u: { id: string }) => u.id))
            }
            if (friendReqRes.ok) {
              const friendData = await friendReqRes.json()
              setPendingFriendRequestCount(friendData.pendingCount || 0)
            }
            // Load liked post IDs from API
            if (likesRes.ok) {
              const likesData = await likesRes.json()
              console.log('[NewsFeed] Loaded liked post IDs:', likesData.likedPostIds)
              setLikedPostIds(likesData.likedPostIds || [])
            } else {
              console.error('[NewsFeed] Failed to fetch likes:', likesRes.status, likesRes.statusText)
            }
            // Load bookmarked post IDs from API
            if (bookmarksRes.ok) {
              const bookmarksData = await bookmarksRes.json()
              console.log('[NewsFeed] Loaded bookmarks:', bookmarksData.bookmarks?.length || 0, 'items')
              setBookmarks(bookmarksData.bookmarks || [])
            } else {
              console.error('[NewsFeed] Failed to fetch bookmarks:', bookmarksRes.status, bookmarksRes.statusText)
            }
          } catch {
            // Non-critical
          }
        }
      } catch (error) {
        console.error('Failed to fetch feed data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (stories.length === 0) {
      fetchInitialData()
    }
  }, [setStories, setIsLoading, currentUser, setLikedPostIds, setBookmarks, setFollowingIds, setPendingFriendRequestCount, stories.length, blockedIds])

  // Set up IntersectionObserver for infinite scroll
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    const sentinel = sentinelRef.current
    if (!sentinel) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      {
        rootMargin: '200px',
      }
    )

    observerRef.current.observe(sentinel)

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  const handleRefresh = async () => {
    await refetchPosts()
  }

  if ((isLoading || isPostsLoading) && allPosts.length === 0) {
    return (
      <div className="max-w-md mx-auto">
        <FeedSkeleton />
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto pb-4">
      {/* Refresh button - Hidden */}
      <div className="flex justify-center py-2 hidden">
        <motion.button
          whileTap={{ scale: 0.9, rotate: 180 }}
          onClick={handleRefresh}
          className="p-2 rounded-full hover:bg-muted transition-colors outline-none"
          aria-label="Refresh feed"
        >
          <RefreshCw className="size-4 text-muted-foreground" />
        </motion.button>
      </div>

      {/* Story Bar - Now in glass container */}
      <StoryBar />

      {/* Posts - Immersive Travel Stories */}
      {allPosts.length === 0 ? (
        <EmptyFeed />
      ) : (
        <div className="divide-y-0 mt-2">
          {allPosts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <PostCard post={post} />
            </motion.div>
          ))}

          {/* Sentinel element for infinite scroll */}
          <div ref={sentinelRef} className="h-1" aria-hidden="true" />

          {/* Loading more indicator */}
          {isFetchingNextPage && <LoadingMoreSpinner />}

          {/* End of feed message */}
          {!isFetchingNextPage && !hasNextPage && allPosts.length > 0 && (
            <EndOfFeedMessage />
          )}
        </div>
      )}
    </div>
  )
}
