'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Trash2,
  ShieldBan,
  ShieldCheck,
  Flag,
  Eye,
  X,
  Database,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'

type TableName = 'users' | 'posts' | 'communities' | 'comments' | 'reports' | 'itineraries' | 'stories' | 'messages'

// Dynamic data from API - each table returns different shapes
type DataRow = Record<string, any>

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

const tableOptions: { value: TableName; label: string }[] = [
  { value: 'users', label: 'Users' },
  { value: 'posts', label: 'Posts' },
  { value: 'communities', label: 'Communities' },
  { value: 'comments', label: 'Comments' },
  { value: 'reports', label: 'Reports' },
  { value: 'itineraries', label: 'Itineraries' },
  { value: 'stories', label: 'Stories' },
  { value: 'messages', label: 'Messages' },
]

const statusFilters: Record<TableName, { value: string; label: string }[]> = {
  users: [
    { value: '', label: 'All Users' },
    { value: 'active', label: 'Active' },
    { value: 'banned', label: 'Banned' },
    { value: 'admin', label: 'Admins' },
  ],
  posts: [
    { value: '', label: 'All Posts' },
    { value: 'public', label: 'Public' },
    { value: 'private', label: 'Private' },
    { value: 'flagged', label: 'Flagged' },
  ],
  communities: [
    { value: '', label: 'All Communities' },
  ],
  comments: [
    { value: '', label: 'All Comments' },
  ],
  reports: [
    { value: '', label: 'All Reports' },
    { value: 'pending', label: 'Pending' },
    { value: 'reviewed', label: 'Reviewed' },
    { value: 'dismissed', label: 'Dismissed' },
  ],
  itineraries: [
    { value: '', label: 'All Itineraries' },
    { value: 'published', label: 'Published' },
    { value: 'draft', label: 'Draft' },
  ],
  stories: [
    { value: '', label: 'All Stories' },
  ],
  messages: [
    { value: '', label: 'All Messages' },
  ],
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function truncate(str: string, maxLen: number): string {
  if (!str) return '-'
  return str.length > maxLen ? str.slice(0, maxLen) + '...' : str
}

function StatusBadge({ table, row }: { table: TableName; row: DataRow }) {
  if (table === 'users') {
    if (row.role === 'admin') {
      return <Badge style={{ backgroundColor: '#FF6B6B20', color: '#FF6B6B', borderColor: '#FF6B6B40' }}>Admin</Badge>
    }
    return row.isBanned ? (
      <Badge className="bg-red-100 text-red-700 border-red-200 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400">
        Banned
      </Badge>
    ) : (
      <Badge className="bg-green-100 text-green-700 border-green-200 dark:bg-green-950/30 dark:border-green-800 dark:text-green-400">
        Active
      </Badge>
    )
  }
  if (table === 'posts') {
    return row.isFlagged ? (
      <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-950/30 dark:border-yellow-800 dark:text-yellow-400">
        Flagged
      </Badge>
    ) : row.isPublic ? (
      <Badge className="bg-green-100 text-green-700 border-green-200 dark:bg-green-950/30 dark:border-green-800 dark:text-green-400">
        Public
      </Badge>
    ) : (
      <Badge variant="outline">Private</Badge>
    )
  }
  if (table === 'reports') {
    if (row.status === 'pending') return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-950/30 dark:border-yellow-800 dark:text-yellow-400">Pending</Badge>
    if (row.status === 'reviewed') return <Badge className="bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-400">Reviewed</Badge>
    return <Badge variant="outline">Dismissed</Badge>
  }
  if (table === 'itineraries') {
    if (row.status === 'published') return <Badge className="bg-green-100 text-green-700 border-green-200 dark:bg-green-950/30 dark:border-green-800 dark:text-green-400">Published</Badge>
    return <Badge variant="outline">Draft</Badge>
  }
  return null
}

export default function DataTablePage() {
  const [table, setTable] = useState<TableName>('users')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [status, setStatus] = useState('_all')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<DataRow[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        table,
        search,
        status: status === '_all' ? '' : status,
        page: page.toString(),
        limit: '10',
      })
      const res = await fetch(`/api/superadmin/data?${params}`)
      if (res.ok) {
        const result = await res.json()
        setData(result.data || [])
        setPagination(result.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 })
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }, [table, search, status, page])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchInput])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [table, status])

  const handleDelete = async (id: string) => {
    setActionLoading(id)
    try {
      const res = await fetch(`/api/superadmin/data?table=${table}&id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Record deleted successfully')
        fetchData()
      } else {
        const result = await res.json()
        toast.error(result.error || 'Failed to delete')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setActionLoading(null)
    }
  }

  const handleUpdate = async (id: string, updateData: Record<string, unknown>) => {
    setActionLoading(id)
    try {
      const res = await fetch('/api/superadmin/data', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table, id, data: updateData }),
      })
      if (res.ok) {
        toast.success('Record updated successfully')
        fetchData()
      } else {
        const result = await res.json()
        toast.error(result.error || 'Failed to update')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setActionLoading(null)
    }
  }

  const renderTableHeaders = () => {
    switch (table) {
      case 'users':
        return (
          <>
            <TableHead>Username</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </>
        )
      case 'posts':
        return (
          <>
            <TableHead>Caption</TableHead>
            <TableHead>Author</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </>
        )
      case 'communities':
        return (
          <>
            <TableHead>Name</TableHead>
            <TableHead>Members</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </>
        )
      case 'comments':
        return (
          <>
            <TableHead>Content</TableHead>
            <TableHead>Author</TableHead>
            <TableHead>Post</TableHead>
            <TableHead>Likes</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </>
        )
      case 'reports':
        return (
          <>
            <TableHead>Post</TableHead>
            <TableHead>Reporter</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </>
        )
      case 'itineraries':
        return (
          <>
            <TableHead>Title</TableHead>
            <TableHead>Country</TableHead>
            <TableHead>Author</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Budget</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </>
        )
      case 'stories':
        return (
          <>
            <TableHead>Caption</TableHead>
            <TableHead>Author</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Expires</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </>
        )
      case 'messages':
        return (
          <>
            <TableHead>Content</TableHead>
            <TableHead>Sender</TableHead>
            <TableHead>Chat Room</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </>
        )
    }
  }

  const renderTableRow = (row: DataRow) => {
    const isLoading = actionLoading === row.id

    switch (table) {
      case 'users':
        return (
          <TableRow key={String(row.id)}>
            <TableCell className="font-medium text-foreground">@{row.username || '-'}</TableCell>
            <TableCell className="text-muted-foreground text-xs">{row.email}</TableCell>
            <TableCell>{row.name || '-'}</TableCell>
            <TableCell>
              <Badge variant="outline" className="text-xs">{row.role}</Badge>
            </TableCell>
            <TableCell><StatusBadge table={table} row={row} /></TableCell>
            <TableCell className="text-xs text-muted-foreground">{formatDate(row.createdAt)}</TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleUpdate(String(row.id), { isBanned: !row.isBanned })}
                  disabled={isLoading}
                  className={row.isBanned ? 'text-green-600 hover:text-green-700' : 'text-red-600 hover:text-red-700'}
                >
                  {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : row.isBanned ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldBan className="w-3.5 h-3.5" />}
                  <span className="ml-1 hidden sm:inline">{row.isBanned ? 'Unban' : 'Ban'}</span>
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" disabled={isLoading}>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="ml-1 hidden sm:inline">Delete</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete User</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete user &quot;@{row.username}&quot;? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(String(row.id))} className="bg-red-600 hover:bg-red-700">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </TableCell>
          </TableRow>
        )

      case 'posts':
        return (
          <TableRow key={String(row.id)}>
            <TableCell className="max-w-[200px] truncate font-medium">{truncate(row.caption, 50)}</TableCell>
            <TableCell className="text-sm">{row.author?.name || row.author?.username || '-'}</TableCell>
            <TableCell className="text-sm text-muted-foreground">{row.location || '-'}</TableCell>
            <TableCell><StatusBadge table={table} row={row} /></TableCell>
            <TableCell className="text-xs text-muted-foreground">{formatDate(row.createdAt)}</TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleUpdate(String(row.id), { isFlagged: !row.isFlagged })}
                  disabled={isLoading}
                  className={row.isFlagged ? 'text-green-600' : 'text-yellow-600'}
                >
                  {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : row.isFlagged ? <Eye className="w-3.5 h-3.5" /> : <Flag className="w-3.5 h-3.5" />}
                  <span className="ml-1 hidden sm:inline">{row.isFlagged ? 'Unflag' : 'Flag'}</span>
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" disabled={isLoading}>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="ml-1 hidden sm:inline">Delete</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Post</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this post? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(String(row.id))} className="bg-red-600 hover:bg-red-700">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </TableCell>
          </TableRow>
        )

      case 'communities':
        return (
          <TableRow key={String(row.id)}>
            <TableCell className="font-medium">{row.name}</TableCell>
            <TableCell>{typeof row.members === 'number' ? row.members.toLocaleString() : String(row.members)}</TableCell>
            <TableCell><Badge variant="outline">{row.category || '-'}</Badge></TableCell>
            <TableCell className="text-xs text-muted-foreground">{formatDate(row.createdAt)}</TableCell>
            <TableCell className="text-right">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" disabled={isLoading}>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="ml-1 hidden sm:inline">Delete</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Community</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete community &quot;{row.name}&quot;? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(String(row.id))} className="bg-red-600 hover:bg-red-700">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </TableCell>
          </TableRow>
        )

      case 'comments':
        return (
          <TableRow key={String(row.id)}>
            <TableCell className="max-w-[200px] truncate">{truncate(row.content, 60)}</TableCell>
            <TableCell className="text-sm">{row.author?.name || row.author?.username || '-'}</TableCell>
            <TableCell className="text-xs text-muted-foreground">{truncate(row.post?.caption, 30) || '-'}</TableCell>
            <TableCell className="text-sm">{row.likesCount ?? 0}</TableCell>
            <TableCell className="text-xs text-muted-foreground">{formatDate(row.createdAt)}</TableCell>
            <TableCell className="text-right">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" disabled={isLoading}>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="ml-1 hidden sm:inline">Delete</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Comment</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this comment? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(String(row.id))} className="bg-red-600 hover:bg-red-700">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </TableCell>
          </TableRow>
        )

      case 'reports':
        return (
          <TableRow key={String(row.id)}>
            <TableCell className="max-w-[150px] truncate text-sm">{truncate(row.post?.caption, 30) || '-'}</TableCell>
            <TableCell className="text-sm">{row.reporter?.name || row.reporter?.username || '-'}</TableCell>
            <TableCell className="max-w-[200px] truncate text-sm">{truncate(row.reason, 50)}</TableCell>
            <TableCell><StatusBadge table={table} row={row} /></TableCell>
            <TableCell className="text-xs text-muted-foreground">{formatDate(row.createdAt)}</TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-1">
                {row.status === 'pending' && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUpdate(String(row.id), { status: 'reviewed' })}
                      disabled={isLoading}
                      className="text-blue-600"
                    >
                      {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
                      <span className="ml-1 hidden sm:inline">Review</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUpdate(String(row.id), { status: 'dismissed' })}
                      disabled={isLoading}
                      className="text-muted-foreground"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span className="ml-1 hidden sm:inline">Dismiss</span>
                    </Button>
                  </>
                )}
                {row.status === 'reviewed' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUpdate(String(row.id), { status: 'dismissed' })}
                    disabled={isLoading}
                    className="text-muted-foreground"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span className="ml-1 hidden sm:inline">Dismiss</span>
                  </Button>
                )}
                {row.status === 'dismissed' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUpdate(String(row.id), { status: 'reviewed' })}
                    disabled={isLoading}
                    className="text-blue-600"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span className="ml-1 hidden sm:inline">Reopen</span>
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        )

      case 'itineraries':
        return (
          <TableRow key={String(row.id)}>
            <TableCell className="font-medium">{truncate(row.title, 40)}</TableCell>
            <TableCell className="text-sm">{row.country || '-'}</TableCell>
            <TableCell className="text-sm">{row.author?.name || row.author?.username || '-'}</TableCell>
            <TableCell><StatusBadge table={table} row={row} /></TableCell>
            <TableCell className="text-sm">{row.budget ? `$${row.budget}` : '-'}</TableCell>
            <TableCell className="text-xs text-muted-foreground">{formatDate(row.createdAt)}</TableCell>
            <TableCell className="text-right">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" disabled={isLoading}>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="ml-1 hidden sm:inline">Delete</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Itinerary</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete itinerary &quot;{row.title}&quot;? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(String(row.id))} className="bg-red-600 hover:bg-red-700">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </TableCell>
          </TableRow>
        )

      case 'stories':
        return (
          <TableRow key={String(row.id)}>
            <TableCell className="max-w-[200px] truncate font-medium">{truncate(row.caption, 50) || 'No caption'}</TableCell>
            <TableCell className="text-sm">{row.author?.name || row.author?.username || '-'}</TableCell>
            <TableCell><Badge variant="outline">{row.mediaType || 'image'}</Badge></TableCell>
            <TableCell className="text-xs text-muted-foreground">{row.expiresAt ? formatDate(row.expiresAt) : '-'}</TableCell>
            <TableCell className="text-xs text-muted-foreground">{formatDate(row.createdAt)}</TableCell>
            <TableCell className="text-right">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" disabled={isLoading}>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="ml-1 hidden sm:inline">Delete</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Story</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this story? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(String(row.id))} className="bg-red-600 hover:bg-red-700">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </TableCell>
          </TableRow>
        )

      case 'messages':
        return (
          <TableRow key={String(row.id)}>
            <TableCell className="max-w-[200px] truncate">{truncate(row.content, 60)}</TableCell>
            <TableCell className="text-sm">{row.sender?.name || row.sender?.username || '-'}</TableCell>
            <TableCell className="text-xs text-muted-foreground">
              {row.chatRoom?.name || (row.chatRoom?.isGroup ? 'Group Chat' : 'DM')}
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">{formatDate(row.createdAt)}</TableCell>
            <TableCell className="text-right">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" disabled={isLoading}>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="ml-1 hidden sm:inline">Delete</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Message</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this message? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(String(row.id))} className="bg-red-600 hover:bg-red-700">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </TableCell>
          </TableRow>
        )
    }
  }

  return (
    <div className="space-y-4">
      {/* Table selector tabs */}
      <div className="flex flex-wrap gap-2">
        {tableOptions.map((opt) => (
          <Button
            key={opt.value}
            variant={table === opt.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setTable(opt.value)
              setStatus('_all')
              setSearchInput('')
              setSearch('')
            }}
            style={table === opt.value ? { backgroundColor: '#FF6B6B' } : undefined}
            className={table === opt.value ? 'border-0' : ''}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      {/* Filters row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        {statusFilters[table] && statusFilters[table].length > 1 && (
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              {statusFilters[table].map((opt) => (
                <SelectItem key={opt.value || '_all'} value={opt.value || '_all'}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <div className="text-sm text-muted-foreground self-center">
          {pagination.total} record{pagination.total !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Data table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-16">
              <Database className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground text-sm">No data found</p>
              <p className="text-muted-foreground/60 text-xs mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {renderTableHeaders()}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {data.map((row) => (
                      <motion.tr
                        key={String(row.id)}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-muted/50 border-b transition-colors"
                      >
                        {renderTableRow(row)}
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages || loading}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
