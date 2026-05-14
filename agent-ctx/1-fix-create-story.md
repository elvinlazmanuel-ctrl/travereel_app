# Task 1 - Fix Create Story White Screen

## Summary
Fixed the Create Story white screen issue and added proper story creation API.

## Root Cause
The white screen was caused by **dynamic Tailwind class names** being purged at build time. The component used `bg-gradient-to-br ${gradientColors[selectedColor]}` where `gradientColors` was an array of Tailwind class strings like `from-[#FF6B6B] to-[#FF8C42]`. Since Tailwind can't detect these classes statically, they were stripped from the CSS output, leaving the story preview area with no visible background gradient (just transparent on black).

## Changes Made

### 1. `/src/app/api/stories/route.ts` - Added POST handler
- Accepts `mediaUrl`, `mediaType` (default "image"), `caption` (optional), `authorId`
- Validates required fields
- Sets `expiresAt` to 24 hours from now
- Returns created story with author data (status 201)
- Proper error handling with HTTP status codes

### 2. `/src/components/feed/CreateStory.tsx` - Fixed rendering & added API integration
- Replaced dynamic Tailwind classes with inline `style` objects using CSS `linear-gradient()`
- Now calls `POST /api/stories` instead of simulating with `setTimeout`
- Added error state display
- Added toast notifications (success & failure)
- Calls `addStory` to update store after creation
- Back button navigates to feed

### 3. `/src/lib/store.ts` - Added `addStory` action
- Added `addStory: (story: Story) => void` to interface
- Implemented: `addStory: (story) => set((state) => ({ stories: [story, ...state.stories] }))`

## Verification
- `bun run lint` passed with no errors
