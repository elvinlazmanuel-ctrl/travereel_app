# Task 19: Add infinite scroll/pagination to feed

## Agent: infinite-scroll-agent

## Summary
Added infinite scroll pagination to the NewsFeed so posts load progressively as the user scrolls down, instead of loading all posts at once.

## Changes Made

### 1. API Route (`/src/app/api/posts/route.ts`)
- **GET handler** now accepts `page` and `limit` query parameters
- When `page` or `limit` is explicitly provided: applies `skip`/`take` pagination, returns `{ posts, page, totalPages, totalPosts }`
- When not provided: returns all posts as before (backwards compatible)
- Optimized report count query to only fetch reports for returned post IDs
- POST/PUT/DELETE handlers unchanged

### 2. NewsFeed Component (`/src/components/feed/NewsFeed.tsx`)
- Added `currentPage`, `totalPages`, `isLoadingMore` state
- `fetchInitialData`: loads page 1, replaces all posts in store
- `fetchMorePosts`: loads next page, appends to existing posts
- `IntersectionObserver` on sentinel div with `rootMargin: '200px'` for early pre-fetch
- Guard: won't fetch if already loading or no more pages
- `LoadingMoreSpinner`: shown while fetching next page
- `EndOfFeedMessage`: shown when all pages loaded
- Refresh resets to page 1

## Key Design Decisions
- **Backwards compatible pagination**: Other consumers (AdminPostsPage, DiscoveryPage, ProfilePage, etc.) that call `/api/posts` without page/limit params still get all posts — no breaking changes
- **Append pattern**: Uses `useAppStore.getState().posts` to read current posts and append new ones, avoiding need for new store actions
- **Pre-fetch**: `rootMargin: '200px'` triggers loading before user reaches the very bottom for smoother experience
