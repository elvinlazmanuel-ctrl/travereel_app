# Task 5: Add Edit/Delete Comments

## Summary
Added PUT handler to /api/comments for editing comments and enhanced CommentSheet with dropdown menu (3-dot) for Edit and Delete actions with Framer Motion animations.

## Files Modified
- `/home/z/my-project/src/app/api/comments/route.ts` — Added PUT handler
- `/home/z/my-project/src/components/feed/CommentSheet.tsx` — Added dropdown menu, inline editing, delete confirmation

## Key Changes
- PUT /api/comments: { commentId, content, authorId } with author verification
- DropdownMenu with MoreHorizontal icon for own comments
- Inline edit with Input field, Save/Cancel, Enter/Escape keyboard shortcuts
- AlertDialog for delete confirmation with cascade warning
- Framer Motion AnimatePresence for smooth edit transitions
