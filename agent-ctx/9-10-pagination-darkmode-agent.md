# Task 9 - Cursor-based Pagination

## Summary
Added cursor-based pagination to all API endpoints and frontend components.

### API Changes
- **Posts API**: Replaced page-based with cursor-based pagination (cursor + limit params, nextCursor + hasMore response)
- **Communities API**: Added cursor/limit params for list endpoint
- **Comments API**: Added cursor/limit params, removed hard take:50
- **ChatRooms API**: Added cursor-based pagination for messages (DESC order, cursor on message ID)
- **Search API**: Added cursor pagination to all 3 result sets with per-type cursors

### Frontend Changes
- **NewsFeed**: IntersectionObserver with cursor tracking, infinite scroll
- **CommentSheet**: "Load more comments" button with cursor tracking
- **ChatRoomPage**: "Load earlier messages" button with cursor tracking
- **DiscoveryPage**: "Load more" buttons for users/posts/communities search tabs

# Task 10 - Dark Mode with next-themes

## Summary
Integrated next-themes for proper dark mode support across the app.

### Changes
- Created ThemeProvider component wrapping next-themes
- Wrapped app in ThemeProvider with class strategy
- Updated CommunityDetailPage, ProfilePage, CommentSheet to use semantic theme colors
- SettingsPage dark mode toggle now uses next-themes useTheme()/setTheme()
- Replaced hardcoded gray/white colors with bg-card, bg-muted, text-foreground, text-muted-foreground, border-border
