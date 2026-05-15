'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Search,
  Trash2,
  Flag,
  Eye,
  FileText,
  Loader2,
  MoreHorizontal,
  AlertTriangle,
  MapPin,
  X,
  Calendar,
  Tag,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Separator } from '@/components/ui/separator'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'

interface AdminPost {
  id: string
  caption: string | null
  images: string[]
  isPublic: boolean
  isMemory: boolean
  isFlagged?: boolean
  location: string | null
  latitude?: number | null
  longitude?: number | null
  tags: string[]
  authorId: string
  author: {
    id: string
    email: string
    username: string
    name: string
    avatar: string | null
    bio: string | null
    isPrivate: boolean
  }
  createdAt: string
  likes: number
  comments: number
  isLiked: boolean
  reportCount?: number
}

export default function AdminPostsPage() {
  const { currentUser, setCurrentView, setViewingUser } = useAppStore()
  const [posts, setPosts] = useState<AdminPost[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    title: string
    description: string
    action: () => void
  }>({ open: false, title: '', description: '', action: () => {} })

  // Detail dialog
  const [detailPost, setDetailPost] = useState<AdminPost | null>(null)

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

  const fetchPosts = useCallback(async () => {
    setIsLoading(true)
    try {
      const [postsRes, reportsRes] = await Promise.all([
        fetch('/api/posts'),
        fetch('/api/reports'),
      ])

      let adminPosts: AdminPost[] = []
      let reportCounts: Record<string, number> = {}

      if (postsRes.ok) {
        const data = await postsRes.json()
        adminPosts = (data.posts || []).map((p: Record<string, unknown>) => ({
          id: p.id as string,
          caption: (p.caption as string) || null,
          images: Array.isArray(p.images) ? p.images : [],
          isPublic: p.isPublic as boolean,
          isMemory: false,
          isFlagged: (p.isFlagged as boolean) || false,
          location: (p.location as string) || null,
          tags: Array.isArray(p.tags) ? p.tags : [],
          authorId: p.authorId as string,
          author: {
            id: (p.author as Record<string, unknown>)?.id as string || '',
            email: ((p.author as Record<string, unknown>)?.email as string) || '',
            username: (p.author as Record<string, unknown>)?.username as string || '',
            name: (p.author as Record<string, unknown>)?.name as string || '',
            avatar: ((p.author as Record<string, unknown>)?.avatar as string) || null,
            bio: null,
            isPrivate: false,
          },
          createdAt: p.createdAt as string,
          likes: (p._count as Record<string, number>)?.likes || 0,
          comments: (p._count as Record<string, number>)?.comments || 0,
          isLiked: false,
          reportCount: (p.reportCount as number) || 0,
        }))
      }

      if (reportsRes.ok) {
        const data = await reportsRes.json()
        reportCounts = data.reportCounts || {}
      }

      // Merge report counts
      adminPosts = adminPosts.map((p) => ({
        ...p,
        reportCount: reportCounts[p.id] || p.reportCount || 0,
      }))

      setPosts(adminPosts)
    } catch (err) {
      console.error('Failed to fetch posts:', err)
      toast.error('Failed to load posts')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  const filteredPosts = posts.filter((post) => {
    if (search) {
      const s = search.toLowerCase()
      const match = post.caption?.toLowerCase().includes(s) ||
        post.author.username.toLowerCase().includes(s) ||
        post.author.name.toLowerCase().includes(s)
      if (!match) return false
    }
    if (filter === 'reported') return (post.reportCount || 0) > 0
    if (filter === 'flagged') return post.isFlagged
    return true
  })

  const handleRemove = (post: AdminPost) => {
    setConfirmDialog({
      open: true,
      title: 'Remove Post',
      description: 'Are you sure you want to remove this post? This action cannot be undone.',
      action: async () => {
        try {
          const res = await fetch(`/api/posts?id=${post.id}&requestingUserId=${currentUser!.id}`, { method: 'DELETE' })
          if (res.ok) {
            setPosts(posts.filter((p) => p.id !== post.id))
            toast.success('Post removed')
            logAdminAction('deleted', 'post', post.id, `by @${post.author.username}`)
          } else {
            toast.error('Failed to remove post')
          }
        } catch {
          toast.error('Failed to remove post')
        }
      },
    })
  }

  const handleFlag = async (post: AdminPost) => {
    const newFlagged = !post.isFlagged
    try {
      const res = await fetch('/api/posts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: post.id, isFlagged: newFlagged, requestingUserId: currentUser!.id }),
      })
      if (res.ok) {
        setPosts(posts.map((p) =>
          p.id === post.id ? { ...p, isFlagged: newFlagged } : p
        ))
        toast.success(post.isFlagged ? 'Post unflagged' : 'Post flagged for review')
        logAdminAction(newFlagged ? 'flagged' : 'unflagged', 'post', post.id)
      } else {
        toast.error('Failed to update post')
      }
    } catch {
      toast.error('Failed to update post')
    }
  }

  const handleViewAuthor = (post: AdminPost) => {
    setViewingUser(post.author)
    setCurrentView('user-profile')
  }

  // Auth guard
  if (currentUser?.role !== 'admin') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <FileText className="size-12 text-red-300 mx-auto mb-3" />
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
          <FileText className="size-5 text-foreground" />
          <h1 className="text-xl font-bold text-foreground">Post Management</h1>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search posts..."
            className="pl-9 h-10 rounded-xl border-gray-200"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[130px] h-10 rounded-xl border-gray-200">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Posts</SelectItem>
            <SelectItem value="reported">Reported</SelectItem>
            <SelectItem value="flagged">Flagged</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <p className="text-xs text-muted-foreground mb-3">{filteredPosts.length} posts found</p>

      {/* Post List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-8 text-gray-400 animate-spin" />
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="size-12 text-gray-300 mb-3" />
          <p className="text-sm text-muted-foreground">No posts found</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {filteredPosts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <Card className={`border-0 shadow-sm ${post.isFlagged ? 'ring-1 ring-amber-200' : ''}`}>
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      {/* Thumbnail */}
                      <div className="size-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        {post.images?.[0] ? (
                          <img
                            src={post.images[0]}
                            alt="Post thumbnail"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FileText className="size-5 text-gray-300" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <button
                            onClick={() => handleViewAuthor(post)}
                            className="text-sm font-medium text-foreground hover:text-[#FF6B6B] transition-colors"
                          >
                            @{post.author.username}
                          </button>
                          {(post.reportCount || 0) > 0 && (
                            <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px]">
                              <AlertTriangle className="size-2.5 mr-0.5" />
                              {post.reportCount} reports
                            </Badge>
                          )}
                          {post.isFlagged && (
                            <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px]">
                              <Flag className="size-2.5 mr-0.5" />
                              Flagged
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{post.caption || 'No caption'}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-[11px] text-gray-400">❤ {post.likes}</span>
                          <span className="text-[11px] text-gray-400">💬 {post.comments}</span>
                          {post.location && (
                            <span className="text-[11px] text-gray-400 flex items-center gap-0.5">
                              <MapPin className="size-2.5" />
                              {post.location}
                            </span>
                          )}
                          <span className="text-[11px] text-gray-400">
                            {new Date(post.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8 flex-shrink-0">
                            <MoreHorizontal className="size-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => setDetailPost(post)}>
                            <Eye className="size-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleFlag(post)}>
                            <Flag className="size-4 mr-2" />
                            {post.isFlagged ? 'Unflag' : 'Flag'} Post
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onClick={() => handleRemove(post)}
                          >
                            <Trash2 className="size-4 mr-2" />
                            Remove Post
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

      {/* Post Detail Dialog */}
      <Dialog open={!!detailPost} onOpenChange={() => setDetailPost(null)}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="size-4" />
              Post Details
            </DialogTitle>
          </DialogHeader>
          {detailPost && (
            <div className="space-y-4">
              {/* Author */}
              <div className="flex items-center gap-3">
                <Avatar className="size-10">
                  <AvatarImage src={detailPost.author.avatar || undefined} alt={detailPost.author.username} />
                  <AvatarFallback>{detailPost.author.username[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-foreground">{detailPost.author.name}</p>
                  <p className="text-xs text-muted-foreground">@{detailPost.author.username}</p>
                </div>
                {detailPost.isFlagged && (
                  <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px] ml-auto">
                    <Flag className="size-2.5 mr-0.5" />Flagged
                  </Badge>
                )}
              </div>

              {/* Image */}
              {detailPost.images?.[0] && (
                <div className="rounded-xl overflow-hidden">
                  <img
                    src={detailPost.images[0]}
                    alt="Post"
                    className="w-full h-48 object-cover"
                  />
                </div>
              )}

              {/* Caption */}
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase">Caption</label>
                <p className="text-sm text-foreground mt-1">{detailPost.caption || 'No caption'}</p>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-muted-foreground">Likes</p>
                  <p className="text-lg font-bold text-foreground">{detailPost.likes}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-muted-foreground">Comments</p>
                  <p className="text-lg font-bold text-foreground">{detailPost.comments}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-muted-foreground">Reports</p>
                  <p className="text-lg font-bold text-foreground">{detailPost.reportCount || 0}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="text-sm font-bold text-foreground">{detailPost.isFlagged ? 'Flagged' : 'Normal'}</p>
                </div>
              </div>

              {/* Location */}
              {detailPost.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="size-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{detailPost.location}</span>
                </div>
              )}

              {/* Tags */}
              {detailPost.tags && detailPost.tags.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
                    <Tag className="size-3" /> Tags
                  </label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {detailPost.tags.map((tag) => (
                      <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Date */}
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Calendar className="size-3" />
                {new Date(detailPost.createdAt).toLocaleString()}
              </div>

              <Separator />

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 rounded-xl"
                  onClick={() => {
                    handleFlag(detailPost)
                    setDetailPost(null)
                  }}
                >
                  <Flag className="size-4 mr-1" />
                  {detailPost.isFlagged ? 'Unflag' : 'Flag'}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex-1 rounded-xl"
                  onClick={() => {
                    handleRemove(detailPost)
                    setDetailPost(null)
                  }}
                >
                  <Trash2 className="size-4 mr-1" />
                  Remove
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
