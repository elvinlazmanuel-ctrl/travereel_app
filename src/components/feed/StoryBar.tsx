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
    <div className="w-full border-b border-border/50 bg-gradient-to-r from-card via-muted/20 to-card">
      <div
        ref={scrollRef}
        className="flex items-center gap-4 overflow-x-auto px-5 py-4 scrollbar-none snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* Your Story Button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleYourStory}
          className="flex flex-col items-center gap-2 shrink-0 outline-none snap-start group"
          aria-label="Create your story"
        >
          <div className="relative">
            <div className="p-[3px] rounded-full bg-gradient-to-br from-[#FF6B6B] via-[#FF8C42] to-[#FFBA49] group-hover:shadow-lg transition-shadow">
              <div className="p-[2px] rounded-full bg-card">
                <Avatar className="size-16">
                  <AvatarImage
                    src={currentUser?.avatar || undefined}
                    alt={currentUser?.name || 'You'}
                  />
                  <AvatarFallback className="bg-gradient-to-br from-[#FF6B6B]/30 to-[#FF8C42]/30 text-[#FF8C42] text-base font-semibold">
                    {currentUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
            {/* Plus icon */}
            <motion.div 
              whileHover={{ scale: 1.1 }}
              className="absolute -bottom-1 -right-1 flex items-center justify-center size-7 rounded-full bg-gradient-to-br from-[#FF6B6B] to-[#FF8C42] border-2 border-white shadow-md"
            >
              <Plus className="size-4 text-white" strokeWidth={3} />
            </motion.div>
          </div>
          <span className="text-xs text-muted-foreground font-medium truncate w-20 text-center">
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
              className="flex flex-col items-center gap-2 shrink-0 outline-none snap-start group"
              aria-label={`View ${group.author.username}'s stories (${group.stories.length} stories)`}
            >
              <div
                className={`p-[3px] rounded-full transition-all ${
                  group.hasUnviewed
                    ? 'bg-gradient-to-br from-[#FF6B6B] via-[#FF8C42] to-[#FFBA49] group-hover:shadow-lg group-hover:shadow-[#FF6B6B]/20'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <div className="p-[2px] rounded-full bg-card">
                  <Avatar className="size-14">
                    <AvatarImage
                      src={latestStory.author.avatar || undefined}
                      alt={latestStory.author.username}
                    />
                    <AvatarFallback className="bg-gradient-to-br from-[#FFBA49]/30 to-[#2EC4B6]/30 text-gray-600 dark:text-gray-300 text-sm font-semibold">
                      {latestStory.author.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
              <span className="text-xs text-muted-foreground font-medium truncate w-20 text-center">
                {latestStory.author.username}
              </span>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
