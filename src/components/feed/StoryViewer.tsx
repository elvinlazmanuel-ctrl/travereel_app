'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { useAppStore } from '@/lib/store'

function formatStoryTime(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffHr = Math.floor(diffMs / (1000 * 60 * 60))
  const diffMin = Math.floor(diffMs / (1000 * 60))

  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  return `${Math.floor(diffHr / 24)}d ago`
}

const STORY_DURATION = 5000 // 5 seconds

export default function StoryViewer() {
  const { stories, selectedStoryIndex, setCurrentView, previousView, currentUser, markStoryViewed } = useAppStore()
  const [currentIndex, setCurrentIndex] = useState(selectedStoryIndex)
  const [progress, setProgress] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(0)
  const elapsedRef = useRef<number>(0)
  const viewedStoriesRef = useRef<Set<string>>(new Set())

  const currentStory = stories[currentIndex]

  // Track story views
  useEffect(() => {
    if (!currentStory || !currentUser || viewedStoriesRef.current.has(currentStory.id)) return
    viewedStoriesRef.current.add(currentStory.id)
    fetch('/api/story-views', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUser.id, storyId: currentStory.id }),
    }).then((res) => {
      if (res.ok) {
        markStoryViewed(currentStory.id)
      }
    }).catch(() => {
      // Non-critical
    })
  }, [currentStory, currentUser, markStoryViewed])

  const goNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setProgress(0)
      elapsedRef.current = 0
    } else {
      // Last story, close viewer
      setCurrentView(previousView || 'feed')
    }
  }, [currentIndex, stories.length, setCurrentView, previousView])

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setProgress(0)
      elapsedRef.current = 0
    }
  }, [currentIndex])

  const handleClose = useCallback(() => {
    setCurrentView(previousView || 'feed')
  }, [setCurrentView, previousView])

  // Auto-advance timer
  useEffect(() => {
    if (isPaused || !currentStory) return

    startTimeRef.current = Date.now() - elapsedRef.current

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current
      const newProgress = Math.min((elapsed / STORY_DURATION) * 100, 100)
      setProgress(newProgress)
      elapsedRef.current = elapsed

      if (newProgress >= 100) {
        goNext()
      }
    }, 50)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [currentIndex, isPaused, goNext, currentStory])

  // Pause on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  const handleTapLeft = () => {
    if (progress > 10) {
      // Restart current story
      setProgress(0)
      elapsedRef.current = 0
    } else {
      goPrev()
    }
  }

  const handleTapRight = () => {
    goNext()
  }

  if (!currentStory) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
        <p className="text-white">No stories available</p>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Story image */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStory.id}
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.25 }}
          className="absolute inset-0"
        >
          <img
            src={currentStory.mediaUrl}
            alt={currentStory.caption || 'Story'}
            className="w-full h-full object-cover"
          />
        </motion.div>
      </AnimatePresence>

      {/* Gradient overlays */}
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 to-transparent pointer-events-none z-10" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/60 to-transparent pointer-events-none z-10" />

      {/* Progress bars */}
      <div className="absolute top-3 inset-x-3 z-20 flex gap-1">
        {stories.map((_, i) => (
          <div
            key={i}
            className="h-0.5 flex-1 rounded-full bg-white/30 overflow-hidden"
          >
            <div
              className="h-full bg-white rounded-full transition-all duration-100"
              style={{
                width:
                  i < currentIndex
                    ? '100%'
                    : i === currentIndex
                    ? `${progress}%`
                    : '0%',
              }}
            />
          </div>
        ))}
      </div>

      {/* Header: avatar + username + close */}
      <div className="absolute top-6 inset-x-0 z-20 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Avatar className="size-9 border-2 border-white/50">
            <AvatarImage
              src={currentStory.author.avatar || undefined}
              alt={currentStory.author.username}
            />
            <AvatarFallback className="bg-white/20 text-white text-xs font-semibold backdrop-blur-sm">
              {currentStory.author.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <span className="text-sm font-semibold text-white">
              {currentStory.author.username}
            </span>
            <span className="text-xs text-white/60 ml-2">
              {formatStoryTime(currentStory.createdAt)}
            </span>
          </div>
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleClose}
          className="p-1.5 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors outline-none"
          aria-label="Close story"
        >
          <X className="size-5 text-white" />
        </motion.button>
      </div>

      {/* Caption at bottom */}
      {currentStory.caption && (
        <div className="absolute bottom-8 inset-x-0 z-20 px-6">
          <p className="text-sm text-white font-medium drop-shadow-lg">
            {currentStory.caption}
          </p>
        </div>
      )}

      {/* Tap zones */}
      <div className="absolute inset-0 z-10 flex">
        {/* Left tap zone */}
        <button
          className="w-1/3 h-full outline-none"
          onClick={handleTapLeft}
          onTouchStart={() => {
            setIsPaused(true)
          }}
          onTouchEnd={() => {
            setIsPaused(false)
          }}
          aria-label="Previous story"
        />
        {/* Center tap zone (pause) */}
        <button
          className="w-1/3 h-full outline-none"
          onTouchStart={() => {
            setIsPaused(true)
          }}
          onTouchEnd={() => {
            setIsPaused(false)
          }}
          aria-label="Pause story"
        />
        {/* Right tap zone */}
        <button
          className="w-1/3 h-full outline-none"
          onClick={handleTapRight}
          onTouchStart={() => {
            setIsPaused(true)
          }}
          onTouchEnd={() => {
            setIsPaused(false)
          }}
          aria-label="Next story"
        />
      </div>

      {/* Navigation arrows (desktop) */}
      {currentIndex > 0 && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={goPrev}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors outline-none hidden sm:flex"
          aria-label="Previous story"
        >
          <ChevronLeft className="size-5 text-white" />
        </motion.button>
      )}
      {currentIndex < stories.length - 1 && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={goNext}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors outline-none hidden sm:flex"
          aria-label="Next story"
        >
          <ChevronRight className="size-5 text-white" />
        </motion.button>
      )}
    </div>
  )
}
