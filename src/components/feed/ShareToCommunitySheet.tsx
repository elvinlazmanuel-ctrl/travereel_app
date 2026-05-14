'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Share2, Check, ImagePlus, Send, Search, Loader2, MessageCircle } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useAppStore, type User } from '@/lib/store'
import { toast } from 'sonner'

interface ShareToCommunitySheetProps {
  postId: string
  postCaption?: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface FriendUser {
  id: string
  username: string
  name: string
  avatar: string | null
}

export default function ShareToCommunitySheet({
  postId,
  postCaption,
  open,
  onOpenChange,
}: ShareToCommunitySheetProps) {
  const { communities, joinedCommunityIds, currentUser } = useAppStore()
  const [caption, setCaption] = useState('')
  const [sharedIds, setSharedIds] = useState<Set<string>>(new Set())
  const [isSharing, setIsSharing] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('community')

  // DM tab state
  const [friends, setFriends] = useState<FriendUser[]>([])
  const [friendsLoading, setFriendsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sentDmIds, setSentDmIds] = useState<Set<string>>(new Set())
  const [sendingDmId, setSendingDmId] = useState<string | null>(null)

  // Filter to only joined communities
  const joinedCommunities = communities.filter((c) =>
    joinedCommunityIds.includes(c.id)
  )

  // Filter friends by search
  const filteredFriends = friends.filter(
    (f) =>
      f.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Fetch friends when DM tab is activated
  useEffect(() => {
    if (activeTab === 'dm' && currentUser && friends.length === 0) {
      fetchFriends()
    }
  }, [activeTab, currentUser])

  const fetchFriends = async () => {
    if (!currentUser) return
    setFriendsLoading(true)
    try {
      const res = await fetch(`/api/friend-requests?userId=${currentUser.id}&type=friends`)
      if (res.ok) {
        const data = await res.json()
        const friendList: FriendUser[] = (data.friends || []).map(
          (f: { friend: User }) => ({
            id: f.friend.id,
            username: f.friend.username,
            name: f.friend.name,
            avatar: f.friend.avatar,
          })
        )
        setFriends(friendList)
      }
    } catch (err) {
      console.error('Failed to fetch friends:', err)
    } finally {
      setFriendsLoading(false)
    }
  }

  const handleShare = async (communityId: string) => {
    if (sharedIds.has(communityId) || isSharing || !currentUser) return

    setIsSharing(communityId)

    try {
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          userId: currentUser.id,
          communityId,
          caption: caption.trim() || undefined,
        }),
      })

      if (res.ok) {
        setSharedIds((prev) => new Set(prev).add(communityId))
        toast.success('Shared to community!', {
          description: 'Your post has been shared successfully.',
        })
      } else {
        toast.error('Failed to share', {
          description: 'Something went wrong. Please try again.',
        })
      }
    } catch (err) {
      console.error('Failed to share:', err)
      toast.error('Failed to share', {
        description: 'Something went wrong. Please try again.',
      })
    } finally {
      setIsSharing(null)
    }
  }

  const handleSendDM = useCallback(async (friendId: string) => {
    if (!currentUser || sentDmIds.has(friendId) || sendingDmId) return

    setSendingDmId(friendId)

    try {
      // Step 1: Get or create chat room between current user and friend
      const roomRes = await fetch(
        `/api/chat-rooms?userId1=${currentUser.id}&userId2=${friendId}`
      )

      if (!roomRes.ok) {
        toast.error('Failed to create chat room')
        return
      }

      const roomData = await roomRes.json()
      const chatRoom = roomData.chatRoom

      if (!chatRoom?.id) {
        toast.error('Failed to create chat room')
        return
      }

      // Step 2: Send a message with the shared post info
      const shareText = postCaption
        ? `📷 Shared a post: "${postCaption.length > 80 ? postCaption.slice(0, 80) + '...' : postCaption}"`
        : '📷 Shared a post with you'

      const msgRes = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: shareText,
          senderId: currentUser.id,
          chatRoomId: chatRoom.id,
        }),
      })

      if (msgRes.ok) {
        setSentDmIds((prev) => new Set(prev).add(friendId))
        const friend = friends.find((f) => f.id === friendId)
        toast.success('Post sent!', {
          description: `Shared with ${friend?.name || friend?.username}`,
        })
      } else {
        toast.error('Failed to send message')
      }
    } catch (err) {
      console.error('Failed to share via DM:', err)
      toast.error('Failed to share via message')
    } finally {
      setSendingDmId(null)
    }
  }, [currentUser, friends, postCaption, sendingDmId, sentDmIds])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[65vh] rounded-t-2xl p-0 flex flex-col max-w-md mx-auto">
        <SheetHeader className="px-4 pt-4 pb-2 border-b border-gray-100">
          <SheetTitle className="text-base font-semibold">
            Share Post
          </SheetTitle>
          <SheetDescription className="text-xs text-gray-400">
            Share this post with a community or send it as a message
          </SheetDescription>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0">
          {/* Tab toggle */}
          <div className="px-4 pt-3 pb-1">
            <TabsList className="w-full h-9 rounded-lg bg-gray-100 p-[3px]">
              <TabsTrigger
                value="community"
                className="flex-1 h-[calc(100%-2px)] rounded-md text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <Share2 className="size-3.5 mr-1.5" />
                Community
              </TabsTrigger>
              <TabsTrigger
                value="dm"
                className="flex-1 h-[calc(100%-2px)] rounded-md text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <MessageCircle className="size-3.5 mr-1.5" />
                Message
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Caption Input */}
          <div className="px-4 py-2">
            <Input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a caption (optional)..."
              className="h-9 text-sm rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:border-[#2EC4B6] focus:ring-[#2EC4B6]/20"
            />
          </div>

          {/* Community Tab Content */}
          <TabsContent value="community" className="flex-1 min-h-0">
            <ScrollArea className="h-full">
              {joinedCommunities.length === 0 ? (
                <EmptyCommunitiesState />
              ) : (
                <div className="px-4 py-2">
                  <AnimatePresence initial={false}>
                    {joinedCommunities.map((community, index) => {
                      const isShared = sharedIds.has(community.id)
                      const isCurrentlySharing = isSharing === community.id

                      return (
                        <motion.div
                          key={community.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.2, delay: index * 0.03 }}
                          className="flex items-center justify-between py-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Avatar className="size-10 shrink-0 rounded-lg">
                              {community.image ? (
                                <AvatarImage
                                  src={community.image}
                                  alt={community.name}
                                />
                              ) : (
                                <AvatarFallback className="bg-gradient-to-br from-[#FF8C42]/20 to-[#FFBA49]/20 text-[#FF8C42] rounded-lg text-sm font-semibold">
                                  {community.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">
                                {community.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {community.members} member{community.members !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>

                          <Button
                            size="sm"
                            disabled={isShared || isCurrentlySharing}
                            onClick={() => handleShare(community.id)}
                            className={`ml-3 h-8 px-4 text-xs rounded-lg shrink-0 ${
                              isShared
                                ? 'bg-[#2EC4B6]/10 text-[#2EC4B6] hover:bg-[#2EC4B6]/10 border-0'
                                : 'bg-[#2EC4B6] hover:bg-[#2EC4B6]/90 text-white'
                            }`}
                          >
                            {isCurrentlySharing ? (
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                className="size-4 border-2 border-white/30 border-t-white rounded-full"
                              />
                            ) : isShared ? (
                              <>
                                <Check className="size-3.5 mr-1" />
                                Shared
                              </>
                            ) : (
                              <>
                                <Share2 className="size-3.5 mr-1" />
                                Share
                              </>
                            )}
                          </Button>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* DM Tab Content */}
          <TabsContent value="dm" className="flex-1 min-h-0">
            <div className="flex flex-col h-full">
              {/* Search bar */}
              <div className="px-4 pb-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-gray-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search friends..."
                    className="h-9 pl-8 text-sm rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:border-[#FF6B6B] focus:ring-[#FF6B6B]/20"
                  />
                </div>
              </div>

              <ScrollArea className="flex-1">
                {friendsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="size-6 text-gray-400 animate-spin" />
                  </div>
                ) : filteredFriends.length === 0 ? (
                  <EmptyFriendsState hasFriends={friends.length > 0} />
                ) : (
                  <div className="px-4 py-2">
                    <AnimatePresence initial={false}>
                      {filteredFriends.map((friend, index) => {
                        const isSent = sentDmIds.has(friend.id)
                        const isCurrentlySending = sendingDmId === friend.id

                        return (
                          <motion.div
                            key={friend.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2, delay: index * 0.03 }}
                            className="flex items-center justify-between py-3"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <Avatar className="size-10 shrink-0">
                                {friend.avatar ? (
                                  <AvatarImage src={friend.avatar} alt={friend.username} />
                                ) : (
                                  <AvatarFallback className="bg-gradient-to-br from-[#FF6B6B]/20 to-[#FF8C42]/20 text-[#FF6B6B] text-sm font-semibold">
                                    {friend.username.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">
                                  {friend.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  @{friend.username}
                                </p>
                              </div>
                            </div>

                            <Button
                              size="sm"
                              disabled={isSent || isCurrentlySending}
                              onClick={() => handleSendDM(friend.id)}
                              className={`ml-3 h-8 px-4 text-xs rounded-lg shrink-0 ${
                                isSent
                                  ? 'bg-[#FF6B6B]/10 text-[#FF6B6B] hover:bg-[#FF6B6B]/10 border-0'
                                  : 'bg-[#FF6B6B] hover:bg-[#FF6B6B]/90 text-white'
                              }`}
                            >
                              {isCurrentlySending ? (
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                  className="size-4 border-2 border-white/30 border-t-white rounded-full"
                                />
                              ) : isSent ? (
                                <>
                                  <Check className="size-3.5 mr-1" />
                                  Sent
                                </>
                              ) : (
                                <>
                                  <Send className="size-3.5 mr-1" />
                                  Send
                                </>
                              )}
                            </Button>
                          </motion.div>
                        )
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}

function EmptyCommunitiesState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center px-6">
      <div className="size-14 rounded-full bg-gradient-to-br from-[#FF8C42]/10 to-[#FFBA49]/10 flex items-center justify-center mb-3">
        <ImagePlus className="size-7 text-[#FF8C42]" />
      </div>
      <h3 className="text-sm font-semibold text-gray-900 mb-1">
        No communities joined
      </h3>
      <p className="text-xs text-gray-500 max-w-[200px]">
        Join communities to share posts with like-minded travelers.
      </p>
    </div>
  )
}

function EmptyFriendsState({ hasFriends }: { hasFriends: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center px-6">
      <div className="size-14 rounded-full bg-gradient-to-br from-[#FF6B6B]/10 to-[#FF8C42]/10 flex items-center justify-center mb-3">
        <MessageCircle className="size-7 text-[#FF6B6B]" />
      </div>
      <h3 className="text-sm font-semibold text-gray-900 mb-1">
        {hasFriends ? 'No matches found' : 'No friends yet'}
      </h3>
      <p className="text-xs text-gray-500 max-w-[200px]">
        {hasFriends
          ? 'Try a different search term.'
          : 'Add friends to share posts with them via direct message.'}
      </p>
    </div>
  )
}
