# 🎉 Phase 4 Implementation Guide - Social Features

## Overview

This document provides the complete implementation guide for Phase 4 features that have been started and what needs to be completed.

---

## ✅ Feature 1: Expanded Reactions (STARTED)

### What's Done:
- ✅ `ReactionPicker` component created (`src/components/feed/ReactionPicker.tsx`)
- ✅ 6 reaction types: Like, Love, Wow, Haha, Sad, Angry
- ✅ Long-press picker (500ms)
- ✅ Beautiful animations and hover effects
- ✅ Mobile and desktop support
- ✅ Dark mode compatible

### What Needs to Be Done:

#### Step 1: Update PostCard.tsx to use ReactionPicker

**File:** `src/components/feed/PostCard.tsx`

**Add Import:**
```typescript
import { ReactionPicker, type ReactionType } from './ReactionPicker'
```

**Add State (around line 85):**
```typescript
const [userReaction, setUserReaction] = useState<ReactionType | null>(null)
```

**Replace Like Button (around line 505-519):**

**CURRENT:**
```typescript
<motion.button
  whileTap={{ scale: 0.8 }}
  onClick={handleLike}
  className="outline-none"
  aria-label={isLiked ? 'Unlike' : 'Like'}
>
  <Heart
    className={`size-6 transition-colors ${
      isLiked
        ? 'text-[#FF6B6B] fill-[#FF6B6B]'
        : 'text-foreground'
    }`}
    strokeWidth={isLiked ? 0 : 2}
  />
</motion.button>
```

**REPLACE WITH:**
```typescript
<ReactionPicker
  currentReaction={userReaction}
  onReact={(type) => {
    setUserReaction(type)
    handleReaction(type)
  }}
  onRemoveReaction={() => {
    setUserReaction(null)
    handleRemoveReaction()
  }}
/>
```

**Add Handler Functions:**
```typescript
const handleReaction = async (type: ReactionType) => {
  if (!currentUser) return
  
  try {
    const response = await fetch('/api/reactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        postId: post.id,
        userId: currentUser.id,
        type,
      }),
    })
    
    if (response.ok) {
      // Update local state
      console.log(`Reacted with ${type}`)
    }
  } catch (error) {
    console.error('Failed to react:', error)
  }
}

const handleRemoveReaction = async () => {
  if (!currentUser) return
  
  try {
    const response = await fetch(`/api/reactions?postId=${post.id}&userId=${currentUser.id}`, {
      method: 'DELETE',
    })
    
    if (response.ok) {
      console.log('Reaction removed')
    }
  } catch (error) {
    console.error('Failed to remove reaction:', error)
  }
}
```

---

#### Step 2: Update Database Schema

**File:** `prisma/schema.prisma`

**Add Reaction Model:**
```prisma
model Reaction {
  id        String   @id @default(cuid())
  postId    String
  userId    String
  type      String   // like, love, wow, haha, sad, angry
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([postId, userId])
  @@map("reactions")
}
```

**Update User Model:**
```prisma
model User {
  // ... existing fields
  reactions Reaction[]
}
```

**Update Post Model:**
```prisma
model Post {
  // ... existing fields
  reactions Reaction[]
}
```

---

#### Step 3: Create Reactions API Route

**See Feature 3 below for the complete API route.**

---

## ✅ Feature 2: Post Tagging & @Mentions (READY TO START)

### Implementation Plan:

#### Step 1: Update Post Schema

**File:** `prisma/schema.prisma`

```prisma
model Post {
  // ... existing fields
  tags      String?  // JSON array of user IDs tagged
}
```

#### Step 2: Create Mention Parsing Utility

**File:** `src/lib/mentions.ts`

```typescript
export function parseMentions(text: string): string[] {
  const mentionRegex = /@(\w+)/g
  const mentions: string[] = []
  let match
  
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1])
  }
  
  return mentions
}

export function highlightMentions(text: string): React.ReactNode[] {
  const parts = text.split(/(@\w+)/g)
  
  return parts.map((part, index) => {
    if (part.startsWith('@')) {
      return (
        <span key={index} className="text-[#FF6B6B] font-semibold">
          {part}
        </span>
      )
    }
    return part
  })
}
```

#### Step 3: Create Tag Picker Component

**File:** `src/components/feed/TagPicker.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { User } from '@/lib/store/types'

interface TagPickerProps {
  query: string
  onSelect: (user: User) => void
  onClose: () => void
}

export function TagPicker({ query, onSelect, onClose }: TagPickerProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!query) return
    
    const searchUsers = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/search?q=${query}&type=users`)
        if (response.ok) {
          const data = await response.json()
          setUsers(data.users)
        }
      } catch (error) {
        console.error('Failed to search users:', error)
      } finally {
        setLoading(false)
      }
    }

    const timer = setTimeout(searchUsers, 300)
    return () => clearTimeout(timer)
  }, [query])

  if (!query && users.length === 0) return null

  return (
    <div className="absolute z-50 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto">
      {loading ? (
        <div className="p-4 text-center text-sm text-gray-500">Searching...</div>
      ) : users.length === 0 ? (
        <div className="p-4 text-center text-sm text-gray-500">No users found</div>
      ) : (
        users.map((user) => (
          <button
            key={user.id}
            onClick={() => onSelect(user)}
            className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Avatar className="size-8">
              <AvatarImage src={user.avatar || undefined} />
              <AvatarFallback>{user.username?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="text-left">
              <p className="text-sm font-semibold">{user.name}</p>
              <p className="text-xs text-gray-500">@{user.username}</p>
            </div>
          </button>
        ))
      )}
    </div>
  )
}
```

#### Step 4: Update CreatePost Component

**File:** `src/components/feed/CreatePost.tsx`

Add mention support to the textarea/input:
```typescript
const [showTagPicker, setShowTagPicker] = useState(false)
const [mentionQuery, setMentionQuery] = useState('')
const [taggedUsers, setTaggedUsers] = useState<User[]>([])

const handleTextChange = (text: string) => {
  setCaption(text)
  
  // Check for @ mention
  const lastAtIndex = text.lastIndexOf('@')
  if (lastAtIndex !== -1) {
    const afterAt = text.slice(lastAtIndex + 1)
    const spaceIndex = afterAt.indexOf(' ')
    
    if (spaceIndex === -1) {
      setMentionQuery(afterAt)
      setShowTagPicker(true)
    } else {
      setShowTagPicker(false)
    }
  } else {
    setShowTagPicker(false)
  }
}

const handleUserTag = (user: User) => {
  const text = caption.replace(/@\w*$/, `@${user.username} `)
  setCaption(text)
  setTaggedUsers([...taggedUsers, user])
  setShowTagPicker(false)
}
```

---

## ✅ Feature 3: Reactions API Route (READY TO CREATE)

### Create API Route

**File:** `src/app/api/reactions/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST - Add/Update reaction
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { postId, userId, type } = body

    if (!postId || !userId || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate reaction type
    const validTypes = ['like', 'love', 'wow', 'haha', 'sad', 'angry']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid reaction type' },
        { status: 400 }
      )
    }

    // Upsert reaction (create or update)
    const reaction = await (db as any).reaction?.upsert({
      where: {
        postId_userId: { postId, userId },
      },
      update: { type },
      create: {
        postId,
        userId,
        type,
      },
    })

    return NextResponse.json({ success: true, reaction })
  } catch (error) {
    console.error('Error creating reaction:', error)
    return NextResponse.json(
      { error: 'Failed to create reaction' },
      { status: 500 }
    )
  }
}

// DELETE - Remove reaction
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('postId')
    const userId = searchParams.get('userId')

    if (!postId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    await (db as any).reaction?.delete({
      where: {
        postId_userId: { postId, userId },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting reaction:', error)
    return NextResponse.json(
      { error: 'Failed to delete reaction' },
      { status: 500 }
    )
  }
}

// GET - Get reactions for a post
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('postId')

    if (!postId) {
      return NextResponse.json(
        { error: 'Missing postId' },
        { status: 400 }
      )
    }

    const reactions = await (db as any).reaction?.findMany({
      where: { postId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
      },
    })

    // Count reactions by type
    const reactionCounts: Record<string, number> = {}
    reactions?.forEach((r: any) => {
      reactionCounts[r.type] = (reactionCounts[r.type] || 0) + 1
    })

    return NextResponse.json({
      reactions,
      counts: reactionCounts,
      total: reactions?.length || 0,
    })
  } catch (error) {
    console.error('Error fetching reactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reactions' },
      { status: 500 }
    )
  }
}
```

---

## 📋 Implementation Checklist

### Reactions Feature:
- [x] Create ReactionPicker component
- [ ] Update PostCard.tsx to use ReactionPicker
- [ ] Add Reaction model to Prisma schema
- [ ] Run database migration
- [ ] Create `/api/reactions` route
- [ ] Add reaction counts display
- [ ] Update PostCard to show reaction breakdown

### Post Tagging Feature:
- [ ] Add tags field to Post model
- [ ] Create mention parsing utility
- [ ] Create TagPicker component
- [ ] Update CreatePost component
- [ ] Create `/api/mentions` route
- [ ] Send notifications to tagged users
- [ ] Display tagged users on posts

---

## 🚀 Quick Start Commands

```bash
# 1. Run migration (when ready)
npx prisma migrate dev --name add_reactions_and_tags

# 2. Generate Prisma Client
npx prisma generate

# 3. Seed achievements (after migration)
npx tsx prisma/seed-achievements.ts

# 4. Start dev server
npm run dev
```

---

## 📝 Notes

- All features use `as any` type assertion until migration runs
- Components have fallback logic for missing API endpoints
- Dark mode support included
- Mobile-responsive designs
- Accessible UI elements
- All features remain 100% FREE

---

**Status:** Phase 4 is 20% complete (1 of 5 features started)

**Next:** Complete reactions integration, then move to voice messages!
