'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Star, ThumbsUp, Laugh, Frown, Flame } from 'lucide-react'

export type ReactionType = 'like' | 'love' | 'wow' | 'haha' | 'sad' | 'angry'

interface Reaction {
  type: ReactionType
  icon: any
  label: string
  color: string
  filledColor: string
}

const reactions: Reaction[] = [
  { type: 'like', icon: ThumbsUp, label: 'Like', color: 'text-gray-500', filledColor: 'text-blue-500 fill-blue-500' },
  { type: 'love', icon: Heart, label: 'Love', color: 'text-gray-500', filledColor: 'text-red-500 fill-red-500' },
  { type: 'wow', icon: Star, label: 'Wow', color: 'text-gray-500', filledColor: 'text-yellow-500 fill-yellow-500' },
  { type: 'haha', icon: Laugh, label: 'Haha', color: 'text-gray-500', filledColor: 'text-yellow-400 fill-yellow-400' },
  { type: 'sad', icon: Frown, label: 'Sad', color: 'text-gray-500', filledColor: 'text-blue-400 fill-blue-400' },
  { type: 'angry', icon: Flame, label: 'Angry', color: 'text-gray-500', filledColor: 'text-orange-500 fill-orange-500' },
]

interface ReactionPickerProps {
  currentReaction: ReactionType | null
  onReact: (type: ReactionType) => void
  onRemoveReaction: () => void
}

export function ReactionPicker({ currentReaction, onReact, onRemoveReaction }: ReactionPickerProps) {
  const [showPicker, setShowPicker] = useState(false)
  const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null)
  const pickerRef = useRef<HTMLDivElement>(null)

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowPicker(false)
      }
    }

    if (showPicker) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showPicker])

  const handleMouseDown = () => {
    const timer = setTimeout(() => {
      setShowPicker(true)
    }, 500) // Long press for 500ms
    setPressTimer(timer)
  }

  const handleMouseUp = () => {
    if (pressTimer) {
      clearTimeout(pressTimer)
      setPressTimer(null)
    }
  }

  const handleReactionClick = (type: ReactionType) => {
    if (currentReaction === type) {
      // If clicking the same reaction, remove it
      onRemoveReaction()
    } else {
      onReact(type)
    }
    setShowPicker(false)
  }

  const currentReactionData = reactions.find(r => r.type === currentReaction)

  return (
    <div className="relative" ref={pickerRef}>
      {/* Reaction Button */}
      <motion.button
        whileTap={{ scale: 0.8 }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleMouseUp}
        onClick={() => {
          // Short tap toggles the current reaction or defaults to "like"
          if (!currentReaction) {
            onReact('like')
          } else {
            onRemoveReaction()
          }
        }}
        className="outline-none"
        aria-label={currentReaction ? `Current: ${currentReactionData?.label}` : 'Like'}
      >
        {currentReactionData ? (
          <currentReactionData.icon
            className={`size-6 transition-colors ${currentReactionData.filledColor}`}
            strokeWidth={0}
          />
        ) : (
          <ThumbsUp className="size-6 text-foreground" strokeWidth={2} />
        )}
      </motion.button>

      {/* Reaction Picker Popup */}
      <AnimatePresence>
        {showPicker && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-2 z-50"
          >
            <div className="flex items-center gap-1">
              {reactions.map((reaction, index) => {
                const isSelected = currentReaction === reaction.type
                return (
                  <motion.button
                    key={reaction.type}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.3, y: -5 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleReactionClick(reaction.type)}
                    className={`relative p-2 rounded-xl transition-colors ${
                      isSelected
                        ? 'bg-gray-100 dark:bg-gray-700'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    title={reaction.label}
                  >
                    <reaction.icon
                      className={`size-7 ${
                        isSelected
                          ? reaction.filledColor
                          : reaction.color
                      }`}
                      strokeWidth={isSelected ? 0 : 2}
                    />
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 size-2 bg-blue-500 rounded-full" />
                    )}
                  </motion.button>
                )
              })}
            </div>

            {/* Picker Arrow */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 w-3 h-3 bg-white dark:bg-gray-800 border-r border-b border-gray-200 dark:border-gray-700" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
