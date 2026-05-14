# Task 2a - Backend APIs for Comments, Follows, Messages, Share, Notifications, Users

## Summary
Created 7 backend API route files for the Wanderlust social media travel app, covering comments, follows, messages, chat rooms, sharing, notifications, and user profiles.

## Files Created
1. `src/app/api/comments/route.ts` - GET (by postId) & POST (create comment with author info)
2. `src/app/api/follows/route.ts` - GET (followers/following by userId & type), POST (follow), DELETE (unfollow)
3. `src/app/api/messages/route.ts` - GET (chat rooms for user with members & last message), POST (send message)
4. `src/app/api/chat-rooms/route.ts` - GET (get/create 1:1 chat room between two users), POST (create group chat)
5. `src/app/api/share/route.ts` - POST (share post to community with optional caption)
6. `src/app/api/notifications/route.ts` - GET (notifications with fromUser info), POST (create notification), PUT (mark all as read)
7. `src/app/api/users/route.ts` - GET (profile by id/username with follower counts & isFollowing, user search), PUT (update profile)

## Key Design Decisions
- All routes follow existing project patterns: `import { db } from '@/lib/db'`, `NextResponse`, try/catch error handling
- Comments API returns comments with full author info (id, username, name, avatar)
- Follows API validates self-follow and duplicate follow attempts
- Messages GET returns chat rooms with members and last message for the user's sidebar
- Chat Rooms GET auto-creates a 1:1 chat room if none exists between two users
- Share API verifies both post and community exist before creating SharedPost
- Notifications GET enriches with fromUser data; PUT marks all unread notifications as read for a user
- Users GET supports `id`, `username`, and `search` params; includes follower/following/post counts and isFollowing status via `currentUserId` param
- Users PUT only updates fields that are explicitly provided in the request body
- All routes return appropriate HTTP status codes (400 for validation, 404 for not found, 409 for conflicts, 201 for creation)

## Testing
- Lint passes with no errors
- Dev server compiles successfully
