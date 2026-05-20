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
    <div className="w-full px-4 pt-3 pb-2">
      {/* Glass morphism container for stories */}
      <div className="glass rounded-2xl shadow-glass border border-white/20 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80">
        <div
          ref={scrollRef}
          className="flex items-center gap-3 overflow-x-auto px-4 py-4 scrollbar-none snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* Your Story Button - Enhanced */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleYourStory}
            className="flex flex-col items-center gap-2 shrink-0 outline-none snap-start group"
            aria-label="Create your story"
          >
            <div className="relative">
              {/* Animated gradient ring */}
              <div className="p-[3px] rounded-full bg-gradient-to-br from-[#2F5C9B] via-[#5CA5CD] to-[#E58BEA] group-hover:shadow-lg group-hover:shadow-[#2F5C9B]/40 transition-all hover:scale-105">
                <div className="p-[2px] rounded-full bg-white dark:bg-slate-900">
                  <Avatar className="size-16">
                    <AvatarImage
                      src={currentUser?.avatar || undefined}
                      alt={currentUser?.name || 'You'}
                    />
                    <AvatarFallback className="bg-gradient-to-br from-[#2F5C9B] to-[#5CA5CD] text-white text-base font-semibold">
                      {currentUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
              {/* Plus icon with animation */}
              <motion.div 
                whileHover={{ scale: 1.15, rotate: 90 }}
                className="absolute -bottom-1 -right-1 flex items-center justify-center size-7 rounded-full bg-gradient-to-br from-[#2F5C9B] to-[#5CA5CD] border-2 border-white dark:border-slate-900 shadow-lg"
              >
                <Plus className="size-4 text-white" strokeWidth={3} />
              </motion.div>
            </div>
            <span className="text-xs text-foreground font-semibold truncate w-20 text-center">
              Your Story
            </span>
          </motion.button>

          {/* Story groups - Travel Journal style */}
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
                  className={`p-[3px] rounded-full transition-all hover:scale-105 ${
                    group.hasUnviewed
                      ? 'bg-gradient-to-br from-[#2F5C9B] via-[#5CA5CD] to-[#E58BEA] group-hover:shadow-lg group-hover:shadow-[#2F5C9B]/40'
                      : 'bg-gray-300 dark:bg-gray-600 group-hover:bg-gray-400 dark:group-hover:bg-gray-500'
                  }`}
                >
                  <div className="p-[2px] rounded-full bg-white dark:bg-slate-900">
                    <Avatar className="size-14">
                      <AvatarImage
                        src={latestStory.author.avatar || undefined}
                        alt={latestStory.author.username}
                      />
                      <AvatarFallback className="bg-gradient-to-br from-[#4FACFE] to-[#00F2FE] text-white text-sm font-semibold">
                        {latestStory.author.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>
                <span className="text-xs text-foreground font-medium truncate w-20 text-center group-hover:text-[#2F5C9B] transition-colors">
                  {latestStory.author.username}
                </span>
              </motion.button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
