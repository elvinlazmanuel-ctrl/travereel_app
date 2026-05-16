'use client'

import { useRef, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { useAppStore, type StoryGroup } from '@/lib/store'

export default function StoryBar() {
  const { stories, currentUser, setSelectedStoryIndex, setCurrentView } = useAppStore()
  const scrollRef = useRef<HTMLDivElement>(null)

  // Group stories by user
  const storyGroups: StoryGroup[] = useMemo(() => {
    const groupsMap = new Map<string, StoryGroup>()
    
    stories.forEach(story => {
      const authorId = story.authorId
      if (!groupsMap.has(authorId)) {
        groupsMap.set(authorId, {
          author: story.author,
          stories: [],
          hasUnviewed: false,
        })
      }
      
      const group = groupsMap.get(authorId)!
      group.stories.push(story)
      
      // If any story is unviewed, mark the group as having unviewed content
      if (!story.viewed) {
        group.hasUnviewed = true
      }
    })
    
    return Array.from(groupsMap.values())
  }, [stories])

  const handleYourStory = () => {
    setCurrentView('create-story')
  }

  const handleStoryGroupClick = (startIndex: number) => {
    setSelectedStoryIndex(startIndex)
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

        {/* Story groups - one indicator per user */}
        {storyGroups.map((group, groupIndex) => {
          // Find the starting index of this group's first story in the original stories array
          const startIndex = stories.findIndex(s => s.authorId === group.author.id)
          const latestStory = group.stories[0] // Most recent story
          
          return (
            <motion.button
              key={group.author.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleStoryGroupClick(startIndex)}
              className="flex flex-col items-center gap-1 shrink-0 outline-none"
              aria-label={`View ${group.author.username}'s stories (${group.stories.length} stories)`}
            >
              <div
                className={`p-[2.5px] rounded-full ${
                  group.hasUnviewed
                    ? 'bg-gradient-to-br from-[#FF6B6B] via-[#FF8C42] to-[#FFBA49]'
                    : 'bg-gray-300'
                }`}
              >
                <div className="p-[2px] rounded-full bg-card">
                  <Avatar className="size-14">
                    <AvatarImage
                      src={latestStory.author.avatar || undefined}
                      alt={latestStory.author.username}
                    />
                    <AvatarFallback className="bg-gradient-to-br from-[#FFBA49]/20 to-[#2EC4B6]/20 text-gray-600 text-xs font-semibold">
                      {latestStory.author.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
              <span className="text-[11px] text-muted-foreground font-medium truncate w-16 text-center">
                {latestStory.author.username}
              </span>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
