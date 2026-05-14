# Task 7 - Global Search (Posts + Communities + Users)

## Work Log

- Read worklog.md to understand project history and existing architecture
- Read DiscoveryPage.tsx — found existing search bar (local filter only), tabs for Trending/People/Itineraries, no unified search
- Read /api/posts/route.ts — found pagination support but no search capability
- Read /api/communities/route.ts — found category filter but no search capability
- Read /api/users/route.ts — found search param already exists for users
- Read prisma/schema.prisma — confirmed Post (caption, location, tags), Community (name, description), User (username, name, email) fields
- Read store.ts — confirmed SearchUserType with friendRequestStatus and isFollowing

### API - Search Posts (/api/posts/route.ts)
- Added `search` query param parsing
- When `search` is provided, adds `OR` filter: caption contains, location contains, tags contains
- Combined with existing authorId filter
- Added `searchTake` limit of 20 results when searching without pagination
- Backwards compatible: existing queries without search param are unaffected

### API - Search Communities (/api/communities/route.ts)
- Added `search` query param parsing
- When `search` is provided, adds `OR` filter: name contains, description contains
- Combined with existing category filter
- Added `take: 20` limit when search is active
- Backwards compatible: existing queries without search param are unaffected

### API - Unified Search (/api/search/route.ts) — NEW
- Accepts `q` (query string) and `currentUserId` params
- Returns empty results if `q` is empty
- Searches users, posts, and communities in parallel using Promise.all
- Users: searches username, name, email; excludes currentUserId; enriched with `isFollowing` and `friendRequestStatus`
- Posts: searches caption, location, tags; includes author info; transforms `_count` to flat `likes`/`comments`
- Communities: searches name, description; returns all fields
- All result sets limited to 20

### DiscoveryPage — Complete Rewrite
- Added global search state: searchUsers, searchPosts, searchCommunities, isSearching, searchActiveTab
- Added 300ms debounced search using useEffect + setTimeout
- Search triggers unified /api/search API call with currentUserId
- When search query is active, shows search results overlay with tabs: Users / Posts / Communities
- Users tab: avatar, name, username, bio, Add Friend button (with friendRequestStatus), Follow button (with isFollowing state)
- Posts tab: mini post card with image thumbnail, caption preview, author avatar+name, location, likes/comments counts
- Communities tab: community card with image/icon, name, description, member count, category badge, chevron right
- Click user → navigate to user-profile
- Click post → show post detail overlay (same as trending)
- Click community → navigate to community-detail
- Loading skeletons for each section
- Empty states with icons and helpful messages
- Framer Motion animations (slide-in, fade) for search results
- When search is cleared, returns to default Trending/People/Itineraries tabs
- Updated color scheme from #FF6B6B to #2EC4B6 for primary actions (follow, search active tabs, category pills)
- Used semantic theme colors (bg-card, text-foreground, text-muted-foreground, bg-muted, border-border) for dark mode compatibility
- Fixed Image icon import to ImageIcon to avoid ESLint jsx-a11y/alt-text false positive
- Lint passes with zero errors and zero warnings

## Stage Summary
- 3 API routes updated/created for search functionality
- Posts API: search by caption, location, tags (limit 20)
- Communities API: search by name, description (limit 20)
- Unified search API: parallel search across users, posts, communities with friend/follow status
- DiscoveryPage: full global search with debounced input, tabbed results, navigation, loading/empty states
- All changes use Wanderlust color scheme (#2EC4B6 primary, #FFBA49 accent, #FF6B6B error, #FF8C42 warning)
- Dark mode compatible with semantic color tokens
- Lint passes with zero errors
