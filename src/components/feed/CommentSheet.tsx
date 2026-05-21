'use client'

import { useState, useEffect, useRef, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Loader2, Heart, Trash2, CornerDownRight, X, ChevronDown, ChevronUp, MoreHorizontal, Pencil, Check } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import { useAppStore, type CommentType, type Post } from '@/lib/store'
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
  if (diffMin < 60) return `${diffMin}m`
  if (diffHr < 24) return `${diffHr}h`
  if (diffDay < 7) return `${diffDay}d`
  return `${diffWk}w`
}

interface CommentSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  post: Post
}

export const CommentSheet = memo(function CommentSheet({ open, onOpenChange, post }: CommentSheetProps) {
  const { currentUser, blockedIds } = useAppStore()
  const [comments, setComments] = useState<CommentType[]>([])
  const [newComment, setNewComment] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [replyingTo, setReplyingTo] = useState<CommentType | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set())
  const [commentsCursor, setCommentsCursor] = useState<string | null>(null)
  const [commentsHasMore, setCommentsHasMore] = useState(true)
  const [isLoadingMoreComments, setIsLoadingMoreComments] = useState(false)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const editInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open && post.id) {
      fetchComments()
    }
    if (!open) {
      setReplyingTo(null)
      setExpandedThreads(new Set())
      setEditingCommentId(null)
      setDeleteConfirmId(null)
      setCommentsCursor(null)
      setCommentsHasMore(true)
    }
  }, [open, post.id])

  useEffect(() => {
    if (editingCommentId && editInputRef.current) {
      editInputRef.current.focus()
    }
  }, [editingCommentId])

  const fetchComments = async () => {
    setIsLoading(true)
    setCommentsCursor(null)
    setCommentsHasMore(true)
    try {
      const blockedIdsParam = blockedIds.length > 0 ? `&blockedIds=${blockedIds.join(',')}` : ''
      const res = await fetch(`/api/comments?postId=${post.id}&limit=20${blockedIdsParam}`)
      if (res.ok) {
        const data = await res.json()
        const rawComments: CommentType[] = (data.comments || []).map((c: Record<string, unknown>) => ({
          id: c.id as string,
          content: c.content as string,
          authorId: c.authorId as string,
          postId: c.postId as string,
          parentId: (c.parentId as string) || null,
          likesCount: (c.likesCount as number) || 0,
          createdAt: c.createdAt as string,
          author: {
            id: (c.author as { id: string }).id,
            email: (c.author as { email: string }).email || '',
            username: (c.author as { username: string }).username,
            name: (c.author as { name: string }).name,
            avatar: (c.author as { avatar: string | null }).avatar,
            bio: null,
            isPrivate: false,
          },
        }))

        // Organize into parent + nested replies
        const parentComments = rawComments.filter((c) => !c.parentId)
        const repliesMap: Record<string, CommentType[]> = {}
        rawComments.forEach((c) => {
          if (c.parentId) {
            if (!repliesMap[c.parentId]) repliesMap[c.parentId] = []
            repliesMap[c.parentId].push(c)
          }
        })

        const organized = parentComments.map((parent) => ({
          ...parent,
          replies: repliesMap[parent.id] || [],
        }))

        setComments(organized)
        setCommentsCursor(data.nextCursor || null)
        setCommentsHasMore(data.hasMore !== false)
      }
    } catch (err) {
      console.error('Failed to fetch comments:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const loadMoreComments = async () => {
    if (isLoadingMoreComments || !commentsHasMore || !commentsCursor) return
    setIsLoadingMoreComments(true)
    try {
      const blockedIdsParam = blockedIds.length > 0 ? `&blockedIds=${blockedIds.join(',')}` : ''
      const res = await fetch(`/api/comments?postId=${post.id}&cursor=${commentsCursor}&limit=20${blockedIdsParam}`)
      if (res.ok) {
        const data = await res.json()
        const rawComments: CommentType[] = (data.comments || []).map((c: Record<string, unknown>) => ({
          id: c.id as string,
          content: c.content as string,
          authorId: c.authorId as string,
          postId: c.postId as string,
          parentId: (c.parentId as string) || null,
          likesCount: (c.likesCount as number) || 0,
          createdAt: c.createdAt as string,
          author: {
            id: (c.author as { id: string }).id,
            email: (c.author as { email: string }).email || '',
            username: (c.author as { username: string }).username,
            name: (c.author as { name: string }).name,
            avatar: (c.author as { avatar: string | null }).avatar,
            bio: null,
            isPrivate: false,
          },
        }))

        // Organize new comments into parent + nested replies
        const parentComments = rawComments.filter((c) => !c.parentId)
        const repliesMap: Record<string, CommentType[]> = {}
        rawComments.forEach((c) => {
          if (c.parentId) {
            if (!repliesMap[c.parentId]) repliesMap[c.parentId] = []
            repliesMap[c.parentId].push(c)
          }
        })

        const newOrganized = parentComments.map((parent) => ({
          ...parent,
          replies: repliesMap[parent.id] || [],
        }))

        setComments([...comments, ...newOrganized])
        setCommentsCursor(data.nextCursor || null)
        setCommentsHasMore(data.hasMore !== false)
      }
    } catch (err) {
      console.error('Failed to load more comments:', err)
    } finally {
      setIsLoadingMoreComments(false)
    }
  }

  const handleSubmit = async () => {
    if (!newComment.trim() || !currentUser) return
    setIsSubmitting(true)
    try {
      const body: Record<string, string> = {
        content: newComment.trim(),
        authorId: currentUser.id,
        postId: post.id,
      }
      if (replyingTo) {
        body.parentId = replyingTo.parentId || replyingTo.id
      }

      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        const data = await res.json()
        const actualParentId = replyingTo ? (replyingTo.parentId || replyingTo.id) : null
        const newCommentObj: CommentType = {
          id: data.comment?.id || Date.now().toString(),
          content: newComment.trim(),
          authorId: currentUser.id,
          postId: post.id,
          parentId: actualParentId,
          likesCount: 0,
          createdAt: new Date().toISOString(),
          author: {
            id: currentUser.id,
            email: currentUser.email,
            username: currentUser.username,
            name: currentUser.name,
            avatar: currentUser.avatar,
            bio: null,
            isPrivate: false,
          },
          replies: [],
        }

        if (actualParentId) {
          setComments(comments.map((c) =>
            c.id === actualParentId
              ? { ...c, replies: [...(c.replies || []), newCommentObj] }
              : c
          ))
          setExpandedThreads((prev) => {
            const next = new Set(prev)
            next.add(actualParentId)
            return next
          })
        } else {
          setComments([newCommentObj, ...comments])
        }

        setNewComment('')
        setReplyingTo(null)
        toast.success('Comment added!')
      }
    } catch (err) {
      console.error('Failed to post comment:', err)
      toast.error('Failed to post comment')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!currentUser) return
    setDeletingId(commentId)
    try {
      const res = await fetch(`/api/comments?commentId=${commentId}&userId=${currentUser.id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setComments(comments
          .filter((c) => c.id !== commentId)
          .map((c) => ({
            ...c,
            replies: (c.replies || []).filter((r) => r.id !== commentId),
          }))
        )
        toast.success('Comment deleted')
      } else {
        toast.error('Failed to delete comment')
      }
    } catch {
      toast.error('Failed to delete comment')
    } finally {
      setDeletingId(null)
      setDeleteConfirmId(null)
    }
  }

  const handleEditComment = (comment: CommentType) => {
    setEditingCommentId(comment.id)
    setEditContent(comment.content)
  }

  const handleSaveEdit = async (commentId: string) => {
    if (!currentUser || !editContent.trim()) return
    setIsSavingEdit(true)
    try {
      const res = await fetch('/api/comments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commentId,
          content: editContent.trim(),
          authorId: currentUser.id,
        }),
      })
      if (res.ok) {
        // Update the comment in the local state
        setComments(comments.map((c) => {
          if (c.id === commentId) {
            return { ...c, content: editContent.trim() }
          }
          // Check replies
          if (c.replies?.some((r) => r.id === commentId)) {
            return {
              ...c,
              replies: c.replies.map((r) =>
                r.id === commentId ? { ...r, content: editContent.trim() } : r
              ),
            }
          }
          return c
        }))
        setEditingCommentId(null)
        setEditContent('')
        toast.success('Comment updated')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to edit comment')
      }
    } catch {
      toast.error('Failed to edit comment')
    } finally {
      setIsSavingEdit(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingCommentId(null)
    setEditContent('')
  }

  const handleReply = (comment: CommentType) => {
    setReplyingTo(comment)
    inputRef.current?.focus()
  }

  const toggleThread = (commentId: string) => {
    setExpandedThreads((prev) => {
      const next = new Set(prev)
      if (next.has(commentId)) {
        next.delete(commentId)
      } else {
        next.add(commentId)
      }
      return next
    })
  }

  const renderCommentActions = (comment: CommentType) => {
    const isOwnComment = currentUser?.id === comment.authorId
    if (!isOwnComment) return null

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="size-6 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Comment options"
          >
            <MoreHorizontal className="size-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36">
          <DropdownMenuItem
            onClick={() => handleEditComment(comment)}
            className="gap-2 text-sm"
          >
            <Pencil className="size-3.5" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setDeleteConfirmId(comment.id)}
            variant="destructive"
            className="gap-2 text-sm"
          >
            <Trash2 className="size-3.5" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  const renderReply = (reply: CommentType, parentUsername: string) => {
    const isEditing = editingCommentId === reply.id

    return (
      <motion.div
        key={reply.id}
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
        className="flex gap-2.5"
      >
        <Avatar className="flex-shrink-0 size-6 mt-0.5">
          <AvatarImage src={reply.author.avatar || undefined} alt={reply.author.username} />
          <AvatarFallback className="bg-muted text-[10px]">
            {reply.author.username.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1">
            <div className="flex-1 min-w-0">
              <AnimatePresence mode="wait">
                {isEditing ? (
                  <motion.div
                    key="editing"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-1.5"
                  >
                    <Input
                      ref={editInputRef}
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="h-8 text-sm rounded-md border-[#2F5C9B]/40 focus:border-[#2F5C9B] focus:ring-[#2F5C9B]/20 bg-white"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleSaveEdit(reply.id)
                        }
                        if (e.key === 'Escape') {
                          handleCancelEdit()
                        }
                      }}
                    />
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        className="h-6 px-2.5 text-[11px] rounded-md bg-[#2F5C9B] hover:bg-[#2F5C9B]/90 text-white"
                        onClick={() => handleSaveEdit(reply.id)}
                        disabled={isSavingEdit || !editContent.trim()}
                      >
                        {isSavingEdit ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          <Check className="size-3" />
                        )}
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2.5 text-[11px] rounded-md text-muted-foreground hover:text-foreground"
                        onClick={handleCancelEdit}
                      >
                        Cancel
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="display"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                  >
                    <p className="text-sm leading-relaxed">
                      <span className="font-semibold text-foreground">{reply.author.username}</span>{' '}
                      {reply.author.username !== parentUsername && (
                        <>
                          <span className="text-[#2F5C9B]/70 font-medium text-xs mr-0.5">
                            @{parentUsername}
                          </span>{' '}
                        </>
                      )}
                      <span className="text-foreground">{reply.content}</span>
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {!isEditing && renderCommentActions(reply)}
          </div>
          {!isEditing && (
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-[11px] text-muted-foreground">
                {formatTimeAgo(reply.createdAt)}
              </span>
              {reply.likesCount > 0 && (
                <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
                  <Heart className="size-3" /> {reply.likesCount}
                </span>
              )}
              <button
                onClick={() => handleReply(reply)}
                className="text-[11px] text-muted-foreground hover:text-gray-600 font-medium transition-colors"
              >
                Reply
              </button>
            </div>
          )}
        </div>
      </motion.div>
    )
  }

  const renderComment = (comment: CommentType) => {
    const isEditing = editingCommentId === comment.id
    const replies = comment.replies || []
    const hasReplies = replies.length > 0
    const isExpanded = expandedThreads.has(comment.id)
    const visibleReplies = isExpanded ? replies : replies.slice(0, 1)
    const hiddenCount = replies.length - 1

    return (
      <div key={comment.id} className="flex gap-3">
        <Avatar className="flex-shrink-0 size-8 mt-0.5">
          <AvatarImage src={comment.author.avatar || undefined} alt={comment.author.username} />
          <AvatarFallback className="bg-muted text-xs">
            {comment.author.username.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1">
            <div className="flex-1 min-w-0">
              <AnimatePresence mode="wait">
                {isEditing ? (
                  <motion.div
                    key="editing"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-1.5"
                  >
                    <Input
                      ref={editInputRef}
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="h-8 text-sm rounded-md border-[#2F5C9B]/40 focus:border-[#2F5C9B] focus:ring-[#2F5C9B]/20 bg-white"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleSaveEdit(comment.id)
                        }
                        if (e.key === 'Escape') {
                          handleCancelEdit()
                        }
                      }}
                    />
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        className="h-6 px-2.5 text-[11px] rounded-md bg-[#2F5C9B] hover:bg-[#2F5C9B]/90 text-white"
                        onClick={() => handleSaveEdit(comment.id)}
                        disabled={isSavingEdit || !editContent.trim()}
                      >
                        {isSavingEdit ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          <Check className="size-3" />
                        )}
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2.5 text-[11px] rounded-md text-muted-foreground hover:text-foreground"
                        onClick={handleCancelEdit}
                      >
                        Cancel
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="display"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                  >
                    <p className="text-sm leading-relaxed">
                      <span className="font-semibold text-foreground">{comment.author.username}</span>{' '}
                      <span className="text-foreground">{comment.content}</span>
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {!isEditing && renderCommentActions(comment)}
          </div>
          {!isEditing && (
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-[11px] text-muted-foreground">
                {formatTimeAgo(comment.createdAt)}
              </span>
              {comment.likesCount > 0 && (
                <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
                  <Heart className="size-3" /> {comment.likesCount}
                </span>
              )}
              <button
                onClick={() => handleReply(comment)}
                className="text-[11px] text-muted-foreground hover:text-gray-600 font-medium transition-colors"
              >
                Reply
              </button>
            </div>
          )}

          {/* Reply thread with left border */}
          {hasReplies && (
            <div className="mt-2 ml-1">
              {/* Thread connector line */}
              <div className="border-l-2 border-border pl-3 py-0.5 space-y-3">
                <AnimatePresence>
                  {visibleReplies.map((reply) => renderReply(reply, comment.author.username))}
                </AnimatePresence>
              </div>

              {/* View replies toggle */}
              {hiddenCount > 0 && (
                <button
                  onClick={() => toggleThread(comment.id)}
                  className="mt-1.5 ml-3 flex items-center gap-1 text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="size-3.5" />
                      Hide replies
                    </>
                  ) : (
                    <>
                      <ChevronDown className="size-3.5" />
                      View {hiddenCount} {hiddenCount === 1 ? 'reply' : 'replies'}
                    </>
                  )}
                </button>
              )}

              {/* Show "View replies" even when all are shown but there are multiple (to collapse) */}
              {!isExpanded && hiddenCount === 0 && replies.length > 1 && (
                <button
                  onClick={() => toggleThread(comment.id)}
                  className="mt-1.5 ml-3 flex items-center gap-1 text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronUp className="size-3.5" />
                  Hide replies
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[70vh] rounded-t-2xl p-0 flex flex-col">
        <SheetHeader className="px-4 pt-4 pb-2">
          <SheetTitle className="text-base">Comments</SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            {post.comments} {post.comments === 1 ? 'comment' : 'comments'}
          </SheetDescription>
        </SheetHeader>
        <Separator />
        
        <div className="flex-1 overflow-y-auto px-4 py-3 max-h-96">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-6 text-muted-foreground animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-muted-foreground">No comments yet</p>
              <p className="text-xs text-muted-foreground mt-1">Be the first to comment!</p>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {comments.map((comment) => renderComment(comment))}
              </AnimatePresence>
              {/* Load More Comments */}
              {commentsHasMore && commentsCursor && (
                <div className="flex justify-center pt-2">
                  <button
                    onClick={loadMoreComments}
                    disabled={isLoadingMoreComments}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted"
                  >
                    {isLoadingMoreComments ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'Load more comments'
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Reply indicator bar */}
        <AnimatePresence>
          {replyingTo && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <div className="px-4 py-2 bg-muted border-t border-border flex items-center gap-2">
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <CornerDownRight className="size-3.5 text-[#2F5C9B]/60 flex-shrink-0" />
                  <span className="text-xs text-muted-foreground truncate">
                    Replying to{' '}
                    <span className="font-semibold text-foreground">
                      @{replyingTo.author.username}
                    </span>
                  </span>
                </div>
                <button
                  onClick={() => setReplyingTo(null)}
                  className="flex-shrink-0 size-5 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  aria-label="Cancel reply"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Comment input */}
        <div className="border-t border-border p-3 flex gap-2 items-center">
          <Avatar className="size-8 flex-shrink-0">
            <AvatarFallback className="text-xs bg-gradient-to-br from-[#2F5C9B]/20 to-[#5CA5CD]/20 text-[#2F5C9B]">
              {currentUser?.username?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <Input
            ref={inputRef}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={replyingTo ? `Reply to @${replyingTo.author.username}...` : 'Add a comment...'}
            className="flex-1 h-9 rounded-full border-border text-sm bg-muted focus:bg-card"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit()
              }
            }}
          />
          <Button
            size="icon"
            className="size-9 rounded-full bg-gradient-to-r from-[#2F5C9B] to-[#5CA5CD] hover:opacity-90 text-white flex-shrink-0"
            onClick={handleSubmit}
            disabled={!newComment.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4 -rotate-12" />
            )}
          </Button>
        </div>
      </SheetContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Comment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this comment? This action cannot be undone.
              {deleteConfirmId && comments.find((c) => c.id === deleteConfirmId)?.replies?.length
                ? ' All replies to this comment will also be deleted.'
                : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && handleDeleteComment(deleteConfirmId)}
              className="bg-[#2F5C9B] hover:bg-[#2F5C9B]/90 text-white"
            >
              {deletingId ? <Loader2 className="size-4 animate-spin mr-1" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  )
})
