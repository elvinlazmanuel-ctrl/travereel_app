# Task 2: Fix Internal Server Error on Friend Request API

## Summary
Fixed two API bugs in the Wanderlust travel platform:
1. **Friend request API** (`/api/friend-requests`) — Internal Server Error caused by missing database table
2. **Communities PUT route** (`/api/communities`) — Two issues: field name mismatch (`id` vs `communityId`) and missing join/leave logic

## Changes Made

### 1. Friend Request API Fix
- **Root Cause**: The `FriendRequest` model existed in the Prisma schema but the table had not been pushed to the SQLite database. When Prisma tried to query the `friend_requests` table, it failed with a table-not-found error, resulting in a 500 Internal Server Error.
- **Fix**: Ran `bun run db:push` to sync the schema with the database. This created the `friend_requests` table and regenerated the Prisma Client.
- **Verification**: Tested all CRUD operations — GET returns 200, POST returns 201, PUT (accept/reject) works, DELETE works.

### 2. Communities PUT Route Fix
- **File**: `/home/z/my-project/src/app/api/communities/route.ts`
- **Issue 1**: Frontend components (`CommunityPage.tsx` line 146, `CommunityDetailPage.tsx` lines 179, 198) send `{ id: communityId, ... }` but the backend expected `communityId`.
- **Issue 2**: Frontend sends `{ id, joinCommunity: true, userId }` and `{ id, leaveCommunity: true, userId }` but the backend had no join/leave handling — it only updated generic community fields.
- **Fix**:
  - Changed `communityId` extraction: `const communityId = body.communityId || body.id` (accepts both)
  - Added `joinCommunity` handler: validates community exists, checks not already a member, creates `CommunityMember` record, increments `members` count atomically
  - Added `leaveCommunity` handler: validates membership exists, prevents admin from leaving, deletes `CommunityMember` record, decrements `members` count atomically
  - Preserved backward compatibility for admin `communityId` field and `isFeatured` updates

## Test Results
- `GET /api/friend-requests?userId=X&type=pending` → 200 OK
- `POST /api/friend-requests` → 201 Created
- `PUT /api/communities { id, joinCommunity: true, userId }` → 200 OK (member created)
- `PUT /api/communities { id, leaveCommunity: true, userId }` → 200 OK (member removed)
- `PUT /api/communities { communityId, name }` → 200 OK (backward compatible)
- Lint passes with zero errors
