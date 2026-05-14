# Task 6: Add Share Posts via DM

## Summary
Enhanced ShareToCommunitySheet with dual-tab interface supporting both Community sharing and DM sharing. DM tab fetches friends, provides search, and sends posts as messages via existing chat-rooms + messages API.

## Files Modified
- `/home/z/my-project/src/components/feed/ShareToCommunitySheet.tsx` — Added tabs, DM functionality
- `/home/z/my-project/src/components/feed/PostCard.tsx` — Added postCaption prop

## Key Changes
- Tabs component with "Community" and "Message" tabs
- DM tab: fetches friends from /api/friend-requests?type=friends
- Search bar to filter friends by username/name
- Send button: GET /api/chat-rooms to find/create room → POST /api/messages to send
- Formatted message: "📷 Shared a post: [caption preview]"
- Empty states for no friends / no matches
- Lint passes with zero errors
