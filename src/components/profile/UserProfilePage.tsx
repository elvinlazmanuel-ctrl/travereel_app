'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, MessageCircle, Grid3X3, Map, Lock, UserPlus, UserCheck, UserX, Clock, Loader2, FileText, Users, ChevronRight, MoreHorizontal, Ban, VolumeX, ShieldCheck, Volume2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { useAppStore, type Post, type Itinerary, type ChatRoomType } from '@/lib/store'
import { toast } from 'sonner'
import ItineraryCard from '@/components/profile/ItineraryCard'
import FollowSheet from '@/components/profile/FollowSheet'

export default function UserProfilePage() {
  const {
    currentUser,
    viewingUser,
    setCurrentView,
    followingIds,
    toggleFollow,
    setSelectedChatRoom,
    setMessages,
    friendIds,
    addFriendId,
    removeFriendId,
    setPendingFriendRequestCount,
    pendingFriendRequestCount,
    blockedIds,
    mutedIds,
    toggleBlock,
    toggleMute,
  } = useAppStore()

  const [userPosts, setUserPosts] = useState<Post[]>([])
  const [userItineraries, setUserItineraries] = useState<Itinerary[]>([])
  const [isLoadingPosts, setIsLoadingPosts] = useState(true)
  const [isLoadingItineraries, setIsLoadingItineraries] = useState(true)
  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [friendRequestStatus, setFriendRequestStatus] = useState<'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'rejected'>('none')
  const [isFriendActionLoading, setIsFriendActionLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('posts')
  const [showFollowSheet, setShowFollowSheet] = useState(false)
  const [followSheetTab, setFollowSheetTab] = useState<'followers' | 'following'>('followers')
  const [isFollowLoading, setIsFollowLoading] = useState(false)
  const [friends, setFriends] = useState<Array<{ id: string; username: string; name: string; avatar: string | null }>>([])
  const [friendsCount, setFriendsCount] = useState(0)
  const [isLoadingFriends, setIsLoadingFriends] = useState(true)
  const [showBlockDialog, setShowBlockDialog] = useState(false)
  const [blockDialogType, setBlockDialogType] = useState<'block' | 'mute'>('block')
  const [isBlockLoading, setIsBlockLoading] = useState(false)
  const hasFetched = useRef(false)

  const user = viewingUser

  useEffect(() => {
    if (user && !hasFetched.current) {
      hasFetched.current = true
      fetchUserData()
      fetchFriendRequestStatus()
      fetchFriends()
    }
  }, [user])

  const fetchFriendRequestStatus = async () => {
    if (!user || !currentUser) return
    try {
      const res = await fetch(`/api/users/search?q=${user.username}&currentUserId=${currentUser.id}`)
      if (res.ok) {
        const data = await res.json()
        const found = (data.users || []).find((u: { id: string }) => u.id === user.id)
        if (found?.friendRequestStatus) {
          setFriendRequestStatus(found.friendRequestStatus)
        }
      }
    } catch {
      // Non-critical
    }
  }

  const fetchUserData = async () => {
    if (!user) return
    setIsLoadingPosts(true)
    setIsLoadingItineraries(true)

    try {
      const [userRes, postsRes, itinerariesRes] = await Promise.all([
        fetch(`/api/users?id=${user.id}`),
        fetch(`/api/posts?authorId=${user.id}&userId=${currentUser?.id || ''}`),
        fetch(`/api/itineraries?authorId=${user.id}&userId=${currentUser?.id || ''}`),
      ])

      if (userRes.ok) {
        const data = await userRes.json()
        // The users endpoint returns a list, get the first match
        const userData = data.users?.find((u: Record<string, unknown>) => u.id === user.id)
        if (userData) {
          setFollowersCount(userData._count?.followers || 0)
          setFollowingCount(userData._count?.following || 0)
        }
      }

      if (postsRes.ok) {
        const data = await postsRes.json()
        const mapped: Post[] = (data.posts || []).map((p: Record<string, unknown>) => ({
          id: p.id as string,
          caption: (p.caption as string) || null,
          images: Array.isArray(p.images) ? p.images : [],
          isPublic: p.isPublic as boolean,
          isMemory: false,
          location: (p.location as string) || null,
          tags: Array.isArray(p.tags) ? p.tags : [],
          authorId: p.authorId as string,
          author: {
            id: ((p.author as Record<string, unknown>)?.id as string) || (p.authorId as string) || '',
            email: ((p.author as Record<string, unknown>)?.email as string) || '',
            username: ((p.author as Record<string, unknown>)?.username as string) || 'unknown',
            name: ((p.author as Record<string, unknown>)?.name as string) || 'Unknown',
            avatar: ((p.author as Record<string, unknown>)?.avatar as string) || null,
            bio: null,
            isPrivate: false,
          },
          createdAt: p.createdAt as string,
          likes: (p._count as Record<string, number>)?.likes || 0,
          comments: (p._count as Record<string, number>)?.comments || 0,
          isLiked: false,
        }))
        setUserPosts(mapped)
      }

      if (itinerariesRes.ok) {
        const data = await itinerariesRes.json()
        const mapped: Itinerary[] = (data.itineraries || []).map((it: Record<string, unknown>) => ({
          id: it.id as string,
          title: it.title as string,
          country: it.country as string,
          location: it.location as string,
          budget: it.budget as number,
          currency: it.currency as string,
          days: it.days as number,
          travelType: it.travelType as string,
          activities: Array.isArray(it.activities) ? it.activities : [],
          status: it.status as Itinerary['status'],
          isPublic: it.isPublic as boolean,
          requirements: Array.isArray(it.requirements) ? it.requirements : [],
          authorId: it.authorId as string,
          createdAt: it.createdAt as string,
          daysPlan: Array.isArray(it.days_plan) ? it.days_plan : [],
          budgetItems: Array.isArray(it.budget_items) ? it.budget_items : [],
          companions: Array.isArray(it.companions) ? it.companions : [],
        }))
        setUserItineraries(mapped)
      }
    } catch (err) {
      console.error('Failed to fetch user data:', err)
    } finally {
      setIsLoadingPosts(false)
      setIsLoadingItineraries(false)
    }
  }

  const handleBack = () => {
    setCurrentView('feed')
  }

  const handleFollowToggle = async () => {
    if (!user || !currentUser || isFollowLoading) return
    setIsFollowLoading(true)
    const isFollowing = followingIds.includes(user.id)

    try {
      if (isFollowing) {
        const res = await fetch(`/api/follows?followerId=${currentUser.id}&followingId=${user.id}`, {
          method: 'DELETE',
        })
        if (res.ok) {
          toggleFollow(user.id)
          setFollowersCount((c) => Math.max(0, c - 1))
          toast.success(`Unfollowed @${user.username || 'unknown'}`)
        }
      } else {
        const res = await fetch('/api/follows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ followerId: currentUser.id, followingId: user.id }),
        })
        if (res.ok) {
          toggleFollow(user.id)
          setFollowersCount((c) => c + 1)
          toast.success(`Following @${user.username || 'unknown'}`)
        }
      }
    } catch {
      toast.error('Failed to update follow status')
    } finally {
      setIsFollowLoading(false)
    }
  }

  const handleMessage = async () => {
    if (!user || !currentUser) return
    try {
      const res = await fetch(`/api/chat-rooms?userId1=${currentUser.id}&userId2=${user.id}`)
      if (res.ok) {
        const data = await res.json()
        const chatRoom = data.chatRoom
        const room: ChatRoomType = {
          id: chatRoom.id,
          name: chatRoom.name,
          isGroup: chatRoom.isGroup,
          members: chatRoom.members.map((m: Record<string, unknown>) => ({
            id: (m as { userId?: string; user?: { id: string }; id?: string }).userId || (m as { user?: { id: string } }).user?.id || (m as { id: string }).id,
            email: '',
            username: ((m as { user?: { username: string } }).user?.username) || '',
            name: ((m as { user?: { name: string } }).user?.name) || '',
            avatar: ((m as { user?: { avatar: string | null } }).user?.avatar) || null,
            bio: null,
            isPrivate: false,
          })),
        }
        setSelectedChatRoom(room)
        setMessages([])
        setCurrentView('chat-room')
      }
    } catch {
      toast.error('Failed to open chat')
    }
  }

  const handleFollowersClick = () => {
    setFollowSheetTab('followers')
    setShowFollowSheet(true)
  }

  const handleFollowingClick = () => {
    setFollowSheetTab('following')
    setShowFollowSheet(true)
  }

  const handleSendFriendRequest = async () => {
    if (!user || !currentUser) return
    setIsFriendActionLoading(true)
    try {
      const res = await fetch('/api/friend-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId: currentUser.id, receiverId: user.id }),
      })
      const data = await res.json()
      if (res.ok) {
        if (data.autoAccepted) {
          addFriendId(user.id)
          toggleFollow(user.id)
          setFriendRequestStatus('accepted')
          toast.success('You are now friends!')
        } else {
          setFriendRequestStatus('pending_sent')
          toast.success('Friend request sent!')
        }
      } else {
        toast.error(data.error || 'Failed to send friend request')
      }
    } catch {
      toast.error('Failed to send friend request')
    } finally {
      setIsFriendActionLoading(false)
    }
  }

  const handleUnfriend = async () => {
    if (!user || !currentUser) return
    if (!window.confirm(`Remove ${user.username || user.name} from your friends?`)) return
    setIsFriendActionLoading(true)
    try {
      const res = await fetch('/api/friend-requests', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, friendId: user.id }),
      })
      if (res.ok) {
        removeFriendId(user.id)
        toggleFollow(user.id)
        setFriendRequestStatus('none')
        toast.success('Friend removed')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to unfriend')
      }
    } catch {
      toast.error('Failed to unfriend')
    } finally {
      setIsFriendActionLoading(false)
    }
  }

  const handleAcceptFriendRequest = async () => {
    if (!user || !currentUser) return
    setIsFriendActionLoading(true)
    try {
      // Find the pending request from this user
      const res = await fetch(`/api/friend-requests?userId=${currentUser.id}&type=pending`)
      if (res.ok) {
        const data = await res.json()
        const request = (data.requests || []).find((r: { senderId: string }) => r.senderId === user.id)
        if (request) {
          const acceptRes = await fetch('/api/friend-requests', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requestId: request.id, action: 'accept', userId: currentUser.id }),
          })
          if (acceptRes.ok) {
            addFriendId(user.id)
            toggleFollow(user.id)
            setFriendRequestStatus('accepted')
            setPendingFriendRequestCount(Math.max(0, pendingFriendRequestCount - 1))
            toast.success('Friend request accepted!')
          }
        }
      }
    } catch {
      toast.error('Failed to accept friend request')
    } finally {
      setIsFriendActionLoading(false)
    }
  }

  const fetchFriends = async () => {
    if (!user) return
    setIsLoadingFriends(true)
    try {
      const res = await fetch(`/api/friend-requests?userId=${user.id}&type=friends`)
      if (res.ok) {
        const data = await res.json()
        const friendList = (data.friends || []).map((f: { friend: { id: string; username: string; name: string; avatar: string | null } }) => ({
          id: f.friend.id,
          username: f.friend.username,
          name: f.friend.name,
          avatar: f.friend.avatar,
        }))
        setFriends(friendList)
        setFriendsCount(friendList.length)
      }
    } catch {
      // Non-critical
    } finally {
      setIsLoadingFriends(false)
    }
  }

  const handleFriendClick = (friend: { id: string; username: string; name: string; avatar: string | null }) => {
    const store = useAppStore.getState()
    store.setViewingUser({
      id: friend.id,
      username: friend.username,
      name: friend.name,
      avatar: friend.avatar,
      email: '',
      bio: null,
      isPrivate: false,
    })
    store.setCurrentView('user-profile')
  }

  const isFollowing = user ? followingIds.includes(user.id) : false
  const isPrivate = user?.isPrivate && !isFollowing
  const isBlocked = user ? blockedIds.includes(user.id) : false
  const isMuted = user ? mutedIds.includes(user.id) : false
  const displayFriends = friends.slice(0, 8)

  const handleBlockConfirm = async () => {
    if (!user) return
    setIsBlockLoading(true)
    try {
      if (blockDialogType === 'block') {
        toggleBlock(user.id)
        toast.success(`Blocked @${user.username || 'unknown'}`)
      } else {
        toggleMute(user.id)
        toast.success(`Muted @${user.username || 'unknown'}`)
      }
    } finally {
      setIsBlockLoading(false)
      setShowBlockDialog(false)
    }
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground text-sm">User not found</p>
        <Button variant="ghost" onClick={handleBack} className="mt-3">
          Go back
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white">
        <Button
          variant="ghost"
          size="icon"
          className="size-9 rounded-full"
          onClick={handleBack}
        >
          <ArrowLeft className="size-5 text-foreground" />
        </Button>
        <h1 className="text-lg font-semibold text-foreground flex-1">
          {user.username || 'unknown'}
        </h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-9 rounded-full">
              <MoreHorizontal className="size-5 text-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {isBlocked ? (
              <DropdownMenuItem onClick={() => toggleBlock(user.id)} className="text-green-600 focus:text-green-600">
                <ShieldCheck className="size-4 mr-2" />
                Unblock User
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => { setBlockDialogType('block'); setShowBlockDialog(true) }} className="text-red-600 focus:text-red-600">
                <Ban className="size-4 mr-2" />
                Block User
              </DropdownMenuItem>
            )}
            {isMuted ? (
              <DropdownMenuItem onClick={() => toggleMute(user.id)} className="text-green-600 focus:text-green-600">
                <Volume2 className="size-4 mr-2" />
                Unmute User
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => { setBlockDialogType('mute'); setShowBlockDialog(true) }} className="text-amber-600 focus:text-amber-600">
                <VolumeX className="size-4 mr-2" />
                Mute User
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Profile Info */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-5">
          <Avatar className="size-20 border-2 border-[#2EC4B6]/20">
            <AvatarImage
              src={user.avatar || `https://picsum.photos/seed/${user.id}/200/200`}
              alt={user.name || 'User'}
            />
            <AvatarFallback className="bg-gradient-to-br from-[#2EC4B6]/20 to-[#FFBA49]/20 text-lg font-bold text-[#2EC4B6]">
              {(user.name || 'U').charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 flex justify-around">
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">{userPosts.length}</p>
              <p className="text-xs text-muted-foreground">Posts</p>
            </div>
            <button className="text-center outline-none" onClick={handleFollowersClick}>
              <p className="text-lg font-bold text-foreground">{followersCount}</p>
              <p className="text-xs text-muted-foreground">Followers</p>
            </button>
            <button className="text-center outline-none" onClick={handleFollowingClick}>
              <p className="text-lg font-bold text-foreground">{followingCount}</p>
              <p className="text-xs text-muted-foreground">Following</p>
            </button>
          </div>
        </div>

        {/* Name & Bio */}
        <div className="mt-3">
          <h2 className="text-sm font-semibold text-foreground">{user.name || 'Unknown'}</h2>
          {user.bio && <p className="text-sm text-muted-foreground mt-0.5">{user.bio}</p>}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-3">
          {friendRequestStatus === 'accepted' ? (
            <Button
              onClick={handleUnfriend}
              disabled={isFriendActionLoading}
              className="flex-1 h-9 text-sm rounded-lg font-medium bg-[#2EC4B6]/10 text-[#2EC4B6] border border-[#2EC4B6]/20 hover:bg-[#FF6B6B]/10 hover:text-[#FF6B6B] hover:border-[#FF6B6B]/20 transition-colors"
            >
              {isFriendActionLoading ? <Loader2 className="size-4 animate-spin mr-1.5" /> : (
                <>
                  <UserX className="size-4 mr-1.5" />
                  Friends
                </>
              )}
            </Button>
          ) : friendRequestStatus === 'pending_sent' ? (
            <Button
              disabled
              className="flex-1 h-9 text-sm rounded-lg font-medium bg-[#FF8C42]/10 text-[#FF8C42] border border-[#FF8C42]/20"
            >
              <Clock className="size-4 mr-1.5" />
              Request Sent
            </Button>
          ) : friendRequestStatus === 'pending_received' ? (
            <Button
              onClick={handleAcceptFriendRequest}
              disabled={isFriendActionLoading}
              className="flex-1 h-9 text-sm rounded-lg font-medium bg-[#FF6B6B] hover:bg-[#FF6B6B]/90 text-white"
            >
              {isFriendActionLoading ? <Loader2 className="size-4 animate-spin" /> : (
                <>
                  <UserCheck className="size-4 mr-1.5" />
                  Accept Request
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleSendFriendRequest}
              disabled={isFriendActionLoading}
              className="flex-1 h-9 text-sm rounded-lg font-medium bg-[#2EC4B6] hover:bg-[#2EC4B6]/90 text-white"
            >
              {isFriendActionLoading ? <Loader2 className="size-4 animate-spin" /> : (
                <>
                  <UserPlus className="size-4 mr-1.5" />
                  Add Friend
                </>
              )}
            </Button>
          )}
          {!isFollowing && friendRequestStatus !== 'accepted' && (
            <Button
              onClick={handleFollowToggle}
              disabled={isFollowLoading}
              className="flex-1 h-9 text-sm rounded-lg font-medium bg-gray-100 text-foreground hover:bg-gray-200"
            >
              {isFollowLoading ? '...' : 'Follow'}
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleMessage}
            className="flex-1 h-9 text-sm rounded-lg border-gray-200 hover:border-[#2EC4B6] hover:text-[#2EC4B6]"
          >
            <MessageCircle className="size-4 mr-1.5" />
            Message
          </Button>
        </div>
      </div>

      {/* Friends Section */}
      {!isPrivate && (
        <>
          <AnimatePresence>
            {!isLoadingFriends && friendsCount > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="px-4 py-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Users className="size-4 text-[#2EC4B6]" />
                    <h3 className="text-sm font-semibold text-foreground">{friendsCount} Friends</h3>
                  </div>
                </div>
                <div className="flex gap-4 overflow-x-auto scrollbar-none pb-1">
                  {displayFriends.map((friend, index) => (
                    <motion.button
                      key={friend.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      onClick={() => handleFriendClick(friend)}
                      className="flex flex-col items-center gap-1 flex-shrink-0 outline-none group"
                    >
                      <Avatar className="size-14 border-2 border-transparent group-hover:border-[#2EC4B6]/20 transition-colors">
                        <AvatarImage
                          src={friend.avatar || `https://picsum.photos/seed/${friend.id}/100/100`}
                          alt={friend.name}
                        />
                        <AvatarFallback className="bg-gradient-to-br from-[#2EC4B6]/20 to-[#FFBA49]/20 text-xs font-bold text-[#2EC4B6]">
                          {friend.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-[11px] text-gray-600 max-w-[56px] truncate">{friend.username || friend.name}</span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Friends Skeleton */}
          {isLoadingFriends && (
            <div className="px-4 py-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Skeleton className="size-4 rounded" />
                <Skeleton className="h-4 w-20 rounded" />
              </div>
              <div className="flex gap-4 overflow-hidden">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex flex-col items-center gap-1 flex-shrink-0">
                    <Skeleton className="size-14 rounded-full" />
                    <Skeleton className="h-3 w-10 rounded" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Blocked Account State */}
      {isBlocked ? (
        <BlockedAccountState />
      ) : isPrivate ? (
        <PrivateAccountState />
      ) : (
        /* Tab Bar */
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full h-11 bg-transparent border-b border-gray-200 rounded-none p-0 justify-around">
            <TabsTrigger
              value="posts"
              className="flex-1 h-11 rounded-none data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#2EC4B6] data-[state=active]:bg-transparent px-0 gap-1.5"
            >
              <Grid3X3 className="size-4" />
              <span className="text-xs">Posts</span>
            </TabsTrigger>
            <TabsTrigger
              value="itineraries"
              className="flex-1 h-11 rounded-none data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#2EC4B6] data-[state=active]:bg-transparent px-0 gap-1.5"
            >
              <Map className="size-4" />
              <span className="text-xs">Itineraries</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-0">
            {isLoadingPosts ? (
              <PostsSkeleton />
            ) : userPosts.length === 0 ? (
              <EmptyPostsState />
            ) : (
              <div className="grid grid-cols-3 gap-0.5">
                {userPosts.map((post, index) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, delay: index * 0.03 }}
                    className="relative aspect-square overflow-hidden cursor-pointer group"
                  >
                    {post.images && post.images.length > 0 ? (
                      <img
                        src={post.images[0]}
                        alt={post.caption || 'Post'}
                        className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#FFF5F0] via-[#FFF0E5] to-[#E8FAF8] dark:from-[#2a1f1a] dark:via-[#2a2218] dark:to-[#1a2a28] flex flex-col items-center justify-center gap-1 p-2">
                        <FileText className="size-6 text-[#FF8C42]/60" />
                        {post.caption && (
                          <p className="text-[10px] text-muted-foreground text-center leading-tight line-clamp-3">
                            {post.caption.slice(0, 60)}{post.caption.length > 60 ? '...' : ''}
                          </p>
                        )}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">❤ {post.likes}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="itineraries" className="mt-0 px-4 py-4">
            {isLoadingItineraries ? (
              <ItinerariesSkeleton />
            ) : userItineraries.length === 0 ? (
              <EmptyItinerariesState />
            ) : (
              <div className="flex flex-col gap-3">
                {userItineraries.map((itinerary, index) => (
                  <ItineraryCard
                    key={itinerary.id}
                    itinerary={itinerary}
                    index={index}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Follow Sheet */}
      {user && (
        <FollowSheet
          open={showFollowSheet}
          onOpenChange={setShowFollowSheet}
          userId={user.id}
          initialTab={followSheetTab}
        />
      )}

      {/* Block/Mute Confirmation Dialog */}
      <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {blockDialogType === 'block' ? 'Block User' : 'Mute User'}
            </DialogTitle>
            <DialogDescription>
              {blockDialogType === 'block'
                ? `Blocking @${user?.username || 'this user'} will remove them from your followers and hide their content. They won't be notified.`
                : `Muting @${user?.username || 'this user'} will hide their posts from your feed. They won't be notified.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowBlockDialog(false)}
              className="rounded-lg"
            >
              Cancel
            </Button>
            <Button
              onClick={handleBlockConfirm}
              disabled={isBlockLoading}
              className={`rounded-lg text-white ${
                blockDialogType === 'block'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              {isBlockLoading ? (
                <Loader2 className="size-4 animate-spin mr-1.5" />
              ) : blockDialogType === 'block' ? (
                <Ban className="size-4 mr-1.5" />
              ) : (
                <VolumeX className="size-4 mr-1.5" />
              )}
              {blockDialogType === 'block' ? 'Block' : 'Mute'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function BlockedAccountState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center px-6">
      <div className="size-16 rounded-full bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center mb-4">
        <Ban className="size-7 text-red-500" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">
        You blocked this account
      </h3>
      <p className="text-sm text-muted-foreground max-w-[250px]">
        Unblock to see their posts and itineraries again.
      </p>
    </div>
  )
}

function PrivateAccountState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center px-6">
      <div className="size-16 rounded-full bg-gradient-to-br from-[#2EC4B6]/10 to-[#FFBA49]/10 flex items-center justify-center mb-4">
        <Lock className="size-7 text-[#2EC4B6]" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">
        This account is private
      </h3>
      <p className="text-sm text-muted-foreground max-w-[250px]">
        Follow this account to see their posts and itineraries.
      </p>
    </div>
  )
}

function PostsSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-0.5">
      {Array.from({ length: 9 }).map((_, i) => (
        <Skeleton key={i} className="aspect-square rounded-none" />
      ))}
    </div>
  )
}

function ItinerariesSkeleton() {
  return (
    <div className="flex flex-col gap-3 py-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-20 rounded-xl" />
      ))}
    </div>
  )
}

function EmptyPostsState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-6">
      <div className="size-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <Grid3X3 className="size-7 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">No Posts Yet</h3>
      <p className="text-sm text-muted-foreground max-w-[240px]">
        This traveler hasn&apos;t shared any posts yet.
      </p>
    </div>
  )
}

function EmptyItinerariesState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-6">
      <div className="size-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <Map className="size-7 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">No Itineraries Yet</h3>
      <p className="text-sm text-muted-foreground max-w-[240px]">
        This traveler hasn&apos;t planned any trips yet.
      </p>
    </div>
  )
}
