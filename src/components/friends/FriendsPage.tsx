'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  UserPlus,
  UserCheck,
  UserX,
  Clock,
  Users,
  Loader2,
  X,
  Check,
  MessageCircle,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore, type FriendRequestType, type SearchUserType, type ChatRoomType } from '@/lib/store'
import { toast } from 'sonner'

export default function FriendsPage() {
  const {
    currentUser,
    setCurrentView,
    setViewingUser,
    addFriendId,
    removeFriendId,
    setPendingFriendRequestCount,
    pendingFriendRequestCount,
    friendIds,
    setFriendIds,
    followingIds,
    toggleFollow,
    setSelectedChatRoom,
    setMessages,
  } = useAppStore()

  const [activeTab, setActiveTab] = useState('search')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchUserType[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [pendingRequests, setPendingRequests] = useState<FriendRequestType[]>([])
  const [sentRequests, setSentRequests] = useState<FriendRequestType[]>([])
  const [friends, setFriends] = useState<FriendRequestType[]>([])
  const [isLoadingRequests, setIsLoadingRequests] = useState(false)
  const [isLoadingFriends, setIsLoadingFriends] = useState(false)
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hasFetched = useRef(false)

  // Fetch friend requests on mount
  useEffect(() => {
    if (currentUser && !hasFetched.current) {
      hasFetched.current = true
      fetchFriendRequests()
      fetchFriends()
    }
  }, [currentUser])

  const fetchFriendRequests = async () => {
    if (!currentUser) return
    setIsLoadingRequests(true)
    try {
      const [pendingRes, sentRes] = await Promise.all([
        fetch(`/api/friend-requests?userId=${currentUser.id}&type=pending`),
        fetch(`/api/friend-requests?userId=${currentUser.id}&type=sent`),
      ])

      if (pendingRes.ok) {
        const data = await pendingRes.json()
        setPendingRequests(data.requests || [])
        setPendingFriendRequestCount(data.requests?.length || 0)
      }

      if (sentRes.ok) {
        const data = await sentRes.json()
        setSentRequests(data.requests || [])
      }
    } catch (err) {
      console.error('Failed to fetch friend requests:', err)
    } finally {
      setIsLoadingRequests(false)
    }
  }

  const fetchFriends = async () => {
    if (!currentUser) return
    setIsLoadingFriends(true)
    try {
      const res = await fetch(`/api/friend-requests?userId=${currentUser.id}&type=friends`)
      if (res.ok) {
        const data = await res.json()
        setFriends(data.friends || [])
        setFriendIds((data.friends || []).map((f: FriendRequestType) => f.friend?.id || f.senderId))
      }
    } catch (err) {
      console.error('Failed to fetch friends:', err)
    } finally {
      setIsLoadingFriends(false)
    }
  }

  // Debounced search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (!query.trim()) {
      setSearchResults([])
      return
    }

    searchTimeoutRef.current = setTimeout(async () => {
      if (!currentUser) return
      setIsSearching(true)
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(query.trim())}&currentUserId=${currentUser.id}`)
        if (res.ok) {
          const data = await res.json()
          setSearchResults(data.users || [])
        }
      } catch (err) {
        console.error('Search failed:', err)
      } finally {
        setIsSearching(false)
      }
    }, 300)
  }, [currentUser])

  const sendFriendRequest = async (receiverId: string) => {
    if (!currentUser) return
    setActionLoading((prev) => ({ ...prev, [receiverId]: true }))
    try {
      const res = await fetch('/api/friend-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId: currentUser.id, receiverId }),
      })
      const data = await res.json()

      if (res.ok) {
        if (data.autoAccepted) {
          addFriendId(receiverId)
          toggleFollow(receiverId)
          toast.success('Friend request accepted! You are now friends.')
          fetchFriends()
        } else {
          toast.success('Friend request sent!')
        }
        // Update search results
        setSearchResults((prev) =>
          prev.map((u) =>
            u.id === receiverId
              ? { ...u, friendRequestStatus: data.autoAccepted ? 'accepted' : 'pending_sent' }
              : u
          )
        )
        fetchFriendRequests()
      } else {
        toast.error(data.error || 'Failed to send friend request')
      }
    } catch {
      toast.error('Failed to send friend request')
    } finally {
      setActionLoading((prev) => ({ ...prev, [receiverId]: false }))
    }
  }

  const acceptFriendRequest = async (requestId: string, senderId: string) => {
    if (!currentUser) return
    setActionLoading((prev) => ({ ...prev, [requestId]: true }))
    try {
      const res = await fetch('/api/friend-requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action: 'accept', userId: currentUser.id }),
      })
      if (res.ok) {
        addFriendId(senderId)
        toggleFollow(senderId)
        toast.success('Friend request accepted!')
        setPendingRequests((prev) => prev.filter((r) => r.id !== requestId))
        setPendingFriendRequestCount(Math.max(0, pendingFriendRequestCount - 1))
        fetchFriends()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to accept request')
      }
    } catch {
      toast.error('Failed to accept request')
    } finally {
      setActionLoading((prev) => ({ ...prev, [requestId]: false }))
    }
  }

  const rejectFriendRequest = async (requestId: string) => {
    if (!currentUser) return
    setActionLoading((prev) => ({ ...prev, [requestId]: true }))
    try {
      const res = await fetch('/api/friend-requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action: 'reject', userId: currentUser.id }),
      })
      if (res.ok) {
        toast.success('Friend request rejected')
        setPendingRequests((prev) => prev.filter((r) => r.id !== requestId))
        setPendingFriendRequestCount(Math.max(0, pendingFriendRequestCount - 1))
      } else {
        toast.error('Failed to reject request')
      }
    } catch {
      toast.error('Failed to reject request')
    } finally {
      setActionLoading((prev) => ({ ...prev, [requestId]: false }))
    }
  }

  const cancelFriendRequest = async (requestId: string) => {
    if (!currentUser) return
    setActionLoading((prev) => ({ ...prev, [requestId]: true }))
    try {
      const res = await fetch(`/api/friend-requests?requestId=${requestId}&userId=${currentUser.id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        toast.success('Friend request cancelled')
        setSentRequests((prev) => prev.filter((r) => r.id !== requestId))
        // Update search results
        const cancelledRequest = sentRequests.find((r) => r.id === requestId)
        if (cancelledRequest) {
          setSearchResults((prev) =>
            prev.map((u) =>
              u.id === cancelledRequest.receiverId
                ? { ...u, friendRequestStatus: null }
                : u
            )
          )
        }
      } else {
        toast.error('Failed to cancel request')
      }
    } catch {
      toast.error('Failed to cancel request')
    } finally {
      setActionLoading((prev) => ({ ...prev, [requestId]: false }))
    }
  }

  const unfriendUser = async (friendId: string) => {
    if (!currentUser) return
    setActionLoading((prev) => ({ ...prev, [`unfriend-${friendId}`]: true }))
    try {
      const res = await fetch('/api/friend-requests', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, friendId }),
      })
      if (res.ok) {
        removeFriendId(friendId)
        toggleFollow(friendId)
        setFriends((prev) => prev.filter((f) => f.friend?.id !== friendId))
        toast.success('Friend removed')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to unfriend')
      }
    } catch {
      toast.error('Failed to unfriend')
    } finally {
      setActionLoading((prev) => ({ ...prev, [`unfriend-${friendId}`]: false }))
    }
  }

  const handleMessage = async (friendId: string) => {
    if (!currentUser) return
    try {
      const res = await fetch(`/api/chat-rooms?userId1=${currentUser.id}&userId2=${friendId}`)
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

  const handleUserClick = (user: { id: string; username: string; name: string; avatar: string | null; bio?: string | null; isPrivate?: boolean }) => {
    if (user.id === currentUser?.id) {
      setCurrentView('profile')
    } else {
      setViewingUser({
        id: user.id,
        email: '',
        username: user.username,
        name: user.name,
        avatar: user.avatar,
        bio: user.bio || null,
        isPrivate: user.isPrivate || false,
      })
      setCurrentView('user-profile')
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full h-11 bg-transparent border-b border-border rounded-none p-0 justify-around">
          <TabsTrigger
            value="search"
            className="flex-1 h-11 rounded-none data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#2EC4B6] data-[state=active]:bg-transparent px-0 gap-1.5"
          >
            <Search className="size-4" />
            <span className="text-xs">Search</span>
          </TabsTrigger>
          <TabsTrigger
            value="requests"
            className="flex-1 h-11 rounded-none data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#2EC4B6] data-[state=active]:bg-transparent px-0 gap-1.5 relative"
          >
            <UserPlus className="size-4" />
            <span className="text-xs">Requests</span>
            {pendingFriendRequestCount > 0 && (
              <span className="absolute -top-0.5 right-2 min-w-[18px] h-[18px] rounded-full bg-[#FF6B6B] text-white text-[10px] font-bold flex items-center justify-center px-1">
                {pendingFriendRequestCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="friends"
            className="flex-1 h-11 rounded-none data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#2EC4B6] data-[state=active]:bg-transparent px-0 gap-1.5"
          >
            <Users className="size-4" />
            <span className="text-xs">Friends</span>
          </TabsTrigger>
        </TabsList>

        {/* Search Tab */}
        <TabsContent value="search" className="mt-0">
          <div className="px-4 pt-4 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by username or name..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9 h-10 rounded-xl bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-[#2EC4B6]"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setSearchResults([])
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 outline-none"
                >
                  <X className="size-4 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>

          {/* Search Results */}
          <div className="px-4">
            {isSearching && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="size-5 text-[#2EC4B6] animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">Searching...</span>
              </div>
            )}

            {!isSearching && searchQuery && searchResults.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="size-14 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                  <Search className="size-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">No users found for &quot;{searchQuery}&quot;</p>
              </div>
            )}

            {!isSearching && !searchQuery && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="size-16 rounded-full bg-gradient-to-br from-[#2EC4B6]/10 to-[#FFBA49]/10 flex items-center justify-center mb-4">
                  <UserPlus className="size-7 text-[#2EC4B6]" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-1">Find Travel Buddies</h3>
                <p className="text-sm text-muted-foreground max-w-[250px]">
                  Search for friends by username or name and send them a friend request.
                </p>
              </div>
            )}

            <AnimatePresence mode="popLayout">
              {searchResults.map((user) => (
                <SearchUserCard
                  key={user.id}
                  user={user}
                  isLoading={actionLoading[user.id] || false}
                  onSendRequest={() => sendFriendRequest(user.id)}
                  onUserClick={() => handleUserClick(user)}
                  isCurrentUser={user.id === currentUser?.id}
                />
              ))}
            </AnimatePresence>
          </div>
        </TabsContent>

        {/* Requests Tab */}
        <TabsContent value="requests" className="mt-0">
          {/* Pending Requests (Received) */}
          <div className="px-4 pt-4">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Clock className="size-4 text-[#FF8C42]" />
              Incoming Requests
              {pendingFriendRequestCount > 0 && (
                <span className="min-w-[20px] h-5 rounded-full bg-[#FF6B6B] text-white text-[10px] font-bold flex items-center justify-center px-1.5">
                  {pendingFriendRequestCount}
                </span>
              )}
            </h3>

            {isLoadingRequests ? (
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="size-11 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-28 rounded" />
                      <Skeleton className="h-2.5 w-20 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : pendingRequests.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">No pending requests</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRequests.map((request) => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    type="received"
                    isLoading={actionLoading[request.id] || false}
                    onAccept={() => acceptFriendRequest(request.id, request.senderId)}
                    onReject={() => rejectFriendRequest(request.id)}
                    onUserClick={() => request.sender && handleUserClick(request.sender)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Sent Requests */}
          <div className="px-4 pt-6 pb-4">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <UserPlus className="size-4 text-[#2EC4B6]" />
              Sent Requests
            </h3>

            {isLoadingRequests ? (
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="size-11 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-28 rounded" />
                      <Skeleton className="h-2.5 w-20 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : sentRequests.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">No sent requests</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sentRequests.map((request) => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    type="sent"
                    isLoading={actionLoading[request.id] || false}
                    onCancel={() => cancelFriendRequest(request.id)}
                    onUserClick={() => request.receiver && handleUserClick(request.receiver)}
                  />
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Friends Tab */}
        <TabsContent value="friends" className="mt-0">
          <div className="px-4 pt-4">
            {isLoadingFriends ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="size-11 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-28 rounded" />
                      <Skeleton className="h-2.5 w-20 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : friends.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="size-16 rounded-full bg-gradient-to-br from-[#2EC4B6]/10 to-[#FFBA49]/10 flex items-center justify-center mb-4">
                  <Users className="size-7 text-[#2EC4B6]" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-1">No Friends Yet</h3>
                <p className="text-sm text-muted-foreground max-w-[250px]">
                  Search for travelers and send friend requests to build your network!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground mb-2">{friends.length} {friends.length === 1 ? 'friend' : 'friends'}</p>
                {friends.map((friendship) => {
                  const friend = friendship.friend
                  if (!friend) return null
                  return (
                    <FriendCard
                      key={friendship.id}
                      friend={friend}
                      onUserClick={() => handleUserClick(friend)}
                      onMessage={() => handleMessage(friend.id)}
                      onUnfriend={() => unfriendUser(friend.id)}
                      isUnfriendLoading={actionLoading[`unfriend-${friend.id}`] || false}
                    />
                  )
                })}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Search result user card
function SearchUserCard({
  user,
  isLoading,
  onSendRequest,
  onUserClick,
  isCurrentUser,
}: {
  user: SearchUserType
  isLoading: boolean
  onSendRequest: () => void
  onUserClick: () => void
  isCurrentUser: boolean
}) {
  const getActionButton = () => {
    if (isCurrentUser) return null

    switch (user.friendRequestStatus) {
      case 'accepted':
        return (
          <span className="flex items-center gap-1 text-xs font-medium text-[#2EC4B6]">
            <UserCheck className="size-3.5" />
            Friends
          </span>
        )
      case 'pending_sent':
        return (
          <span className="flex items-center gap-1 text-xs font-medium text-[#FF8C42]">
            <Clock className="size-3.5" />
            Sent
          </span>
        )
      case 'pending_received':
        return (
          <span className="flex items-center gap-1 text-xs font-medium text-[#FF6B6B]">
            <Clock className="size-3.5" />
            Wants to be friends
          </span>
        )
      case 'rejected':
        return (
          <Button
            size="sm"
            onClick={onSendRequest}
            disabled={isLoading}
            className="h-7 text-xs rounded-lg bg-[#2EC4B6] hover:bg-[#2EC4B6]/90 text-white px-3"
          >
            {isLoading ? <Loader2 className="size-3 animate-spin" /> : 'Resend'}
          </Button>
        )
      default:
        return (
          <Button
            size="sm"
            onClick={onSendRequest}
            disabled={isLoading}
            className="h-7 text-xs rounded-lg bg-[#2EC4B6] hover:bg-[#2EC4B6]/90 text-white px-3"
          >
            {isLoading ? <Loader2 className="size-3 animate-spin" /> : (
              <>
                <UserPlus className="size-3 mr-1" />
                Add
              </>
            )}
          </Button>
        )
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0"
    >
      <Avatar className="size-11 cursor-pointer shrink-0" onClick={onUserClick}>
        <AvatarImage src={user.avatar || undefined} alt={user.username} />
        <AvatarFallback className="bg-gradient-to-br from-[#2EC4B6]/20 to-[#FFBA49]/20 text-xs font-semibold">
          {user.username.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0 cursor-pointer" onClick={onUserClick}>
        <p className="text-sm font-semibold text-foreground truncate">{user.username}</p>
        <p className="text-xs text-muted-foreground truncate">{user.name}</p>
      </div>
      <div className="shrink-0">{getActionButton()}</div>
    </motion.div>
  )
}

// Friend request card
function RequestCard({
  request,
  type,
  isLoading,
  onAccept,
  onReject,
  onCancel,
  onUserClick,
}: {
  request: FriendRequestType
  type: 'received' | 'sent'
  isLoading: boolean
  onAccept?: () => void
  onReject?: () => void
  onCancel?: () => void
  onUserClick: () => void
}) {
  const user = type === 'received' ? request.sender : request.receiver
  if (!user) return null

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className="flex items-center gap-3 py-2"
    >
      <Avatar className="size-11 cursor-pointer shrink-0" onClick={onUserClick}>
        <AvatarImage src={user.avatar || undefined} alt={user.username} />
        <AvatarFallback className="bg-gradient-to-br from-[#2EC4B6]/20 to-[#FFBA49]/20 text-xs font-semibold">
          {user.username.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0 cursor-pointer" onClick={onUserClick}>
        <p className="text-sm font-semibold text-foreground truncate">{user.username}</p>
        <p className="text-xs text-muted-foreground truncate">{user.name}</p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {type === 'received' && (
          <>
            <Button
              size="sm"
              onClick={onAccept}
              disabled={isLoading}
              className="h-7 w-7 p-0 rounded-full bg-[#2EC4B6] hover:bg-[#2EC4B6]/90 text-white"
            >
              {isLoading ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3.5" />}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onReject}
              disabled={isLoading}
              className="h-7 w-7 p-0 rounded-full border-border hover:border-[#FF6B6B] hover:text-[#FF6B6B]"
            >
              <X className="size-3.5" />
            </Button>
          </>
        )}
        {type === 'sent' && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onCancel}
            disabled={isLoading}
            className="h-7 text-xs text-muted-foreground hover:text-[#FF6B6B]"
          >
            {isLoading ? <Loader2 className="size-3 animate-spin" /> : 'Cancel'}
          </Button>
        )}
      </div>
    </motion.div>
  )
}

// Friend card
function FriendCard({
  friend,
  onUserClick,
  onMessage,
  onUnfriend,
  isUnfriendLoading,
}: {
  friend: { id: string; username: string; name: string; avatar: string | null; bio?: string | null }
  onUserClick: () => void
  onMessage: () => void
  onUnfriend: () => void
  isUnfriendLoading: boolean
}) {
  const [showUnfriend, setShowUnfriend] = useState(false)

  const handleUnfriendClick = () => {
    if (window.confirm(`Remove ${friend.username || friend.name} from your friends?`)) {
      onUnfriend()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0 group"
      onMouseEnter={() => setShowUnfriend(true)}
      onMouseLeave={() => setShowUnfriend(false)}
    >
      <Avatar className="size-11 cursor-pointer shrink-0" onClick={onUserClick}>
        <AvatarImage src={friend.avatar || undefined} alt={friend.username} />
        <AvatarFallback className="bg-gradient-to-br from-[#2EC4B6]/20 to-[#FFBA49]/20 text-xs font-semibold">
          {friend.username.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0 cursor-pointer" onClick={onUserClick}>
        <p className="text-sm font-semibold text-foreground truncate">{friend.username}</p>
        <p className="text-xs text-muted-foreground truncate">{friend.name}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button
          size="sm"
          variant="ghost"
          onClick={onMessage}
          className="h-8 w-8 p-0 rounded-full text-muted-foreground hover:text-[#2EC4B6] hover:bg-[#2EC4B6]/10"
        >
          <MessageCircle className="size-4" />
        </Button>
        <AnimatePresence>
          {(showUnfriend || isUnfriendLoading) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
            >
              <Button
                size="sm"
                variant="ghost"
                onClick={handleUnfriendClick}
                disabled={isUnfriendLoading}
                className="h-8 w-8 p-0 rounded-full text-muted-foreground hover:text-[#FF6B6B] hover:bg-[#FF6B6B]/10"
              >
                {isUnfriendLoading ? <Loader2 className="size-4 animate-spin" /> : <UserX className="size-4" />}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
