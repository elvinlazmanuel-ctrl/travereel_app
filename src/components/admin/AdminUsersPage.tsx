'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Search,
  Ban,
  Trash2,
  Shield,
  Users,
  Loader2,
  Mail,
  MoreHorizontal,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'

interface AdminUser {
  id: string
  email: string
  username: string
  name: string
  avatar: string | null
  bio: string | null
  isPrivate: boolean
  isBanned: boolean
  role: string
  currency?: string
  travelType?: string
  language?: string
  notificationsEnabled?: boolean
  activityStatus?: boolean
  darkMode?: boolean
  createdAt?: string
  _count?: {
    posts: number
    followers: number
    following: number
  }
}

export default function AdminUsersPage() {
  const { currentUser, setCurrentView } = useAppStore()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [filteredUsers, setFilteredUsers] = useState<AdminUser[]>([])
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    title: string
    description: string
    action: () => void
  }>({ open: false, title: '', description: '', action: () => {} })

  const logAdminAction = async (action: string, targetType: string, targetId: string, details?: string) => {
    try {
      await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: currentUser!.id,
          action,
          targetType,
          targetId,
          details: details || null,
        }),
      })
    } catch {
      // Silent fail for logging
    }
  }

  const fetchUsers = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/users${search ? `?search=${search}` : ''}`)
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users || [])
      }
    } catch (err) {
      console.error('Failed to fetch users:', err)
      toast.error('Failed to load users')
    } finally {
      setIsLoading(false)
    }
  }, [search])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  useEffect(() => {
    let filtered = users
    if (roleFilter !== 'all') {
      filtered = filtered.filter((u) => u.role === roleFilter)
    }
    setFilteredUsers(filtered)
  }, [users, roleFilter])

  const handleBan = async (user: AdminUser) => {
    const isBanned = user.isBanned
    setConfirmDialog({
      open: true,
      title: isBanned ? 'Unban User' : 'Ban User',
      description: isBanned
        ? `Are you sure you want to unban @${user.username}?`
        : `Are you sure you want to ban @${user.username}? They will not be able to access their account.`,
      action: async () => {
        try {
          const res = await fetch('/api/users', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, action: isBanned ? 'unban' : 'ban', requestingUserId: currentUser!.id }),
          })
          if (res.ok) {
            setUsers(users.map((u) => u.id === user.id ? { ...u, isBanned: !isBanned } : u))
            toast.success(isBanned ? 'User unbanned' : 'User banned')
            logAdminAction(isBanned ? 'unbanned' : 'banned', 'user', user.id, `@${user.username}`)
          } else {
            toast.error('Failed to update user')
          }
        } catch {
          toast.error('Failed to update user')
        }
      },
    })
  }

  const handleRoleChange = async (user: AdminUser, newRole: string) => {
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, role: newRole, requestingUserId: currentUser!.id }),
      })
      if (res.ok) {
        setUsers(users.map((u) => u.id === user.id ? { ...u, role: newRole } : u))
        toast.success(`Role updated to ${newRole}`)
        logAdminAction('changed role', 'user', user.id, `@${user.username} → ${newRole}`)
      } else {
        toast.error('Failed to update role')
      }
    } catch {
      toast.error('Failed to update role')
    }
  }

  const handleDelete = async (user: AdminUser) => {
    setConfirmDialog({
      open: true,
      title: 'Delete User',
      description: `Are you sure you want to permanently delete @${user.username}? This action cannot be undone.`,
      action: async () => {
        try {
          const res = await fetch(`/api/users?userId=${user.id}&requestingUserId=${currentUser!.id}`, { method: 'DELETE' })
          if (res.ok) {
            setUsers(users.filter((u) => u.id !== user.id))
            toast.success('User deleted')
            logAdminAction('deleted', 'user', user.id, `@${user.username}`)
          } else {
            toast.error('Failed to delete user')
          }
        } catch {
          toast.error('Failed to delete user')
        }
      },
    })
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px]">Admin</Badge>
      case 'moderator':
        return <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px]">Moderator</Badge>
      default:
        return <Badge variant="outline" className="text-[10px]">User</Badge>
    }
  }

  // Auth guard
  if (currentUser?.role !== 'admin') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <Shield className="size-12 text-red-300 mx-auto mb-3" />
        <p className="text-muted-foreground">Access denied</p>
        <Button variant="ghost" onClick={() => setCurrentView('settings')} className="mt-3">
          Go back
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 pb-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentView('admin')}
          className="size-9"
        >
          <ArrowLeft className="size-5 text-foreground" />
        </Button>
        <div className="flex items-center gap-2">
          <Users className="size-5 text-foreground" />
          <h1 className="text-xl font-bold text-foreground">User Management</h1>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            className="pl-9 h-10 rounded-xl border-gray-200"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[130px] h-10 rounded-xl border-gray-200">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="moderator">Moderator</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <p className="text-xs text-muted-foreground mb-3">{filteredUsers.length} users found</p>

      {/* User List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-8 text-gray-400 animate-spin" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Users className="size-12 text-gray-300 mb-3" />
          <p className="text-sm text-muted-foreground">No users found</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {filteredUsers.map((user, index) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-10">
                        <AvatarImage src={user.avatar || undefined} alt={user.username} />
                        <AvatarFallback className="bg-gradient-to-br from-[#FF6B6B]/20 to-[#FF8C42]/20 text-[#FF6B6B] text-sm">
                          {user.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground truncate">{user.name}</span>
                          {getRoleBadge(user.role)}
                          {user.isBanned && (
                            <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px]">
                              <Ban className="size-2.5 mr-0.5" />Banned
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground">@{user.username}</span>
                          <span className="text-[10px] text-gray-400">·</span>
                          <span className="text-[11px] text-gray-400 flex items-center gap-0.5">
                            <Mail className="size-2.5" />
                            {user.email}
                          </span>
                        </div>
                        <div className="flex gap-3 mt-1">
                          <span className="text-[11px] text-gray-400">{user._count?.posts || 0} posts</span>
                          <span className="text-[11px] text-gray-400">{user._count?.followers || 0} followers</span>
                          <span className="text-[11px] text-gray-400">{user._count?.following || 0} following</span>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8">
                            <MoreHorizontal className="size-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => handleBan(user)}>
                            <Ban className="size-4 mr-2" />
                            {user.isBanned ? 'Unban' : 'Ban'}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleRoleChange(user, user.role === 'admin' ? 'user' : 'admin')}>
                            <Shield className="size-4 mr-2" />
                            {user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleRoleChange(user, 'moderator')}>
                            <Shield className="size-4 mr-2" />
                            Make Moderator
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onClick={() => handleDelete(user)}
                          >
                            <Trash2 className="size-4 mr-2" />
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Confirm Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDialog.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={() => {
                confirmDialog.action()
                setConfirmDialog({ ...confirmDialog, open: false })
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
