'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Shield, UserMinus, Loader2, AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface BlockedUser {
  id: string
  blockedId: string
  type: 'block' | 'mute'
  createdAt: string
  blocked: {
    id: string
    username: string
    name: string
    avatar: string | null
  }
}

export default function BlockedUsersManagement() {
  const { currentUser } = useAppStore()
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [unblockingId, setUnblockingId] = useState<string | null>(null)
  const [unblockDialog, setUnblockDialog] = useState<{
    open: boolean
    userId: string
    username: string
    name: string
  }>({ open: false, userId: '', username: '', name: '' })

  useEffect(() => {
    if (currentUser) {
      fetchBlockedUsers()
    }
  }, [currentUser])

  const fetchBlockedUsers = async () => {
    if (!currentUser) return
    
    setIsLoading(true)
    try {
      const res = await fetch(`/api/blocks?userId=${currentUser.id}`)
      if (res.ok) {
        const data = await res.json()
        setBlockedUsers(data.blocks || [])
      }
    } catch (error) {
      console.error('Failed to fetch blocked users:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnblockClick = (user: BlockedUser) => {
    setUnblockDialog({
      open: true,
      userId: user.blockedId,
      username: user.blocked.username,
      name: user.blocked.name,
    })
  }

  const handleUnblockConfirm = async () => {
    if (!currentUser || !unblockDialog.userId) return

    setUnblockingId(unblockDialog.userId)
    try {
      const res = await fetch(
        `/api/blocks?userId=${currentUser.id}&blockedId=${unblockDialog.userId}&type=block`,
        { method: 'DELETE' }
      )

      if (res.ok) {
        setBlockedUsers(prev => prev.filter(b => b.blockedId !== unblockDialog.userId))
        setUnblockDialog({ open: false, userId: '', username: '', name: '' })
      }
    } catch (error) {
      console.error('Failed to unblock user:', error)
    } finally {
      setUnblockingId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="size-6 animate-spin text-[#2F5C9B]" />
        <span className="ml-2 text-sm text-[#4A5568]">Loading blocked users...</span>
      </div>
    )
  }

  if (blockedUsers.length === 0) {
    return (
      <div className="text-center py-8">
        <Shield className="size-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-[#0B0B2A] mb-2">No Blocked Users</h3>
        <p className="text-sm text-[#4A5568]">
          Users you block will appear here. Blocking prevents them from viewing your profile or interacting with you.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="size-6 text-[#2F5C9B]" />
        <div>
          <h3 className="text-lg font-semibold text-[#0B0B2A]">Blocked Users</h3>
          <p className="text-sm text-[#4A5568]">
            {blockedUsers.length} {blockedUsers.length === 1 ? 'user' : 'users'} blocked
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {blockedUsers.map((block) => (
          <div
            key={block.id}
            className="flex items-center justify-between p-4 rounded-xl bg-white border border-gray-200 hover:border-[#2F5C9B]/30 transition-all"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Avatar className="size-12">
                <AvatarImage src={block.blocked.avatar || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-[#2F5C9B] to-[#5CA5CD] text-white">
                  {block.blocked.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#0B0B2A] truncate">
                  {block.blocked.name}
                </p>
                <p className="text-sm text-[#4A5568] truncate">
                  @{block.blocked.username}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Blocked {new Date(block.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleUnblockClick(block)}
              disabled={unblockingId === block.blockedId}
              className="flex-shrink-0 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
            >
              {unblockingId === block.blockedId ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-1" />
                  Unblocking...
                </>
              ) : (
                <>
                  <UserMinus className="size-4 mr-1" />
                  Unblock
                </>
              )}
            </Button>
          </div>
        ))}
      </div>

      {/* Unblock Confirmation Dialog */}
      <Dialog open={unblockDialog.open} onOpenChange={(open) => setUnblockDialog(prev => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-amber-500" />
              Unblock User?
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to unblock <strong>{unblockDialog.name}</strong> (@{unblockDialog.username})? 
              They will be able to view your profile and interact with you again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setUnblockDialog({ open: false, userId: '', username: '', name: '' })}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUnblockConfirm}
              className="flex-1 bg-gradient-to-r from-[#2F5C9B] to-[#5CA5CD] hover:from-[#2F5C9B]/90 hover:to-[#5CA5CD]/90"
            >
              Yes, Unblock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
