'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Sparkles, Map, Award, TrendingUp } from 'lucide-react'
import { YearInReview } from '@/components/itinerary/YearInReview'
import { TravelStatsDashboard } from '@/components/itinerary/TravelStatsDashboard'
import { AchievementSystem } from '@/components/itinerary/AchievementSystem'

interface TravelInsightsProps {
  userId: string
}

export function TravelInsightsSection({ userId }: TravelInsightsProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeInsight, setActiveInsight] = useState<'overview' | 'year' | 'stats' | 'achievements'>('overview')

  return (
    <div className="px-4 py-4 border-b border-border">
      {/* Collapsible Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between group"
      >
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-gradient-to-br from-[#FF6B6B] via-[#FF8C42] to-[#FFBA49] flex items-center justify-center">
            <Sparkles className="size-5 text-white" />
          </div>
          <div className="text-left">
            <h3 className="text-base font-bold text-foreground">Your Travel Insights</h3>
            <p className="text-xs text-muted-foreground">
              {isExpanded ? 'Tap to collapse' : 'Tap to explore your journey'}
            </p>
          </div>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="size-6 rounded-full bg-muted flex items-center justify-center group-hover:bg-muted/80"
        >
          <ChevronDown className="size-4 text-muted-foreground" />
        </motion.div>
      </button>

      {/* Expandable Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pt-4 space-y-4">
              {/* Insight Type Tabs */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <button
                  onClick={() => setActiveInsight('overview')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    activeInsight === 'overview'
                      ? 'bg-gradient-to-r from-[#FF6B6B] to-[#FF8C42] text-white shadow-md'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  <TrendingUp className="size-4" />
                  Overview
                </button>
                <button
                  onClick={() => setActiveInsight('year')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    activeInsight === 'year'
                      ? 'bg-gradient-to-r from-[#FF6B6B] to-[#FF8C42] text-white shadow-md'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  <Sparkles className="size-4" />
                  Year in Review
                </button>
                <button
                  onClick={() => setActiveInsight('stats')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    activeInsight === 'stats'
                      ? 'bg-gradient-to-r from-[#FF6B6B] to-[#FF8C42] text-white shadow-md'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  <Map className="size-4" />
                  Travel Stats
                </button>
                <button
                  onClick={() => setActiveInsight('achievements')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    activeInsight === 'achievements'
                      ? 'bg-gradient-to-r from-[#FF6B6B] to-[#FF8C42] text-white shadow-md'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  <Award className="size-4" />
                  Achievements
                </button>
              </div>

              {/* Insight Content */}
              <div className="min-h-[400px]">
                {activeInsight === 'overview' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-3"
                  >
                    {/* Quick Stats Cards */}
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setActiveInsight('stats')}
                        className="p-4 rounded-xl bg-gradient-to-br from-[#FF6B6B]/10 to-[#FF8C42]/10 border border-[#FF6B6B]/20 hover:border-[#FF6B6B]/40 transition-colors text-left"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="size-8 rounded-lg bg-gradient-to-br from-[#FF6B6B] to-[#FF8C42] flex items-center justify-center">
                            <Map className="size-4 text-white" />
                          </div>
                          <span className="text-sm font-semibold text-foreground">Travel Stats</span>
                        </div>
                        <p className="text-xs text-muted-foreground">View your travel journey</p>
                      </button>

                      <button
                        onClick={() => setActiveInsight('achievements')}
                        className="p-4 rounded-xl bg-gradient-to-br from-[#FFBA49]/10 to-[#FFD700]/10 border border-[#FFBA49]/20 hover:border-[#FFBA49]/40 transition-colors text-left"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="size-8 rounded-lg bg-gradient-to-br from-[#FFBA49] to-[#FFD700] flex items-center justify-center">
                            <span className="text-lg">🏆</span>
                          </div>
                          <span className="text-sm font-semibold text-foreground">Achievements</span>
                        </div>
                        <p className="text-xs text-muted-foreground">See your badges</p>
                      </button>
                    </div>

                    <button
                      onClick={() => setActiveInsight('year')}
                      className="w-full p-4 rounded-xl bg-gradient-to-br from-[#2EC4B6]/10 to-[#16B5A8]/10 border border-[#2EC4B6]/20 hover:border-[#2EC4B6]/40 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="size-8 rounded-lg bg-gradient-to-br from-[#2EC4B6] to-[#16B5A8] flex items-center justify-center">
                          <Sparkles className="size-4 text-white" />
                        </div>
                        <span className="text-sm font-semibold text-foreground">Year in Review</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Relive your {new Date().getFullYear()} travels</p>
                    </button>
                  </motion.div>
                )}

                {activeInsight === 'year' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <YearInReview userId={userId} year={new Date().getFullYear()} />
                  </motion.div>
                )}

                {activeInsight === 'stats' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <TravelStatsDashboard userId={userId} />
                  </motion.div>
                )}

                {activeInsight === 'achievements' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <AchievementSystem userId={userId} />
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
