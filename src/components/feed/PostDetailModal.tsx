'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MapPin,
  Loader2,
  X,
  ChevronLeft,
  ChevronRight,
  Megaphone,
  FileText,
  Copy,
  Check,
} from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAppStore, type Post, type CommentType } from '@/lib/store'
import { toast } from 'sonner'
import { ReactionPicker, type ReactionType } from './ReactionPicker'

interface PostDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  post: Post
}

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

export function PostDetailModal({ open, onOpenChange, post }: PostDetailModalProps) {
  const { currentUser, toggleLikeWithAPI, toggleBookmark, followingIds } = useAppStore()
  const [comments, setComments] = useState<CommentType[]>([])
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [userReaction, setUserReaction] = useState<ReactionType | null>(null)
  const [isCopied, setIsCopied] = useState(false)
  const [showTemplateRequestDialog, setShowTemplateRequestDialog] = useState(false)
  const [isSendingRequest, setIsSendingRequest] = useState(false)
  const [requestMessage, setRequestMessage] = useState('')

  const author = post.author || { id: '', email: '', username: 'unknown', name: 'Unknown', avatar: null, bio: null, isPrivate: false }
  const isLiked = useAppStore((s) => s.likedPostIds.includes(post.id))
  const isBookmarked = useAppStore((s) => s.bookmarks.includes(post.id))
  const isItineraryPost = post.tags.includes('itinerary') || post.caption?.includes('itinerary')

  // Fetch comments
  useEffect(() => {
    if (!open) return

    const fetchComments = async () => {
      setIsLoadingComments(true)
      try {
        const res = await fetch(`/api/comments?postId=${post.id}`)
        if (res.ok) {
          const data = await res.json()
          setComments(data.comments || [])
        }
      } catch (error) {
        console.error('Failed to fetch comments:', error)
      } finally {
        setIsLoadingComments(false)
      }
    }

    fetchComments()
  }, [open, post.id])

  const handleLike = useCallback(() => {
    if (!currentUser) return
    toggleLikeWithAPI(post.id, currentUser.id)
  }, [toggleLikeWithAPI, post.id, currentUser])

  const handleBookmark = useCallback(async () => {
    if (!currentUser) return
    toggleBookmark(post.id)

    try {
      if (isBookmarked) {
        await fetch(`/api/bookmarks?userId=${currentUser.id}&postId=${post.id}`, { method: 'DELETE' })
      } else {
        await fetch('/api/bookmarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUser.id, postId: post.id }),
        })
      }
    } catch {
      toggleBookmark(post.id)
      toast.error('Failed to update bookmark')
    }
  }, [currentUser, post.id, isBookmarked, toggleBookmark])

  const handleReaction = async (type: ReactionType) => {
    if (!currentUser) return
    setUserReaction(type)
    
    try {
      await fetch('/api/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: post.id,
          userId: currentUser.id,
          type,
        }),
      })
    } catch (error) {
      console.error('Failed to react:', error)
    }
  }

  const handleRemoveReaction = async () => {
    if (!currentUser) return
    setUserReaction(null)
    
    try {
      await fetch(`/api/reactions?postId=${post.id}&userId=${currentUser.id}`, {
        method: 'DELETE',
      })
    } catch (error) {
      console.error('Failed to remove reaction:', error)
    }
  }

  const handleAddComment = async () => {
    if (!currentUser || !newComment.trim()) return
    setIsSubmittingComment(true)

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: post.id,
          userId: currentUser.id,
          content: newComment.trim(),
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setComments((prev) => [...prev, data.comment])
        setNewComment('')
        toast.success('Comment added')
      } else {
        toast.error('Failed to add comment')
      }
    } catch {
      toast.error('Failed to add comment')
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const handleTemplateRequest = async () => {
    if (!currentUser || !requestMessage.trim()) return
    setIsSendingRequest(true)

    try {
      const res = await fetch('/api/itineraries/template-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itineraryId: post.id,
          requesterId: currentUser.id,
          ownerId: author.id,
          message: requestMessage.trim(),
        }),
      })

      if (res.ok) {
        toast.success('Template request sent! The owner will review your request.')
        setShowTemplateRequestDialog(false)
        setRequestMessage('')
      } else {
        toast.error('Failed to send template request')
      }
    } catch {
      toast.error('Failed to send template request')
    } finally {
      setIsSendingRequest(false)
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`)
      setIsCopied(true)
      toast.success('Link copied to clipboard')
      setTimeout(() => setIsCopied(false), 2000)
    } catch {
      toast.error('Failed to copy link')
    }
  }

  const nextImage = () => {
    if (post.images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % post.images.length)
    }
  }

  const prevImage = () => {
    if (post.images.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + post.images.length) % post.images.length)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl h-[90vh] p-0 gap-0 overflow-hidden flex flex-col">
          <DialogHeader className="sr-only">
            <DialogTitle>Post Details</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col h-full">
            {/* TOP - Post Content */}
            <div className="flex-shrink-0 bg-background border-b border-border">
              {/* Close Button */}
              <button
                onClick={() => onOpenChange(false)}
                className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
              >
                <X className="size-5" />
              </button>

              {/* Image Carousel */}
              {post.images && post.images.length > 0 ? (
                <div className="relative bg-black">
                  <div className="flex items-center justify-center max-h-[50vh]">
                    <img
                      src={post.images[currentImageIndex]}
                      alt={`Post image ${currentImageIndex + 1}`}
                      className="w-full h-auto max-h-[50vh] object-contain"
                    />
                  </div>

                  {/* Navigation Arrows */}
                  {post.images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all"
                      >
                        <ChevronLeft className="size-5" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all"
                      >
                        <ChevronRight className="size-5" />
                      </button>

                      {/* Image Indicators */}
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
                        {post.images.map((_, i) => (
                          <div
                            key={i}
                            className={`size-2 rounded-full transition-all ${
                              i === currentImageIndex ? 'bg-white' : 'bg-white/50'
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                /* Text-only Post */
                <div className="flex items-center justify-center p-8 bg-gradient-to-br from-[#2F5C9B]/10 via-[#5CA5CD]/10 to-[#5CA5CD]/10 dark:from-[#1a1f2a] dark:via-[#1a2228] dark:to-[#1a2828]">
                  <div className="max-w-lg text-center">
                    <FileText className="size-16 text-[#2F5C9B]/40 mx-auto mb-4" />
                    <p className="text-lg text-foreground whitespace-pre-wrap leading-relaxed">
                      {post.caption}
                    </p>
                  </div>
                </div>
              )}

              {/* Author Info & Caption */}
              <div className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <Avatar className="size-10 flex-shrink-0">
                    <AvatarImage src={author.avatar || undefined} alt={author.username} />
                    <AvatarFallback className="bg-gradient-to-br from-[#2F5C9B] to-[#5CA5CD] text-white text-sm font-semibold">
                      {author.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm text-foreground">
                      <span className="font-semibold mr-2">@{author.username}</span>
                      {post.caption}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    {post.location && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="size-3" />
                        {post.location}
                      </div>
                    )}
                    {post.isSponsored && (
                      <Badge variant="secondary" className="text-[9px] bg-amber-50 text-amber-700 border-amber-200 gap-1 px-2 py-0.5">
                        <Megaphone className="size-2.5" />
                        Sponsored
                      </Badge>
                    )}
                  </div>
                  <time className="text-xs text-muted-foreground uppercase">
                    {formatTimeAgo(post.createdAt)}
                  </time>
                </div>
              </div>

              {/* Actions Bar */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <div className="flex items-center gap-3">
                  <ReactionPicker
                    currentReaction={userReaction}
                    onReact={handleReaction}
                    onRemoveReaction={handleRemoveReaction}
                  />
                  <button className="outline-none group/icon">
                    <MessageCircle className="size-6 text-foreground group-hover/icon:text-[#5CA5CD] transition-colors" />
                  </button>
                  <button className="outline-none group/icon -rotate-12">
                    <Send className="size-6 text-foreground group-hover/icon:text-[#E58BEA] transition-colors" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handleCopyLink} className="outline-none group/icon">
                    {isCopied ? (
                      <Check className="size-6 text-[#2F5C9B]" />
                    ) : (
                      <Copy className="size-6 text-foreground group-hover/icon:text-[#2F5C9B] transition-colors" />
                    )}
                  </button>
                  <button onClick={handleBookmark} className="outline-none group/icon">
                    <Bookmark
                      className={`size-6 transition-all ${
                        isBookmarked
                          ? 'text-[#E58BEA] fill-[#E58BEA]'
                          : 'text-foreground group-hover/icon:text-[#E58BEA]'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Itinerary Template Request Button */}
              {isItineraryPost && author.id !== currentUser?.id && (
                <div className="px-4 pb-4 bg-gradient-to-r from-[#2F5C9B]/5 to-[#5CA5CD]/5">
                  <Button
                    onClick={() => setShowTemplateRequestDialog(true)}
                    className="w-full bg-gradient-to-r from-[#2F5C9B] to-[#5CA5CD] hover:from-[#2F5C9B]/90 hover:to-[#5CA5CD]/90 text-white"
                  >
                    <Copy className="size-4 mr-2" />
                    Use This Template
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Send a request to the owner to use this itinerary template
                  </p>
                </div>
              )}

              {/* Like Count */}
              <div className="px-4 py-2 border-t border-border">
                <span className="text-sm font-semibold text-foreground">
                  {(post.likes ?? 0).toLocaleString()} {(post.likes ?? 0) === 1 ? 'like' : 'likes'}
                </span>
              </div>
            </div>

            {/* BOTTOM - Comments Section */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Comments List */}
              <div className="flex-1 overflow-y-auto">
                {isLoadingComments ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="size-6 animate-spin text-muted-foreground" />
                  </div>
                ) : comments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                    <MessageCircle className="size-12 text-muted-foreground/20 mb-3" />
                    <p className="text-sm font-semibold text-foreground mb-1">No comments yet</p>
                    <p className="text-xs text-muted-foreground">Start the conversation</p>
                  </div>
                ) : (
                  <div className="p-4 space-y-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <Avatar className="size-8 flex-shrink-0">
                          <AvatarImage src={comment.author?.avatar || undefined} alt={comment.author?.username} />
                          <AvatarFallback className="bg-gradient-to-br from-[#2F5C9B] to-[#5CA5CD] text-white text-xs font-semibold">
                            {comment.author?.username?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground">
                            <span className="font-semibold mr-2">@{comment.author?.username}</span>
                            {comment.content}
                          </p>
                          <div className="flex gap-3 mt-1">
                            <span className="text-xs text-muted-foreground">{formatTimeAgo(comment.createdAt)}</span>
                            <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                              Reply
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Comment */}
              <div className="p-4 border-t border-border">
                <div className="flex gap-2">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="min-h-[40px] h-10 resize-none rounded-lg text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleAddComment()
                      }
                    }}
                  />
                  <Button
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || isSubmittingComment}
                    size="sm"
                    className="px-4 h-10 bg-gradient-to-r from-[#2F5C9B] to-[#5CA5CD] hover:from-[#2F5C9B]/90 hover:to-[#5CA5CD]/90 text-white rounded-lg"
                  >
                    {isSubmittingComment ? <Loader2 className="size-4 animate-spin" /> : 'Post'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Template Request Dialog */}
      <Dialog open={showTemplateRequestDialog} onOpenChange={setShowTemplateRequestDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request to Use Template</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Send a message to @{author.username} requesting access to use this itinerary template.
            </p>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              placeholder="Hi! I'd love to use your itinerary template for my upcoming trip. Could you please approve my request?"
              className="min-h-[120px] resize-none rounded-lg"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowTemplateRequestDialog(false)}
              className="rounded-lg"
            >
              Cancel
            </Button>
            <Button
              onClick={handleTemplateRequest}
              disabled={!requestMessage.trim() || isSendingRequest}
              className="bg-gradient-to-r from-[#2F5C9B] to-[#5CA5CD] hover:from-[#2F5C9B]/90 hover:to-[#5CA5CD]/90 text-white rounded-lg"
            >
              {isSendingRequest ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Sending...
                </span>
              ) : (
                'Send Request'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
