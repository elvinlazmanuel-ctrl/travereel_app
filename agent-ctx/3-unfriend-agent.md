# Task 3: Add Unfriend Functionality

## Agent: unfriend-agent

## Work Log:

- Read worklog.md to understand project context and prior work
- Read /api/friend-requests/route.ts — found existing GET, POST, PUT, DELETE handlers (DELETE only handled cancel via query params)
- Read FriendsPage.tsx — found FriendCard component with Message button but no unfriend action
- Read UserProfilePage.tsx — found disabled "Friends" button when friendRequestStatus === 'accepted'
- Read store.ts — confirmed removeFriendId action exists (filters friend ID from friendIds array)
- Read Prisma schema — confirmed Follow model with @@unique([followerId, followingId]) and FriendRequest model

### API Changes (/api/friend-requests/route.ts):
- Modified DELETE handler to support two flows:
  1. **Unfriend flow**: JSON body with `{ userId, friendId }` — finds accepted FriendRequest in either direction, deletes it, removes mutual follows (both directions), returns success
  2. **Cancel request flow**: Query params with `requestId` + `userId` — unchanged behavior (only sender can cancel pending request)
- Added content-type detection to determine which flow to use
- Added validation: cannot unfriend yourself, friendship must exist, must be accepted status
- Uses `db.follow.deleteMany` with OR clause to remove both follow directions atomically

### FriendsPage Changes (/components/friends/FriendsPage.tsx):
- Added `unfriendUser` function: calls DELETE /api/friend-requests with JSON body, on success calls `removeFriendId`, `toggleFollow`, filters friend from local state, shows toast
- Added `onUnfriend` and `isUnfriendLoading` props to FriendCard component
- FriendCard now shows UserX icon button on hover (via onMouseEnter/onMouseLeave + AnimatePresence)
- UserX button shows confirmation dialog (`window.confirm`) before unfriending
- Loading state shows Loader2 spinner on the unfriend button
- AnimatePresence with scale animation for smooth button appearance/disappearance

### UserProfilePage Changes (/components/profile/UserProfilePage.tsx):
- Added UserX icon import from lucide-react
- Added `removeFriendId` from store
- Added `handleUnfriend` function: confirms with `window.confirm`, calls DELETE API, on success calls `removeFriendId`, `toggleFollow`, sets `friendRequestStatus` to 'none', shows toast
- Changed "Friends" button from disabled to clickable when `friendRequestStatus === 'accepted'`
- Button now shows UserX icon + "Friends" text with hover effect (teal → coral color transition)
- Hover changes background from teal tint to red tint, signaling destructive action
- Loading state shows spinning Loader2 icon

### Verification:
- Lint passes with zero errors
- Dev server running without errors

## Summary:
- DELETE /api/friend-requests now supports unfriending via JSON body { userId, friendId }
- FriendCard in FriendsPage shows unfriend button on hover with confirmation dialog
- UserProfilePage "Friends" button is now clickable and allows unfriending with confirmation
- All actions update Zustand store (removeFriendId, toggleFollow) for consistent state
- Toast notifications for success and error feedback
