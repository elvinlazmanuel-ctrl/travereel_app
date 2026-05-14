'use client'

import { useRef } from 'react'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { useAppStore } from '@/lib/store'

export default function StoryBar() {
  const { stories, currentUser, setSelectedStoryIndex, setCurrentView } = useAppStore()
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleYourStory = () => {
    setCurrentView('create-story')
  }

  const handleStoryClick = (index: number) => {
    setSelectedStoryIndex(index)
    setCurrentView('story-viewer')
  }

  return (
    <div className="w-full border-b border-border bg-card">
      <div
        ref={scrollRef}
        className="flex items-center gap-3 overflow-x-auto px-4 py-3 scrollbar-none"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* Your Story Button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleYourStory}
          className="flex flex-col items-center gap-1 shrink-0 outline-none"
          aria-label="Create your story"
        >
          <div className="relative">
            <Avatar className="size-16 border-2 border-white shadow-sm">
              <AvatarImage
                src={currentUser?.avatar || undefined}
                alt={currentUser?.name || 'You'}
              />
              <AvatarFallback className="bg-gradient-to-br from-[#FF6B6B]/20 to-[#FF8C42]/20 text-[#FF8C42] text-sm font-semibold">
                {currentUser?.name?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            {/* Plus icon */}
            <div className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center size-6 rounded-full bg-gradient-to-br from-[#FF6B6B] to-[#FF8C42] border-2 border-white shadow-sm">
              <Plus className="size-3.5 text-white" strokeWidth={3} />
            </div>
          </div>
          <span className="text-[11px] text-muted-foreground font-medium truncate w-16 text-center">
            Your Story
          </span>
        </motion.button>

        {/* Story circles */}
        {stories.map((story, index) => (
          <motion.button
            key={story.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleStoryClick(index)}
            className="flex flex-col items-center gap-1 shrink-0 outline-none"
            aria-label={`View ${story.author.username}'s story`}
          >
            <div
              className={`p-[2.5px] rounded-full ${
                story.viewed
                  ? 'bg-gray-300'
                  : 'bg-gradient-to-br from-[#FF6B6B] via-[#FF8C42] to-[#FFBA49]'
              }`}
            >
              <div className="p-[2px] rounded-full bg-card">
                <Avatar className="size-14">
                  <AvatarImage
                    src={story.author.avatar || undefined}
                    alt={story.author.username}
                  />
                  <AvatarFallback className="bg-gradient-to-br from-[#FFBA49]/20 to-[#2EC4B6]/20 text-gray-600 text-xs font-semibold">
                    {story.author.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
            <span className="text-[11px] text-muted-foreground font-medium truncate w-16 text-center">
              {story.author.username}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
