# Task 5-6: Fix text-only posts + Add Edit/Delete Post

## Summary
Fixed text-only posts showing photo placeholders and added Edit/Delete post functionality.

## Changes Made

### Files Modified
1. **PostCard.tsx** - Text-only gradient layout, Edit dialog, Delete confirmation dialog, restructured dropdown menu
2. **CreatePost.tsx** - Enhanced upload area with clear "text only" option
3. **UserProfilePage.tsx** - Text icon placeholder for imageless posts
4. **ProfilePage.tsx** - Text icon placeholder for imageless posts
5. **/api/posts/route.ts** - DELETE with author verification + body param support, PUT with author verification + postId support
6. **store.ts** - Added deletePost and updatePost actions

### Key Decisions
- Text-only posts use a warm gradient background (matching the CreatePost upload area aesthetic)
- AlertDialog used for delete confirmation (native confirm avoided)
- Edit uses a Dialog with textarea for caption, input for location, and input for tags
- DELETE API reads from both query params and body for maximum compatibility
- deletePost action also cleans bookmarks and likedPostIds arrays (unlike removePost)
- PUT API supports both `id` and `postId` field names for backwards compatibility
