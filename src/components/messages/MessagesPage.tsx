'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Search, Edit3, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { useAppStore, type ChatRoomType, type User } from '@/lib/store'
import { useChatRooms } from '@/lib/queries'
import { toast } from 'sonner'

function formatTimeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)

  if (diffSec < 60) return 'now'
  if (diffMin < 60) return `${diffMin}m`
  if (diffHr < 24) return `${diffHr}h`
  if (diffDay < 7) return `${diffDay}d`
  return `${Math.floor(diffDay / 7)}w`
}

export default function MessagesPage() {
  const { currentUser, chatRooms, setChatRooms, setSelectedChatRoom, setCurrentView, setMessages, onlineUserIds } = useAppStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [showNewMessageDialog, setShowNewMessageDialog] = useState(false)
  const [userSearchQuery, setUserSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isCreatingRoom, setIsCreatingRoom] = useState(false)

  // React Query for chat rooms
  const { data: chatRoomsData, isLoading: isChatRoomsLoading, refetch: refetchChatRooms } = useChatRooms(currentUser?.id || null)

  // Sync React Query data to Zustand store
  useEffect(() => {
    if (chatRoomsData?.chatRooms && chatRoomsData.chatRooms.length > 0 && chatRooms.length === 0) {
      const rooms: ChatRoomType[] = (chatRoomsData.chatRooms as unknown as Record<string, unknown>[]).map((room) => ({
        id: room.id as string,
        name: (room.name as string) || null,
        isGroup: room.isGroup as boolean,
        members: (room.members as Record<string, unknown>[]).map((m) => ({
          id: (m as { userId?: string; user?: { id: string }; id?: string }).userId || (m as { user?: { id: string } }).user?.id || (m as { id: string }).id,
          email: '',
          username: ((m as { user?: { username: string } }).user?.username) || '',
          name: ((m as { user?: { name: string } }).user?.name) || '',
          avatar: ((m as { user?: { avatar: string | null } }).user?.avatar) || null,
          bio: null,
          isPrivate: false,
        })),
        lastMessage: room.lastMessage ? {
          id: (room.lastMessage as { id: string }).id,
          content: (room.lastMessage as { content: string }).content,
          senderId: (room.lastMessage as { senderId: string }).senderId,
          chatRoomId: (room.lastMessage as { chatRoomId: string }).chatRoomId,
          createdAt: (room.lastMessage as { createdAt: string }).createdAt,
          sender: {
            id: ((room.lastMessage as { sender?: { id: string } }).sender?.id) || '',
            email: '',
            username: ((room.lastMessage as { sender?: { username: string } }).sender?.username) || '',
            name: ((room.lastMessage as { sender?: { name: string } }).sender?.name) || '',
            avatar: ((room.lastMessage as { sender?: { avatar: string | null } }).sender?.avatar) || null,
            bio: null,
            isPrivate: false,
          },
        } : undefined,
      }))
      setChatRooms(rooms)
    }
  }, [chatRoomsData, chatRooms.length, setChatRooms])

  const getOtherUser = (room: ChatRoomType) => {
    if (!currentUser) return room.members[0]
    return room.members.find((m) => m.id !== currentUser.id) || room.members[0]
  }

  const handleRoomTap = (room: ChatRoomType) => {
    setSelectedChatRoom(room)
    setMessages([])
    setCurrentView('chat-room')
  }

  const handleSearchUsers = async () => {
    if (!userSearchQuery.trim()) return
    setIsSearching(true)
    try {
      const res = await fetch(`/api/users?search=${encodeURIComponent(userSearchQuery.trim())}`)
      if (res.ok) {
        const data = await res.json()
        const users: User[] = (data.users || [])
          .filter((u: Record<string, unknown>) => u.id !== currentUser?.id)
          .map((u: Record<string, unknown>) => ({
            id: u.id as string,
            email: u.email as string,
            username: u.username as string,
            name: u.name as string,
            avatar: (u.avatar as string) || null,
            bio: (u.bio as string) || null,
            isPrivate: u.isPrivate as boolean,
          }))
        setSearchResults(users)
      }
    } catch {
      toast.error('Failed to search users')
    } finally {
      setIsSearching(false)
    }
  }

  const handleStartDM = async (otherUser: User) => {
    if (!currentUser || isCreatingRoom) return
    setIsCreatingRoom(true)
    try {
      const res = await fetch(`/api/chat-rooms?userId1=${currentUser.id}&userId2=${otherUser.id}`)
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
        setShowNewMessageDialog(false)
        setUserSearchQuery('')
        setSearchResults([])
        setCurrentView('chat-room')

        // Refresh room list via React Query
        refetchChatRooms()
      }
    } catch {
      toast.error('Failed to start conversation')
    } finally {
      setIsCreatingRoom(false)
    }
  }

  const isUnread = (room: ChatRoomType) => {
    if (!room.lastMessage || !currentUser) return false
    return room.lastMessage.senderId !== currentUser.id
  }

  const filteredRooms = chatRooms.filter((room) => {
    if (!searchQuery.trim()) return true
    const otherUser = getOtherUser(room)
    return (
      otherUser.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      otherUser.username.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  // Sort rooms by last message time (most recent first)
  const sortedRooms = [...filteredRooms].sort((a, b) => {
    const aTime = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0
    const bTime = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0
    return bTime - aTime
  })

  const isLoading = isChatRoomsLoading && chatRooms.length === 0

  return (
    <div className="max-w-md mx-auto flex flex-col h-full min-h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <Button
          variant="ghost"
          size="icon"
          className="size-9 rounded-full"
          onClick={() => setCurrentView('feed')}
        >
          <ArrowLeft className="size-5 text-muted-foreground" />
        </Button>
        <h1 className="text-lg font-semibold text-foreground">Messages</h1>
        <Button
          variant="ghost"
          size="icon"
          className="size-9 rounded-full"
          onClick={() => setShowNewMessageDialog(true)}
        >
          <Edit3 className="size-5 text-muted-foreground" />
        </Button>
      </div>

      {/* Search Bar */}
      <div className="px-4 py-2 bg-card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="pl-9 h-9 text-sm rounded-full border-border bg-muted focus:bg-card focus:border-[#2EC4B6]"
          />
        </div>
      </div>

      {/* Chat Rooms List */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <MessagesSkeleton />
        ) : sortedRooms.length === 0 ? (
          <EmptyMessagesState hasSearch={!!searchQuery.trim()} />
        ) : (
          <div className="px-4 py-2">
            {sortedRooms.map((room, index) => {
              const otherUser = getOtherUser(room)
              const lastMsg = room.lastMessage
              const unread = isUnread(room)
              const isOnline = onlineUserIds.includes(otherUser.id)

              return (
                <motion.button
                  key={room.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.04 }}
                  onClick={() => handleRoomTap(room)}
                  className="flex items-center gap-3 w-full py-3 px-1 rounded-xl hover:bg-muted transition-colors outline-none text-left"
                >
                  <div className="relative">
                    <Avatar className="size-12">
                      <AvatarImage
                        src={otherUser.avatar || undefined}
                        alt={otherUser.username}
                      />
                      <AvatarFallback className="bg-gradient-to-br from-[#FFBA49]/20 to-[#2EC4B6]/20 text-gray-600 font-semibold">
                        {otherUser.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {/* Online/Offline indicator */}
                    <div
                      className={`absolute bottom-0 right-0 size-3 rounded-full border-2 border-card ${
                        isOnline ? 'bg-emerald-500' : 'bg-gray-400'
                      }`}
                    />
                    {unread && (
                      <div className="absolute top-0 right-0 size-3 rounded-full bg-[#2EC4B6] border-2 border-card" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm truncate ${unread ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground'}`}>
                        {room.name || otherUser.name}
                      </span>
                      {lastMsg && (
                        <span className="text-[11px] text-gray-400 shrink-0 ml-2">
                          {formatTimeAgo(lastMsg.createdAt)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className={`text-sm truncate ${unread ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                        {lastMsg
                          ? (lastMsg.senderId === currentUser?.id ? 'You: ' : '') + lastMsg.content
                          : 'No messages yet'}
                      </p>
                      {unread && (
                        <Badge className="ml-2 size-5 p-0 flex items-center justify-center bg-[#2EC4B6] text-white text-[10px] rounded-full shrink-0 border-0">
                          •
                        </Badge>
                      )}
                    </div>
                  </div>
                </motion.button>
              )
            })}
          </div>
        )}
      </ScrollArea>

      {/* New Message FAB */}
      <div className="p-4 bg-card border-t border-border">
        <Button
          className="w-full h-10 rounded-xl bg-[#2EC4B6] hover:bg-[#2EC4B6]/90 text-white text-sm font-medium"
          onClick={() => setShowNewMessageDialog(true)}
        >
          <Edit3 className="size-4 mr-2" />
          New Message
        </Button>
      </div>

      {/* New Message Dialog */}
      <Dialog open={showNewMessageDialog} onOpenChange={setShowNewMessageDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>New Message</DialogTitle>
            <DialogDescription>
              Search for a user to start a conversation.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Input
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
              placeholder="Search by username or name..."
              className="flex-1 h-9 text-sm rounded-lg"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearchUsers()
              }}
            />
            <Button
              size="sm"
              onClick={handleSearchUsers}
              disabled={isSearching || !userSearchQuery.trim()}
              className="bg-[#2EC4B6] hover:bg-[#2EC4B6]/90 text-white rounded-lg"
            >
              {isSearching ? '...' : 'Search'}
            </Button>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {searchResults.length > 0 ? (
              searchResults.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleStartDM(user)}
                  disabled={isCreatingRoom}
                  className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-muted transition-colors text-left"
                >
                  <div className="relative">
                    <Avatar className="size-9">
                      <AvatarImage src={user.avatar || undefined} alt={user.username} />
                      <AvatarFallback className="bg-gradient-to-br from-[#FFBA49]/20 to-[#2EC4B6]/20 text-gray-600 text-xs font-semibold">
                        {user.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-card ${
                        onlineUserIds.includes(user.id) ? 'bg-emerald-500' : 'bg-gray-400'
                      }`}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{user.name}</p>
                    <p className="text-xs text-muted-foreground">@{user.username}</p>
                  </div>
                </button>
              ))
            ) : userSearchQuery && !isSearching ? (
              <p className="text-sm text-muted-foreground text-center py-4">No users found</p>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function MessagesSkeleton() {
  return (
    <div className="px-4 py-2 flex flex-col gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-2">
          <Skeleton className="size-12 rounded-full" />
          <div className="flex-1 flex flex-col gap-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyMessagesState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-6">
      <div className="size-16 rounded-full bg-gradient-to-br from-[#2EC4B6]/10 to-[#FFBA49]/10 flex items-center justify-center mb-4">
        <MessageCircle className="size-7 text-[#2EC4B6]" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">
        {hasSearch ? 'No results found' : 'No messages yet'}
      </h3>
      <p className="text-sm text-muted-foreground max-w-[250px]">
        {hasSearch
          ? 'Try searching with a different name or username.'
          : 'Start a conversation with fellow travelers!'}
      </p>
    </div>
  )
}
