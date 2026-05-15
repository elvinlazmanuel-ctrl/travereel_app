'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Search, Users, X, UserPlus, Globe, Mountain, Utensils, Camera, Laptop, PiggyBank, Plus, TrendingUp, Sparkles, ChevronRight, Flame } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { useAppStore, type CommunityType } from '@/lib/store'
import CreateCommunityDialog from './CreateCommunityDialog'
import { toast } from 'sonner'

const communityCategories = ['All', 'travel-style', 'budget', 'adventure', 'food', 'photography', 'remote-work']

const categoryLabels: Record<string, string> = {
  'travel-style': 'Travel Style',
  budget: 'Budget',
  adventure: 'Adventure',
  food: 'Food',
  photography: 'Photography',
  'remote-work': 'Remote Work',
}

const categoryIcons: Record<string, typeof Globe> = {
  'travel-style': Globe,
  budget: PiggyBank,
  adventure: Mountain,
  food: Utensils,
  photography: Camera,
  'remote-work': Laptop,
}

function formatMembers(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`
  }
  return String(count)
}

// Trending = sorted by member count
function getTrendingCommunities(communities: CommunityType[]): CommunityType[] {
  return [...communities].sort((a, b) => b.members - a.members).slice(0, 6)
}

// Suggested = communities user hasn't joined
function getSuggestedCommunities(communities: CommunityType[], joinedIds: string[]): CommunityType[] {
  return communities.filter((c) => !joinedIds.includes(c.id)).slice(0, 4)
}

export default function CommunityPage() {
  const {
    currentUser,
    communities,
    setCommunities,
    joinedCommunityIds,
    setJoinedCommunityIds,
    joinCommunity,
    leaveCommunity,
    setSelectedCommunity,
    setCurrentView,
  } = useAppStore()

  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const myCommunities = communities.filter((c) => joinedCommunityIds.includes(c.id))

  const fetchCommunities = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/communities')
      if (res.ok) {
        const data = await res.json()
        const mapped: CommunityType[] = data.communities.map((c: Record<string, unknown>) => ({
          id: c.id as string,
          name: c.name as string,
          description: (c.description as string) || null,
          image: (c.image as string) || null,
          members: (c.members as number) || 0,
          category: (c.category as string) || null,
          isMember: (c.isMember as boolean) || false,
        }))
        setCommunities(mapped)

        // Also fetch joined community IDs for current user
        if (currentUser) {
          const memberRes = await fetch(`/api/communities?userId=${currentUser.id}`)
          if (memberRes.ok) {
            const memberData = await memberRes.json()
            const joinedIds = (memberData.communities || [])
              .filter((c: { isMember: boolean }) => c.isMember)
              .map((c: { id: string }) => c.id)
            if (joinedIds.length > 0) {
              setJoinedCommunityIds(joinedIds)
            } else if (mapped.length >= 2 && joinedCommunityIds.length === 0) {
              setJoinedCommunityIds([mapped[0].id, mapped[1].id])
            }
          }
        } else if (mapped.length >= 2 && joinedCommunityIds.length === 0) {
          setJoinedCommunityIds([mapped[0].id, mapped[1].id])
        }
      }
    } catch (err) {
      console.error('Failed to fetch communities:', err)
    } finally {
      setIsLoading(false)
    }
  }, [setCommunities, setJoinedCommunityIds, currentUser, joinedCommunityIds.length])

  useEffect(() => {
    if (communities.length === 0) {
      fetchCommunities()
    } else {
      setIsLoading(false)
    }
  }, [communities.length, fetchCommunities])

  // Filter discover communities
  const discoverCommunities = communities.filter((c) => {
    const matchesCategory =
      selectedCategory === 'All' || c.category === selectedCategory

    const matchesSearch =
      !searchQuery ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesCategory && matchesSearch
  })

  const handleCommunityClick = (community: CommunityType) => {
    setSelectedCommunity(community)
    setCurrentView('community-detail')
  }

  const handleJoinClick = async (communityId: string) => {
    if (!currentUser) return
    joinCommunity(communityId)
    try {
      await fetch('/api/communities', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: communityId, joinCommunity: true, userId: currentUser.id }),
      })
      toast.success('Joined community!')
    } catch {
      // Revert on error
      leaveCommunity(communityId)
      toast.error('Failed to join community')
    }
  }

  const handleJoinedClick = (community: CommunityType) => {
    setSelectedCommunity(community)
    setCurrentView('community-detail')
  }

  const trendingCommunities = getTrendingCommunities(communities)
  const suggestedCommunities = getSuggestedCommunities(communities, joinedCommunityIds)

  return (
    <div className="max-w-md mx-auto">
      {/* Search Bar */}
      <div className="px-4 pt-3 pb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <Input
            placeholder="Search communities..."
            className="pl-9 h-9 bg-gray-100 border-0 rounded-lg text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="size-3.5 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Category Filter */}
      <div className="px-4 pb-3">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {communityCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                selectedCategory === cat
                  ? 'bg-[#2EC4B6] text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat === 'All' ? 'All' : categoryLabels[cat] || cat}
            </button>
          ))}
        </div>
      </div>

      {/* My Communities Section */}
      <div className="mb-4">
        <div className="flex items-center justify-between px-4 mb-2">
          <h3 className="text-sm font-semibold text-foreground">My Communities</h3>
          <button
            onClick={() => setShowCreateDialog(true)}
            className="flex items-center gap-1 text-xs font-medium text-[#2EC4B6] hover:text-[#2EC4B6]/80 transition-colors"
          >
            <Plus className="size-3.5" />
            Create
          </button>
        </div>

        {isLoading ? (
          <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 flex flex-col items-center gap-1.5">
                <Skeleton className="size-16 rounded-full" />
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>
        ) : myCommunities.length > 0 ? (
          <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-2">
            {myCommunities.map((community, index) => (
              <motion.div
                key={community.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="flex-shrink-0 w-24 flex flex-col items-center gap-1.5 cursor-pointer group"
                onClick={() => handleCommunityClick(community)}
              >
                <div className="size-16 rounded-full overflow-hidden border-2 border-[#2EC4B6]/30 group-hover:border-[#2EC4B6]/60 transition-colors">
                  <img
                    src={community.image || `https://picsum.photos/seed/${community.id}/200/200`}
                    alt={community.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-[11px] font-medium text-foreground text-center leading-tight line-clamp-2 group-hover:text-[#2EC4B6] transition-colors">
                  {community.name}
                </span>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="px-4 py-4 text-center">
            <p className="text-xs text-gray-400 mb-2">No communities joined yet</p>
            <Button
              size="sm"
              className="h-7 text-xs rounded-lg bg-[#2EC4B6] hover:bg-[#2EC4B6]/90 text-white"
              onClick={() => setShowCreateDialog(true)}
            >
              <Plus className="size-3 mr-1" />
              Create One
            </Button>
          </div>
        )}
      </div>

      {/* Trending Communities */}
      {!searchQuery && trendingCommunities.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center gap-2 px-4 mb-3">
            <Flame className="size-4 text-[#FF8C42]" />
            <h3 className="text-sm font-semibold text-foreground">Trending</h3>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-2">
            {trendingCommunities.map((community, index) => {
              const isJoined = joinedCommunityIds.includes(community.id)
              return (
                <motion.div
                  key={community.id}
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.06 }}
                  className="flex-shrink-0 w-44 bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleCommunityClick(community)}
                >
                  <div className="relative h-20 overflow-hidden">
                    <img
                      src={community.image || `https://picsum.photos/seed/${community.id}/400/200`}
                      alt={community.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <div className="absolute bottom-1.5 left-2 flex items-center gap-1">
                      <TrendingUp className="size-3 text-[#FF8C42]" />
                      <span className="text-[10px] text-white/90 font-medium">
                        {formatMembers(community.members)}
                      </span>
                    </div>
                  </div>
                  <div className="p-2.5">
                    <h4 className="text-xs font-semibold text-foreground truncate">
                      {community.name}
                    </h4>
                    {community.category && (
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {categoryLabels[community.category]}
                      </p>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      {/* Suggested for You */}
      {!searchQuery && suggestedCommunities.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center gap-2 px-4 mb-3">
            <Sparkles className="size-4 text-[#FFBA49]" />
            <h3 className="text-sm font-semibold text-foreground">Suggested for You</h3>
          </div>
          <div className="px-4 space-y-2">
            {suggestedCommunities.map((community, index) => {
              const CategoryIcon = (community.category && categoryIcons[community.category]) || Users
              return (
                <motion.div
                  key={community.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.06 }}
                  className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleCommunityClick(community)}
                >
                  <div className="size-12 rounded-xl overflow-hidden flex-shrink-0">
                    <img
                      src={community.image || `https://picsum.photos/seed/${community.id}/200/200`}
                      alt={community.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-foreground truncate">{community.name}</h4>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Users className="size-3 text-gray-400" />
                      <span className="text-xs text-muted-foreground">{formatMembers(community.members)} members</span>
                      {community.category && (
                        <>
                          <span className="text-gray-300">·</span>
                          <CategoryIcon className="size-3 text-gray-400" />
                          <span className="text-xs text-gray-400">{categoryLabels[community.category]}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="h-7 px-3 text-xs rounded-lg bg-[#2EC4B6] hover:bg-[#2EC4B6]/90 text-white flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleJoinClick(community.id)
                    }}
                  >
                    <UserPlus className="size-3 mr-1" />
                    Join
                  </Button>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      {/* Discover Communities */}
      <div className="px-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Discover Communities</h3>

        {isLoading ? (
          <CommunityGridSkeleton />
        ) : discoverCommunities.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-2 gap-3 pb-4">
            {discoverCommunities.map((community, index) => {
              const isJoined = joinedCommunityIds.includes(community.id)
              const CategoryIcon = (community.category && categoryIcons[community.category]) || Users

              return (
                <motion.div
                  key={community.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.04 }}
                  className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Banner Image */}
                  <div
                    className="relative h-24 overflow-hidden cursor-pointer"
                    onClick={() => handleCommunityClick(community)}
                  >
                    <img
                      src={community.image || `https://picsum.photos/seed/${community.id}/400/200`}
                      alt={community.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    {/* Category badge */}
                    {community.category && (
                      <div className="absolute top-2 left-2">
                        <Badge className="bg-white/90 text-foreground border-0 text-[10px] px-1.5 py-0 h-5 gap-1">
                          <CategoryIcon className="size-3" />
                          {categoryLabels[community.category] || community.category}
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-3">
                    <h4
                      className="text-sm font-semibold text-foreground truncate cursor-pointer hover:text-[#2EC4B6] transition-colors"
                      onClick={() => handleCommunityClick(community)}
                    >
                      {community.name}
                    </h4>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Users className="size-3 text-gray-400" />
                      <span className="text-xs text-muted-foreground">
                        {formatMembers(community.members)} members
                      </span>
                    </div>
                    {community.description && (
                      <p className="text-[11px] text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
                        {community.description}
                      </p>
                    )}
                    <Button
                      size="sm"
                      className={`w-full mt-2.5 h-7 text-xs rounded-lg transition-all ${
                        isJoined
                          ? 'bg-gray-100 text-foreground hover:bg-gray-200 border border-gray-200'
                          : 'bg-[#2EC4B6] hover:bg-[#2EC4B6]/90 text-white'
                      }`}
                      onClick={() => {
                        if (isJoined) {
                          handleJoinedClick(community)
                        } else {
                          handleJoinClick(community.id)
                        }
                      }}
                    >
                      {isJoined ? (
                        <>
                          <ChevronRight className="size-3 mr-0.5" />
                          Joined
                        </>
                      ) : (
                        <>
                          <UserPlus className="size-3 mr-1" />
                          Join
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Create Community Dialog */}
      <CreateCommunityDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  )
}

function CommunityGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 pb-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <Skeleton className="h-24 rounded-none" />
          <div className="p-3 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-7 w-full rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-6">
      <div className="size-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <Users className="size-7 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">No communities found</h3>
      <p className="text-sm text-muted-foreground max-w-[240px]">
        Try a different search or category to find communities.
      </p>
    </div>
  )
}
