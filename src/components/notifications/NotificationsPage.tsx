'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart,
  MessageCircle,
  UserPlus,
  UserCheck,
  AtSign,
  Bell,
  CheckCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useAppStore, type NotificationType } from '@/lib/store'
import { toast } from 'sonner'

function formatTimeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)
  const diffWk = Math.floor(diffDay / 7)

  if (diffSec < 60) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffDay < 7) return `${diffDay}d ago`
  return `${diffWk}w ago`
}

function getTimeGroup(dateStr: string): 'Today' | 'This Week' | 'Earlier' {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffDay = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDay === 0) return 'Today'
  if (diffDay <= 7) return 'This Week'
  return 'Earlier'
}

function getNotificationIcon(type: string) {
  switch (type) {
    case 'like':
      return <Heart className="size-4 text-[#FF6B6B] fill-[#FF6B6B]" />
    case 'comment':
      return <MessageCircle className="size-4 text-[#2EC4B6]" />
    case 'follow':
      return <UserPlus className="size-4 text-[#FF8C42]" />
    case 'friend_request':
      return <UserPlus className="size-4 text-[#2EC4B6]" />
    case 'friend_request_accepted':
      return <UserCheck className="size-4 text-[#2EC4B6]" />
    case 'mention':
      return <AtSign className="size-4 text-[#FFBA49]" />
    default:
      return <Bell className="size-4 text-gray-400" />
  }
}

function getNotificationBg(type: string): string {
  switch (type) {
    case 'like':
      return 'bg-[#FF6B6B]/10'
    case 'comment':
      return 'bg-[#2EC4B6]/10'
    case 'follow':
      return 'bg-[#FF8C42]/10'
    case 'friend_request':
      return 'bg-[#2EC4B6]/10'
    case 'friend_request_accepted':
      return 'bg-[#2EC4B6]/10'
    case 'mention':
      return 'bg-[#FFBA49]/10'
    default:
      return 'bg-muted'
  }
}

export default function NotificationsPage() {
  const { currentUser, notifications, setNotifications, setViewingUser, setCurrentView } = useAppStore()
  const [isLoading, setIsLoading] = useState(false)
  const hasFetched = useRef(false)

  useEffect(() => {
    if (currentUser && !hasFetched.current) {
      hasFetched.current = true
      fetchNotifications()
    }
  }, [currentUser])

  const fetchNotifications = async () => {
    if (!currentUser) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/notifications?userId=${currentUser.id}`)
      if (res.ok) {
        const data = await res.json()
        const mapped: NotificationType[] = (data.notifications || []).map((n: Record<string, unknown>) => ({
          id: n.id as string,
          type: n.type as string,
          message: (n.message as string) || '',
          fromUserId: (n.fromUserId as string) || null,
          postId: (n.postId as string) || null,
          read: n.read as boolean,
          createdAt: n.createdAt as string,
          fromUser: n.fromUser ? {
            id: (n.fromUser as { id?: string })?.id || '',
            email: '',
            username: (n.fromUser as { username?: string })?.username || 'unknown',
            name: (n.fromUser as { name?: string })?.name || 'Unknown',
            avatar: (n.fromUser as { avatar?: string | null })?.avatar || null,
            bio: null,
            isPrivate: false,
          } : undefined,
        }))
        setNotifications(mapped)
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleNotificationTap = async (notif: NotificationType) => {
    // Mark as read via API
    if (!notif.read && currentUser) {
      try {
        await fetch('/api/notifications', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notificationId: notif.id, userId: currentUser.id }),
        })
      } catch {
        // Non-critical
      }
    }

    // Update local state
    setNotifications(
      notifications.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
    )

    if (notif.type === 'follow' && notif.fromUser) {
      setViewingUser(notif.fromUser)
      setCurrentView('user-profile')
    } else if (notif.type === 'friend_request') {
      setCurrentView('friends')
    } else if (notif.type === 'friend_request_accepted' && notif.fromUser) {
      setViewingUser(notif.fromUser)
      setCurrentView('user-profile')
    } else if ((notif.type === 'like' || notif.type === 'comment') && notif.postId) {
      setCurrentView('feed')
    }
  }

  const handleMarkAllRead = async () => {
    if (!currentUser) return
    try {
      const res = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }),
      })
      if (res.ok) {
        setNotifications(notifications.map((n) => ({ ...n, read: true })))
        toast.success('All notifications marked as read')
      }
    } catch {
      toast.error('Failed to mark all as read')
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  // Group notifications by time
  const grouped: Record<string, NotificationType[]> = {}
  notifications.forEach((notif) => {
    const group = getTimeGroup(notif.createdAt)
    if (!grouped[group]) grouped[group] = []
    grouped[group].push(notif)
  })

  const groupOrder: ('Today' | 'This Week' | 'Earlier')[] = ['Today', 'This Week', 'Earlier']

  return (
    <div className="max-w-md mx-auto flex flex-col min-h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <h1 className="text-lg font-semibold text-foreground">Notifications</h1>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllRead}
            className="text-xs text-[#2EC4B6] hover:text-[#2EC4B6]/80 h-8"
          >
            <CheckCheck className="size-4 mr-1" />
            Mark all read
          </Button>
        )}
      </div>

      {/* Notifications List */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <NotificationsSkeleton />
        ) : notifications.length === 0 ? (
          <EmptyNotificationsState />
        ) : (
          <div className="pb-4">
            {groupOrder.map((group) => {
              const items = grouped[group]
              if (!items || items.length === 0) return null

              return (
                <div key={group}>
                  <div className="px-4 py-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {group}
                    </span>
                  </div>
                  <AnimatePresence initial={false}>
                    {items.map((notif, index) => (
                      <motion.button
                        key={notif.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: index * 0.03 }}
                        onClick={() => handleNotificationTap(notif)}
                        className={`flex items-start gap-3 w-full px-4 py-3 hover:bg-gray-50 transition-colors outline-none text-left ${
                          !notif.read ? 'bg-[#2EC4B6]/5' : ''
                        }`}
                      >
                        {/* Icon */}
                        <div
                          className={`size-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${getNotificationBg(
                            notif.type
                          )}`}
                        >
                          {getNotificationIcon(notif.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-foreground">
                                {notif.fromUser && (
                                  <span className="font-semibold">
                                    {notif.fromUser.username || 'unknown'}{' '}
                                  </span>
                                )}
                                {notif.message}
                              </p>
                              <span className="text-[11px] text-muted-foreground mt-0.5 block">
                                {formatTimeAgo(notif.createdAt)}
                              </span>
                            </div>
                            {/* Unread dot */}
                            {!notif.read && (
                              <div className="size-2 rounded-full bg-[#2EC4B6] shrink-0 mt-2" />
                            )}
                          </div>
                        </div>

                        {/* From user avatar */}
                        {notif.fromUser && (
                          <Avatar className="size-9 shrink-0 mt-0.5">
                            <AvatarImage
                              src={notif.fromUser.avatar || undefined}
                              alt={notif.fromUser.username || 'User'}
                            />
                            <AvatarFallback className="bg-gradient-to-br from-[#FFBA49]/20 to-[#2EC4B6]/20 text-gray-600 text-xs font-semibold">
                              {(notif.fromUser.username || 'U').charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </motion.button>
                    ))}
                  </AnimatePresence>
                  <Separator className="mx-4" />
                </div>
              )
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}

function NotificationsSkeleton() {
  return (
    <div className="px-4 py-2 flex flex-col gap-3">
      <Skeleton className="h-3 w-16 mb-1" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-2">
          <Skeleton className="size-9 rounded-full" />
          <div className="flex-1 flex flex-col gap-1.5">
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyNotificationsState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-6 min-h-[60vh]">
      <div className="size-20 rounded-full bg-gradient-to-br from-[#FF6B6B]/10 via-[#FF8C42]/10 to-[#FFBA49]/10 flex items-center justify-center mb-4">
        <Bell className="size-10 text-[#FFBA49]" />
      </div>
      <h2 className="text-xl font-bold text-foreground mb-2">
        No Notifications
      </h2>
      <p className="text-sm text-muted-foreground max-w-[250px]">
        Stay updated with likes, comments, and travel activity from fellow travelers.
      </p>
    </div>
  )
}
