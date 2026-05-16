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
      {/* Story bar skeleton */}
      <div className="flex gap-3 px-4 py-3 border-b border-border overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1 shrink-0">
            <Skeleton className="size-16 rounded-full" />
            <Skeleton className="h-2.5 w-12 rounded" />
          </div>
        ))}
      </div>

      {/* Post skeletons */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="border-b border-border">
          {/* Author row */}
          <div className="flex items-center gap-3 px-4 py-3">
            <Skeleton className="size-9 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-24 rounded" />
              <Skeleton className="h-2.5 w-16 rounded" />
            </div>
          </div>
          {/* Image */}
          <Skeleton className="w-full aspect-square" />
          {/* Actions */}
          <div className="flex items-center justify-between px-4 py-2.5">
            <div className="flex gap-4">
              <Skeleton className="size-6 rounded" />
              <Skeleton className="size-6 rounded" />
              <Skeleton className="size-6 rounded" />
            </div>
            <Skeleton className="size-6 rounded" />
          </div>
          {/* Caption */}
          <div className="px-4 pb-3 space-y-1.5">
            <Skeleton className="h-3 w-32 rounded" />
            <Skeleton className="h-3 w-full rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyFeed() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-6">
      <div className="size-20 rounded-full bg-gradient-to-br from-[#FF6B6B]/10 via-[#FF8C42]/10 to-[#FFBA49]/10 flex items-center justify-center mb-4">
        <Compass className="size-10 text-[#FF8C42]" strokeWidth={1.5} />
      </div>
      <h2 className="text-xl font-bold text-foreground mb-2">Your Feed is Empty</h2>
      <p className="text-sm text-muted-foreground max-w-[280px]">
        Follow travelers and discover amazing destinations to fill your feed with inspiration.
      </p>
    </div>
  )
}

function LoadingMoreSpinner() {
  return (
    <div className="flex items-center justify-center py-6">
      <Loader2 className="size-6 text-[#FF8C42] animate-spin" />
      <span className="ml-2 text-sm text-muted-foreground">Loading more posts...</span>
    </div>
  )
}

function EndOfFeedMessage() {
  return (
    <div className="flex items-center justify-center py-6">
      <span className="text-sm text-muted-foreground">You&apos;ve reached the end of the feed</span>
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
              setLikedPostIds(likesData.likedPostIds || [])
            }
            // Load bookmarked post IDs from API
            if (bookmarksRes.ok) {
              const bookmarksData = await bookmarksRes.json()
              setBookmarks(bookmarksData.bookmarks || [])
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
    <div className="max-w-md mx-auto">
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

      {/* Story Bar */}
      <StoryBar />

      {/* Posts */}
      {allPosts.length === 0 ? (
        <EmptyFeed />
      ) : (
        <div className="divide-y-0">
          {allPosts.map((post) => (
            <PostCard key={post.id} post={post} />
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
