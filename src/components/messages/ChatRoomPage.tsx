'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Send, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAppStore, type MessageType, type ChatRoomType, type User } from '@/lib/store'
import { getSocket } from '@/lib/socket'
import type { Socket } from 'socket.io-client'

function formatMessageTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function getOtherUser(room: ChatRoomType | null, currentUser: User | null): User | null {
  if (!room || !currentUser) return null
  return room.members.find((m) => m.id !== currentUser.id) || room.members[0] || null
}

export default function ChatRoomPage() {
  const {
    currentUser,
    selectedChatRoom,
    messages,
    setMessages,
    addMessage,
    setCurrentView,
    setSelectedChatRoom,
    setViewingUser,
    onlineUserIds,
    isSocketConnected,
  } = useAppStore()
  const [newMessage, setNewMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isOtherTyping, setIsOtherTyping] = useState(false)
  const [otherTypingUsername, setOtherTypingUsername] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const hasFetched = useRef(false)
  const lastMessageCountRef = useRef(0)
  const socketRef = useRef<Socket | null>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  const otherUser = getOtherUser(selectedChatRoom, currentUser)
  const isOtherOnline = otherUser ? onlineUserIds.includes(otherUser.id) : false

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!selectedChatRoom) return
    try {
      const res = await fetch(
        `/api/chat-rooms?userId1=${currentUser?.id}&userId2=${otherUser?.id}`
      )
      if (res.ok) {
        const data = await res.json()
        if (data.chatRoom?.messages) {
          const fetchedMessages: MessageType[] = data.chatRoom.messages.map((msg: Record<string, unknown>) => ({
            id: msg.id as string,
            content: (msg.content as string) || '',
            senderId: msg.senderId as string,
            chatRoomId: msg.chatRoomId as string,
            createdAt: msg.createdAt as string,
            sender: {
              id: (msg.sender as { id?: string })?.id || (msg.senderId as string) || '',
              email: '',
              username: (msg.sender as { username?: string })?.username || 'unknown',
              name: (msg.sender as { name?: string })?.name || 'Unknown',
              avatar: (msg.sender as { avatar?: string | null })?.avatar || null,
              bio: null,
              isPrivate: false,
            },
          }))
          
          // Only update if new messages found
          if (fetchedMessages.length !== lastMessageCountRef.current) {
            lastMessageCountRef.current = fetchedMessages.length
            setMessages(fetchedMessages)
            scrollToBottom()
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err)
    }
  }, [selectedChatRoom, currentUser, otherUser, setMessages])

  // Update lastReadAt when entering chat room
  useEffect(() => {
    if (!selectedChatRoom || !currentUser) return
    fetch('/api/chat-rooms', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chatRoomId: selectedChatRoom.id,
        userId: currentUser.id,
      }),
    }).catch(() => {
      // Non-critical
    })
  }, [selectedChatRoom, currentUser])

  // Initial fetch
  useEffect(() => {
    if (selectedChatRoom && currentUser && !hasFetched.current) {
      hasFetched.current = true
      setIsLoading(true)
      fetchMessages().finally(() => setIsLoading(false))
    }
  }, [selectedChatRoom, currentUser, fetchMessages])

  // Socket.io: join room, listen for typing indicators
  useEffect(() => {
    if (!selectedChatRoom || !currentUser) return

    const socket = getSocket()
    socketRef.current = socket

    // Join the chat room via socket
    if (socket.connected) {
      socket.emit('join-room', { chatRoomId: selectedChatRoom.id, userId: currentUser.id })
    }

    // When socket connects, join the room
    const handleConnect = () => {
      socket.emit('join-room', { chatRoomId: selectedChatRoom!.id, userId: currentUser!.id })
    }

    // Listen for typing indicators
    const handleUserTyping = (data: { chatRoomId: string; userId: string; username: string }) => {
      if (data.chatRoomId === selectedChatRoom.id && data.userId !== currentUser.id) {
        setIsOtherTyping(true)
        setOtherTypingUsername(data.username)
      }
    }

    const handleUserStopTyping = (data: { chatRoomId: string; userId: string }) => {
      if (data.chatRoomId === selectedChatRoom.id && data.userId !== currentUser.id) {
        setIsOtherTyping(false)
        setOtherTypingUsername('')
      }
    }

    socket.on('connect', handleConnect)
    socket.on('user-typing', handleUserTyping)
    socket.on('user-stop-typing', handleUserStopTyping)

    // If socket is already connected, join immediately
    if (socket.connected) {
      handleConnect()
    }

    return () => {
      // Leave the room on unmount
      if (socket.connected) {
        socket.emit('leave-room', { chatRoomId: selectedChatRoom.id, userId: currentUser.id })
      }
      socket.off('connect', handleConnect)
      socket.off('user-typing', handleUserTyping)
      socket.off('user-stop-typing', handleUserStopTyping)
      socketRef.current = null
    }
  }, [selectedChatRoom, currentUser])

  // Fallback polling when socket is not connected
  useEffect(() => {
    if (!selectedChatRoom) return
    
    // Only poll when socket is not connected (fallback)
    if (!isSocketConnected) {
      pollingRef.current = setInterval(() => {
        fetchMessages()
      }, 3000)
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }
  }, [selectedChatRoom, fetchMessages, isSocketConnected])

  // Scroll to bottom on messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages.length])

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      }
    }, 50)
  }

  // Typing indicator handler
  const handleTyping = (value: string) => {
    setNewMessage(value)

    if (!socketRef.current?.connected || !selectedChatRoom || !currentUser) return

    if (value.trim()) {
      socketRef.current.emit('typing', {
        chatRoomId: selectedChatRoom.id,
        userId: currentUser.id,
        username: currentUser.username,
      })

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      // Set new timeout to stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current?.emit('stop-typing', {
          chatRoomId: selectedChatRoom!.id,
          userId: currentUser!.id,
        })
      }, 2000)
    } else {
      socketRef.current.emit('stop-typing', {
        chatRoomId: selectedChatRoom.id,
        userId: currentUser.id,
      })
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }

  const handleSend = async () => {
    if (!newMessage.trim() || !currentUser || isSending || !selectedChatRoom) return

    const content = newMessage.trim()
    setNewMessage('')
    setIsSending(true)

    // Stop typing indicator
    if (socketRef.current?.connected) {
      socketRef.current.emit('stop-typing', {
        chatRoomId: selectedChatRoom.id,
        userId: currentUser.id,
      })
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          senderId: currentUser.id,
          chatRoomId: selectedChatRoom.id,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        const newMsg: MessageType = {
          id: data.message?.id || Date.now().toString(),
          content,
          senderId: currentUser.id,
          chatRoomId: selectedChatRoom.id,
          createdAt: new Date().toISOString(),
          sender: {
            id: currentUser.id,
            email: currentUser.email,
            username: currentUser.username,
            name: currentUser.name,
            avatar: currentUser.avatar,
            bio: null,
            isPrivate: false,
          },
        }
        addMessage(newMsg)
        lastMessageCountRef.current += 1
        scrollToBottom()

        // Emit message via socket for real-time delivery to other users
        if (socketRef.current?.connected) {
          socketRef.current.emit('send-message', {
            id: newMsg.id,
            content: newMsg.content,
            senderId: newMsg.senderId,
            chatRoomId: newMsg.chatRoomId,
            createdAt: newMsg.createdAt,
            sender: {
              id: currentUser.id,
              username: currentUser.username,
              name: currentUser.name,
              avatar: currentUser.avatar,
            },
          })
        }
      }
    } catch (err) {
      console.error('Failed to send message:', err)
      setNewMessage(content)
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleBack = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
    }
    setSelectedChatRoom(null)
    setMessages([])
    setCurrentView('messages')
  }

  const handleUserTap = () => {
    if (otherUser) {
      setViewingUser(otherUser)
      setCurrentView('user-profile')
    }
  }

  return (
    <div className="max-w-md mx-auto flex flex-col h-full min-h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
        <Button
          variant="ghost"
          size="icon"
          className="size-9 rounded-full"
          onClick={handleBack}
        >
          <ArrowLeft className="size-5 text-muted-foreground" />
        </Button>
        <button
          onClick={handleUserTap}
          className="flex items-center gap-3 flex-1 min-w-0 outline-none"
        >
          <div className="relative">
            <Avatar className="size-9">
              <AvatarImage
                src={otherUser?.avatar || undefined}
                alt={otherUser?.username || 'User'}
              />
              <AvatarFallback className="bg-gradient-to-br from-[#FFBA49]/20 to-[#2EC4B6]/20 text-gray-600 text-sm font-semibold">
                {otherUser?.username?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            {/* Online status indicator */}
            <div
              className={`absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-card ${
                isOtherOnline ? 'bg-emerald-500' : 'bg-gray-400'
              }`}
            />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {otherUser?.name || 'User'}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {isOtherOnline ? 'Online' : 'Offline'}
            </p>
          </div>
        </button>
        <Button
          variant="ghost"
          size="icon"
          className="size-9 rounded-full"
        >
          <MoreVertical className="size-5 text-gray-500" />
        </Button>
      </div>

      {/* Messages List */}
      <ScrollArea className="flex-1 px-4" ref={scrollRef}>
        <div className="py-4 flex flex-col gap-2">
          <AnimatePresence initial={false}>
            {messages.map((msg, index) => {
              const isSent = currentUser && msg.senderId === currentUser.id
              const showAvatar =
                !isSent &&
                (index === 0 || messages[index - 1]?.senderId !== msg.senderId)

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15 }}
                  className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`flex items-end gap-2 max-w-[80%] ${
                      isSent ? 'flex-row-reverse' : ''
                    }`}
                  >
                    {/* Avatar for received messages */}
                    {!isSent && (
                      <div className="size-7 shrink-0">
                        {showAvatar ? (
                          <Avatar className="size-7">
                            <AvatarImage
                              src={msg.sender?.avatar || otherUser?.avatar || undefined}
                              alt={msg.sender?.username || ''}
                            />
                            <AvatarFallback className="bg-gradient-to-br from-[#FFBA49]/20 to-[#2EC4B6]/20 text-gray-600 text-[10px] font-semibold">
                              {(msg.sender?.username || otherUser?.username || 'U')
                                .charAt(0)
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="w-7" />
                        )}
                      </div>
                    )}

                    {/* Message Bubble */}
                    <div className="flex flex-col">
                      <div
                        className={`px-3.5 py-2 rounded-2xl ${
                          isSent
                            ? 'bg-[#2EC4B6] text-white rounded-br-md'
                            : 'bg-muted text-foreground rounded-bl-md'
                        }`}
                      >
                        <p className="text-sm break-words">{msg.content}</p>
                      </div>
                      <span
                        className={`text-[10px] text-gray-400 mt-0.5 ${
                          isSent ? 'text-right' : 'text-left'
                        }`}
                      >
                        {formatMessageTime(msg.createdAt)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>

          {/* Typing indicator */}
          <AnimatePresence>
            {isOtherTyping && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                className="flex justify-start"
              >
                <div className="flex items-end gap-2 max-w-[80%]">
                  <Avatar className="size-7">
                    <AvatarImage
                      src={otherUser?.avatar || undefined}
                      alt={otherUser?.username || ''}
                    />
                    <AvatarFallback className="bg-gradient-to-br from-[#FFBA49]/20 to-[#2EC4B6]/20 text-gray-600 text-[10px] font-semibold">
                      {(otherUser?.username || 'U').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="px-3.5 py-2.5 rounded-2xl bg-muted rounded-bl-md">
                    <div className="flex items-center gap-1">
                      <span className="size-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0ms]" />
                      <span className="size-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:150ms]" />
                      <span className="size-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {messages.length === 0 && !isLoading && (
            <EmptyChatState userName={otherUser?.name || 'User'} />
          )}
        </div>
      </ScrollArea>

      {/* Typing indicator text */}
      <AnimatePresence>
        {isOtherTyping && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 overflow-hidden"
          >
            <p className="text-xs text-muted-foreground italic">
              {otherTypingUsername} is typing...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message Input */}
      <div className="border-t border-border p-3 flex items-center gap-2 bg-card">
        <Input
          value={newMessage}
          onChange={(e) => handleTyping(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="flex-1 h-10 text-sm rounded-full border-border bg-muted focus:bg-card focus:border-[#2EC4B6] focus:ring-[#2EC4B6]/20"
          disabled={isSending}
        />
        <Button
          size="icon"
          onClick={handleSend}
          disabled={!newMessage.trim() || isSending}
          className="size-10 rounded-full bg-[#2EC4B6] hover:bg-[#2EC4B6]/90 text-white shrink-0"
        >
          <Send className="size-4 -rotate-12" />
        </Button>
      </div>
    </div>
  )
}

function EmptyChatState({ userName }: { userName: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="size-12 rounded-full bg-gradient-to-br from-[#2EC4B6]/10 to-[#FFBA49]/10 flex items-center justify-center mb-3">
        <svg
          className="size-6 text-[#2EC4B6]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </div>
      <h3 className="text-sm font-semibold text-foreground mb-0.5">
        Say hello to {userName}!
      </h3>
      <p className="text-xs text-muted-foreground">Send your first message to start the conversation.</p>
    </div>
  )
}
