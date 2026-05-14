# Task 14: Add React Query for Server State

## Work Summary

Integrated TanStack React Query v5 for server state management, creating 8 query hooks and updating 3 key components.

## Files Created

- `/src/lib/query-provider.tsx` — QueryClient provider with 30s staleTime, no refetchOnWindowFocus, retry: 1
- `/src/lib/queries/usePosts.ts` — useInfiniteQuery with cursor-based pagination
- `/src/lib/queries/useUser.ts` — useQuery for single user profile
- `/src/lib/queries/useComments.ts` — useInfiniteQuery for post comments
- `/src/lib/queries/useChatRooms.ts` — useQuery for user's chat rooms (10s refetchInterval)
- `/src/lib/queries/useMessages.ts` — useInfiniteQuery for chat room messages
- `/src/lib/queries/useSearch.ts` — useQuery for unified search (10s staleTime)
- `/src/lib/queries/useFriends.ts` — useQuery for friends list (15s staleTime)
- `/src/lib/queries/useCommunities.ts` — useInfiniteQuery + useQuery for communities
- `/src/lib/queries/index.ts` — Barrel export of all hooks

## Files Modified

- `/src/app/page.tsx` — Added QueryProvider wrapping AppContent (inside ThemeProvider)
- `/src/components/feed/NewsFeed.tsx` — Replaced manual fetch with usePosts infinite query
- `/src/components/messages/MessagesPage.tsx` — Replaced manual fetch with useChatRooms hook
- `/src/components/discovery/DiscoveryPage.tsx` — Replaced manual search with useSearch hook + debounced input

## Key Design Decisions

- React Query handles server state (fetching, caching, refetching)
- Zustand handles client state (current view, UI state, optimistic updates)
- NewsFeed syncs React Query data to Zustand store for components reading from it
- MessagesPage uses refetchChatRooms() after mutations instead of manual re-fetch
- DiscoveryPage uses local debouncedSearch state to debounce before triggering React Query
- Incremental migration: not all components converted, just the most impactful ones
- Load-more for DiscoveryPage search still uses manual fetch for cursor-based pagination per entity type

## Lint Status
✅ Zero errors
