'use client'

import { useState, useEffect } from 'react'
import { Trophy, Star, Lock, Check, Sparkles, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { motion } from 'framer-motion'

interface Achievement {
  id: string
  slug: string
  title: string
  description: string
  icon: string
  category: 'travel' | 'social' | 'content' | 'milestone'
  requirement: number
}

interface UserAchievement {
  achievement: Achievement
  unlockedAt: string
  progress: number
}

interface AchievementSystemProps {
  userId: string
}

// Default achievements
const defaultAchievements: Achievement[] = [
  // Travel Achievements
  {
    id: '1',
    slug: 'first-trip',
    title: 'First Steps',
    description: 'Create your first itinerary',
    icon: '🎒',
    category: 'travel',
    requirement: 1,
  },
  {
    id: '2',
    slug: 'world-explorer',
    title: 'World Explorer',
    description: 'Visit 5 different countries',
    icon: '🌍',
    category: 'travel',
    requirement: 5,
  },
  {
    id: '3',
    slug: 'globe-trotter',
    title: 'Globe Trotter',
    description: 'Visit 10 different countries',
    icon: '✈️',
    category: 'travel',
    requirement: 10,
  },
  {
    id: '4',
    slug: 'frequent-flyer',
    title: 'Frequent Flyer',
    description: 'Complete 10 trips',
    icon: '🛫',
    category: 'travel',
    requirement: 10,
  },
  {
    id: '5',
    slug: 'long-journey',
    title: 'Long Journey',
    description: 'Complete a trip of 14+ days',
    icon: '🗓️',
    category: 'travel',
    requirement: 14,
  },

  // Social Achievements
  {
    id: '6',
    slug: 'social-butterfly',
    title: 'Social Butterfly',
    description: 'Gain 50 followers',
    icon: '🦋',
    category: 'social',
    requirement: 50,
  },
  {
    id: '7',
    slug: 'influencer',
    title: 'Influencer',
    description: 'Gain 100 followers',
    icon: '⭐',
    category: 'social',
    requirement: 100,
  },
  {
    id: '8',
    slug: 'community-builder',
    title: 'Community Builder',
    description: 'Join 5 communities',
    icon: '👥',
    category: 'social',
    requirement: 5,
  },

  // Content Achievements
  {
    id: '9',
    slug: 'storyteller',
    title: 'Storyteller',
    description: 'Create 25 posts',
    icon: '📝',
    category: 'content',
    requirement: 25,
  },
  {
    id: '10',
    slug: 'photographer',
    title: 'Photographer',
    description: 'Upload 100 photos',
    icon: '📸',
    category: 'content',
    requirement: 100,
  },
  {
    id: '11',
    slug: 'popular-post',
    title: 'Viral Moment',
    description: 'Get 100 likes on a single post',
    icon: '🔥',
    category: 'content',
    requirement: 100,
  },

  // Milestone Achievements
  {
    id: '12',
    slug: 'one-year',
    title: 'One Year Club',
    description: 'Be a member for 1 year',
    icon: '🎉',
    category: 'milestone',
    requirement: 365,
  },
  {
    id: '13',
    slug: 'dedicated-traveler',
    title: 'Dedicated Traveler',
    description: 'Travel for 100 total days',
    icon: '🏆',
    category: 'milestone',
    requirement: 100,
  },
  {
    id: '14',
    slug: 'budget-master',
    title: 'Budget Master',
    description: 'Track $10,000 in travel budget',
    icon: '💰',
    category: 'milestone',
    requirement: 10000,
  },
  {
    id: '15',
    slug: 'legend',
    title: 'Travel Legend',
    description: 'Unlock all other achievements',
    icon: '👑',
    category: 'milestone',
    requirement: 14,
  },
]

export function AchievementSystem({ userId }: AchievementSystemProps) {
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'in-progress'>('all')

  useEffect(() => {
    const fetchAchievements = async () => {
      setLoading(true)
      try {
        // Fetch user's unlocked achievements
        const response = await fetch(`/api/users/${userId}/achievements`)
        if (response.ok) {
          const data = await response.json()
          setUserAchievements(data)
        }
      } catch (error) {
        console.error('Failed to fetch achievements:', error)
        // For demo, show some unlocked
        setUserAchievements([])
      } finally {
        setLoading(false)
      }
    }

    fetchAchievements()
  }, [userId])

  const unlockedIds = new Set(userAchievements.map(ua => ua.achievement.id))
  
  const filteredAchievements = defaultAchievements.filter(achievement => {
    if (filter === 'all') return true
    if (filter === 'unlocked') return unlockedIds.has(achievement.id)
    if (filter === 'in-progress') return !unlockedIds.has(achievement.id)
    return true
  })

  const unlockedCount = userAchievements.length
  const totalCount = defaultAchievements.length
  const progressPercent = (unlockedCount / totalCount) * 100

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'travel': return 'bg-[#FF6B6B]/10 text-[#FF6B6B] border-[#FF6B6B]/20'
      case 'social': return 'bg-[#2EC4B6]/10 text-[#2EC4B6] border-[#2EC4B6]/20'
      case 'content': return 'bg-[#FFBA49]/10 text-[#FFBA49] border-[#FFBA49]/20'
      case 'milestone': return 'bg-[#9B5DE5]/10 text-[#9B5DE5] border-[#9B5DE5]/20'
      default: return 'bg-gray-100 text-gray-600 border-gray-200'
    }
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="size-8 animate-spin text-[#FFBA49] mb-3" />
          <p className="text-sm text-gray-500">Loading achievements...</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Progress */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="inline-flex items-center gap-2 mb-3">
          <Trophy className="size-8 text-[#FFBA49]" />
          <h2 className="text-2xl font-bold text-gray-900">Achievements</h2>
        </div>
        
        <div className="max-w-md mx-auto mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              {unlockedCount} / {totalCount} Unlocked
            </span>
            <span className="text-sm font-bold text-[#FFBA49]">
              {Math.round(progressPercent)}%
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Filter Tabs */}
        <div className="flex justify-center gap-2">
          {(['all', 'unlocked', 'in-progress'] as const).map((filterType) => (
            <button
              key={filterType}
              onClick={() => setFilter(filterType)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === filterType
                  ? 'bg-[#FF6B6B] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {filterType === 'all' && 'All'}
              {filterType === 'unlocked' && 'Unlocked'}
              {filterType === 'in-progress' && 'In Progress'}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAchievements.map((achievement, index) => {
          const isUnlocked = unlockedIds.has(achievement.id)
          const userAch = userAchievements.find(ua => ua.achievement.id === achievement.id)
          const progress = userAch?.progress || 0
          const progressPercent = Math.min((progress / achievement.requirement) * 100, 100)

          return (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                className={`p-4 transition-all ${
                  isUnlocked
                    ? 'border-2 border-[#FFBA49] bg-gradient-to-br from-[#FFBA49]/5 to-transparent'
                    : 'border-gray-200 opacity-75'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div
                    className={`size-12 rounded-xl flex items-center justify-center text-2xl ${
                      isUnlocked
                        ? 'bg-gradient-to-br from-[#FFBA49]/20 to-[#FF6B6B]/20'
                        : 'bg-gray-100 grayscale'
                    }`}
                  >
                    {isUnlocked ? (
                      achievement.icon
                    ) : (
                      <Lock className="size-5 text-gray-400" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-gray-900">
                        {achievement.title}
                      </h3>
                      {isUnlocked && (
                        <Check className="size-4 text-[#FFBA49] shrink-0" />
                      )}
                    </div>

                    <p className="text-xs text-gray-500 mb-2">
                      {achievement.description}
                    </p>

                    {/* Category Badge */}
                    <Badge
                      variant="outline"
                      className={`text-[10px] mb-2 ${getCategoryColor(achievement.category)}`}
                    >
                      {achievement.category}
                    </Badge>

                    {/* Progress Bar */}
                    {!isUnlocked && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-gray-500">Progress</span>
                          <span className="text-[10px] font-medium text-gray-700">
                            {progress} / {achievement.requirement}
                          </span>
                        </div>
                        <Progress value={progressPercent} className="h-1.5" />
                      </div>
                    )}

                    {/* Unlocked Date */}
                    {isUnlocked && userAch && (
                      <p className="text-[10px] text-[#FFBA49] mt-2 flex items-center gap-1">
                        <Sparkles className="size-3" />
                        Unlocked {new Date(userAch.unlockedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {filteredAchievements.length === 0 && (
        <div className="text-center py-12">
          <Star className="size-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">
            No achievements in this category yet. Keep exploring!
          </p>
        </div>
      )}
    </div>
  )
}
