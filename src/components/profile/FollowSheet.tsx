'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UserPlus, UserMinus, Loader2 } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAppStore, type User } from '@/lib/store'
import { toast } from 'sonner'

interface FollowSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  initialTab?: 'followers' | 'following'
}

export default function FollowSheet({ open, onOpenChange, userId, initialTab = 'followers' }: FollowSheetProps) {
  const { currentUser, followingIds, setViewingUser, setCurrentView, toggleFollow } = useAppStore()
  const [activeTab, setActiveTab] = useState<string>(initialTab)
  const [followers, setFollowers] = useState<User[]>([])
  const [following, setFollowing] = useState<User[]>([])
  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [followLoading, setFollowLoading] = useState<string | null>(null)

  useEffect(() => {
    setActiveTab(initialTab)
  }, [initialTab])

  const fetchData = useCallback(async () => {
    if (!userId || !open) return
    setIsLoading(true)
    try {
      const [followersRes, followingRes] = await Promise.all([
        fetch(`/api/follows?userId=${userId}&type=followers`),
        fetch(`/api/follows?userId=${userId}&type=following`),
      ])

      if (followersRes.ok) {
        const data = await followersRes.json()
        setFollowers((data.users || []).map((u: Record<string, unknown>) => ({
          id: u.id as string,
          email: (u.email as string) || '',
          username: u.username as string,
          name: u.name as string,
          avatar: (u.avatar as string) || null,
          bio: (u.bio as string) || null,
          isPrivate: u.isPrivate as boolean,
        })))
        setFollowersCount(data.count || 0)
      }

      if (followingRes.ok) {
        const data = await followingRes.json()
        setFollowing((data.users || []).map((u: Record<string, unknown>) => ({
          id: u.id as string,
          email: (u.email as string) || '',
          username: u.username as string,
          name: u.name as string,
          avatar: (u.avatar as string) || null,
          bio: (u.bio as string) || null,
          isPrivate: u.isPrivate as boolean,
        })))
        setFollowingCount(data.count || 0)
      }
    } catch (err) {
      console.error('Failed to fetch follows:', err)
    } finally {
      setIsLoading(false)
    }
  }, [userId, open])

  useEffect(() => {
    if (open) fetchData()
  }, [open, fetchData])

  const handleFollowToggle = async (targetUser: User) => {
    if (!currentUser) return
    setFollowLoading(targetUser.id)
    const isFollowing = followingIds.includes(targetUser.id)

    try {
      if (isFollowing) {
        const res = await fetch(`/api/follows?followerId=${currentUser.id}&followingId=${targetUser.id}`, { method: 'DELETE' })
        if (res.ok) {
          toggleFollow(targetUser.id)
          toast.success('Unfollowed')
        }
      } else {
        const res = await fetch('/api/follows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ followerId: currentUser.id, followingId: targetUser.id }),
        })
        if (res.ok) {
          toggleFollow(targetUser.id)
          toast.success('Following')
        }
      }
    } catch {
      toast.error('Failed to update follow status')
    } finally {
      setFollowLoading(null)
    }
  }

  const handleUserClick = (user: User) => {
    onOpenChange(false)
    if (currentUser?.id === user.id) {
      setCurrentView('profile')
    } else {
      setViewingUser(user)
      setCurrentView('user-profile')
    }
  }

  const renderUserList = (users: User[]) => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="size-6 text-gray-400 animate-spin" />
        </div>
      )
    }

    if (users.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm text-muted-foreground">No users found</p>
        </div>
      )
    }

    return (
      <div className="space-y-1">
        <AnimatePresence>
          {users.map((user, index) => {
            const isFollowing = followingIds.includes(user.id)
            const isSelf = currentUser?.id === user.id

            return (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <button
                  onClick={() => handleUserClick(user)}
                  className="flex items-center gap-3 flex-1 min-w-0 text-left"
                >
                  <Avatar className="size-10">
                    <AvatarImage src={user.avatar || undefined} alt={user.username} />
                    <AvatarFallback className="bg-gradient-to-br from-[#FF6B6B]/20 to-[#FF8C42]/20 text-[#FF6B6B] text-sm">
                      {user.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{user.username}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.name}</p>
                  </div>
                </button>
                {!isSelf && (
                  <Button
                    size="sm"
                    variant={isFollowing ? 'outline' : 'default'}
                    className={`h-8 rounded-lg text-xs min-w-[80px] ${
                      isFollowing
                        ? 'border-gray-200 text-foreground hover:border-red-300 hover:text-red-500'
                        : 'bg-gradient-to-r from-[#FF6B6B] to-[#FF8C42] text-white hover:opacity-90'
                    }`}
                    onClick={() => handleFollowToggle(user)}
                    disabled={followLoading === user.id}
                  >
                    {followLoading === user.id ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : isFollowing ? (
                      <>
                        <UserMinus className="size-3 mr-1" />
                        Following
                      </>
                    ) : (
                      <>
                        <UserPlus className="size-3 mr-1" />
                        Follow
                      </>
                    )}
                  </Button>
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[70vh] rounded-t-2xl p-0 flex flex-col">
        <SheetHeader className="px-4 pt-4 pb-2">
          <SheetTitle className="text-base">Connections</SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            {followersCount} followers · {followingCount} following
          </SheetDescription>
        </SheetHeader>
        <Separator />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="w-full h-10 bg-transparent border-b border-gray-200 rounded-none p-0 justify-around">
            <TabsTrigger
              value="followers"
              className="flex-1 h-10 rounded-none data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#FF6B6B] data-[state=active]:bg-transparent"
            >
              <span className="text-xs">Followers ({followersCount})</span>
            </TabsTrigger>
            <TabsTrigger
              value="following"
              className="flex-1 h-10 rounded-none data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#FF6B6B] data-[state=active]:bg-transparent"
            >
              <span className="text-xs">Following ({followingCount})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="followers" className="flex-1 overflow-y-auto px-4 py-3 mt-0">
            {renderUserList(followers)}
          </TabsContent>
          <TabsContent value="following" className="flex-1 overflow-y-auto px-4 py-3 mt-0">
            {renderUserList(following)}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
