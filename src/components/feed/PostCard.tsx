'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  MapPin,
  Flag,
  UserMinus,
  Trash2,
  Pencil,
  FileText,
  Loader2,
} from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from '@/components/ui/carousel'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { useAppStore, type Post } from '@/lib/store'
import { toast } from 'sonner'
import CommentSheet from './CommentSheet'
import ShareToCommunitySheet from './ShareToCommunitySheet'

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

interface PostCardProps {
  post: Post
}

export default function PostCard({ post }: PostCardProps) {
  const { toggleLikeWithAPI, toggleBookmark, currentUser, setViewingUser, setCurrentView, followingIds, deletePost, updatePost } = useAppStore()
  const [captionExpanded, setCaptionExpanded] = useState(false)
  const [showHeartAnimation, setShowHeartAnimation] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showMapDialog, setShowMapDialog] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [isReporting, setIsReporting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editCaption, setEditCaption] = useState('')
  const [editLocation, setEditLocation] = useState('')
  const [editTags, setEditTags] = useState('')
  const [activeSlide, setActiveSlide] = useState(0)
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null)
  const lastTapRef = useRef<number>(0)

  const isTextOnly = !post.images || post.images.length === 0

  // Safe author reference with fallbacks
  const author = post.author || { id: '', email: '', username: 'unknown', name: 'Unknown', avatar: null, bio: null, isPrivate: false }
  const authorId = author.id
  const authorName = author.name || 'Unknown'
  const authorUsername = author.username || 'unknown'
  const authorAvatar = author.avatar || undefined

  // Listen to carousel slide changes via Embla API
  useEffect(() => {
    if (!carouselApi) return
    const onSelect = () => {
      setActiveSlide(carouselApi.selectedScrollSnap())
    }
    carouselApi.on('select', onSelect)
    onSelect() // initialize
    return () => { carouselApi.off('select', onSelect) }
  }, [carouselApi])

  const isBookmarked = useAppStore((s) => s.bookmarks.includes(post.id))
  const isLiked = useAppStore((s) => s.likedPostIds.includes(post.id))
  const isOwnPost = currentUser?.id === authorId
  const isFollowing = followingIds.includes(authorId)

  const handleLike = useCallback(() => {
    if (!currentUser) return
    toggleLikeWithAPI(post.id, currentUser.id)
  }, [toggleLikeWithAPI, post.id, currentUser])

  const handleDoubleTap = useCallback(() => {
    if (!currentUser) return
    if (!isLiked) {
      toggleLikeWithAPI(post.id, currentUser.id)
    }
    setShowHeartAnimation(true)
    setTimeout(() => setShowHeartAnimation(false), 800)
  }, [isLiked, toggleLikeWithAPI, post.id, currentUser])

  const handleImageTap = useCallback(() => {
    const now = Date.now()
    if (now - lastTapRef.current < 300) {
      handleDoubleTap()
    }
    lastTapRef.current = now
  }, [handleDoubleTap])

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
      // Revert on error
      toggleBookmark(post.id)
      toast.error('Failed to update bookmark')
    }
  }, [currentUser, post.id, isBookmarked, toggleBookmark])

  const handleAuthorClick = useCallback(() => {
    if (currentUser?.id === authorId) {
      setCurrentView('profile')
    } else {
      setViewingUser({
        id: authorId,
        email: '',
        username: authorUsername,
        name: authorName,
        avatar: author.avatar || null,
        bio: null,
        isPrivate: false,
      })
      setCurrentView('user-profile')
    }
  }, [currentUser, authorId, authorUsername, authorName, author, setViewingUser, setCurrentView])

  const handleUnfollow = useCallback(async () => {
    if (!currentUser || isOwnPost) return
    try {
      const res = await fetch(`/api/follows?followerId=${currentUser.id}&followingId=${authorId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        useAppStore.getState().toggleFollow(authorId)
        toast.success(`Unfollowed @${authorUsername}`)
      } else {
        toast.error('Failed to unfollow')
      }
    } catch {
      toast.error('Failed to unfollow')
    }
  }, [currentUser, authorId, authorUsername, isOwnPost])

  const handleDelete = useCallback(async () => {
    if (!currentUser || !isOwnPost) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/posts?postId=${post.id}&userId=${currentUser.id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        deletePost(post.id)
        toast.success('Post deleted')
        setShowDeleteDialog(false)
      } else {
        toast.error('Failed to delete post')
      }
    } catch {
      toast.error('Failed to delete post')
    } finally {
      setIsDeleting(false)
    }
  }, [currentUser, post.id, isOwnPost, deletePost])

  const handleEditOpen = useCallback(() => {
    setEditCaption(post.caption || '')
    setEditLocation(post.location || '')
    setEditTags(post.tags.join(', '))
    setShowEditDialog(true)
  }, [post.caption, post.location, post.tags])

  const handleEditSubmit = useCallback(async () => {
    if (!currentUser || !isOwnPost) return
    setIsEditing(true)
    try {
      const parsedTags = editTags
        .split(',')
        .map((t) => t.trim().replace(/^#/, ''))
        .filter(Boolean)

      const res = await fetch('/api/posts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: post.id,
          userId: currentUser.id,
          caption: editCaption.trim() || null,
          location: editLocation.trim() || null,
          tags: parsedTags,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        updatePost(post.id, {
          caption: data.post.caption,
          location: data.post.location,
          tags: data.post.tags,
        })
        toast.success('Post updated')
        setShowEditDialog(false)
      } else {
        toast.error('Failed to update post')
      }
    } catch {
      toast.error('Failed to update post')
    } finally {
      setIsEditing(false)
    }
  }, [currentUser, post.id, isOwnPost, editCaption, editLocation, editTags, updatePost])

  const handleReport = useCallback(async () => {
    if (!currentUser || !reportReason.trim()) return
    setIsReporting(true)
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: post.id,
          reporterId: currentUser.id,
          reason: reportReason.trim(),
        }),
      })
      if (res.ok) {
        toast.success('Report submitted. Thank you.')
        setShowReportDialog(false)
        setReportReason('')
      } else {
        toast.error('Failed to submit report')
      }
    } catch {
      toast.error('Failed to submit report')
    } finally {
      setIsReporting(false)
    }
  }, [currentUser, post.id, reportReason])

  const captionTruncateLength = isTextOnly ? 300 : 100
  const shouldTruncate = post.caption && post.caption.length > captionTruncateLength
  const displayCaption =
    shouldTruncate && !captionExpanded
      ? post.caption!.slice(0, captionTruncateLength) + '...'
      : post.caption

  return (
    <article className="bg-card border-b border-border">
      {/* Author Row */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar className="size-9 cursor-pointer" onClick={handleAuthorClick}>
            <AvatarImage
              src={authorAvatar}
              alt={authorUsername}
            />
            <AvatarFallback className="bg-gradient-to-br from-[#FFBA49]/20 to-[#2EC4B6]/20 text-muted-foreground text-xs font-semibold">
              {authorUsername.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <button
              onClick={handleAuthorClick}
              className="text-sm font-semibold text-foreground text-left hover:text-[#FF6B6B] transition-colors"
            >
              {authorUsername}
            </button>
            {post.location && (
              <button
                onClick={() => setShowMapDialog(true)}
                className="flex items-center gap-0.5 text-[11px] text-muted-foreground hover:text-[#FF8C42] transition-colors"
              >
                <MapPin className="size-3" />
                {post.location}
              </button>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="p-1 rounded-full hover:bg-muted transition-colors outline-none"
              aria-label="Post options"
            >
              <MoreHorizontal className="size-5 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {isOwnPost && (
              <>
                <DropdownMenuItem onClick={handleEditOpen} className="cursor-pointer">
                  <Pencil className="size-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="cursor-pointer text-[#FF6B6B] focus:text-[#FF6B6B]"
                >
                  <Trash2 className="size-4 mr-2" />
                  Delete
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            {!isOwnPost && (
              <>
                <DropdownMenuItem onClick={() => setShowReportDialog(true)} className="cursor-pointer">
                  <Flag className="size-4 mr-2" />
                  Report
                </DropdownMenuItem>
                {isFollowing && (
                  <DropdownMenuItem onClick={handleUnfollow} className="cursor-pointer">
                    <UserMinus className="size-4 mr-2" />
                    Unfollow
                  </DropdownMenuItem>
                )}
              </>
            )}
            <DropdownMenuItem onClick={() => setShowShareMenu(true)} className="cursor-pointer">
              <Send className="size-4 mr-2" />
              Share to Community
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Image Carousel - only shown when post has images */}
      {post.images.length > 0 && (
        <div
          className="relative w-full aspect-square bg-muted select-none"
          onClick={handleImageTap}
        >
          <Carousel
            opts={{ loop: false }}
            className="w-full h-full"
            setApi={setCarouselApi}
          >
            <CarouselContent className="h-full">
              {post.images.map((img, i) => (
                <CarouselItem key={i} className="h-full">
                  <div className="relative w-full h-full">
                    <img
                      src={img}
                      alt={`Post image ${i + 1}`}
                      className="w-full h-full object-cover"
                      draggable={false}
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            {post.images.length > 1 && (
              <>
                <CarouselPrevious className="left-2 top-1/2 -translate-y-1/2 size-8 bg-white/80 hover:bg-white border-0 shadow-md opacity-70 hover:opacity-100 transition-opacity [&>svg]:size-4" />
                <CarouselNext className="right-2 top-1/2 -translate-y-1/2 size-8 bg-white/80 hover:bg-white border-0 shadow-md opacity-70 hover:opacity-100 transition-opacity [&>svg]:size-4" />
              </>
            )}
          </Carousel>

          {/* Double-tap heart animation */}
          <AnimatePresence>
            {showHeartAnimation && (
              <motion.div
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.2 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
              >
                <Heart
                  className="size-24 text-white drop-shadow-lg fill-white"
                  strokeWidth={0}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Image indicators for multiple images */}
          {post.images.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 z-10">
              {post.images.map((_, i) => (
                <div
                  key={i}
                  className={`size-1.5 rounded-full transition-all ${
                    i === activeSlide ? 'bg-white scale-125' : 'bg-white/60'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Text-only post content area */}
      {isTextOnly && post.caption && (
        <div
          className="relative px-4 py-5 select-none bg-gradient-to-br from-[#FFF5F0] via-[#FFF0E5] to-[#E8FAF8] dark:from-[#2a1f1a] dark:via-[#2a2218] dark:to-[#1a2a28] cursor-pointer"
          onClick={handleDoubleTap}
        >
          {/* Double-tap heart animation for text-only */}
          <AnimatePresence>
            {showHeartAnimation && (
              <motion.div
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.2 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
              >
                <Heart
                  className="size-24 text-[#FF6B6B] drop-shadow-lg fill-[#FF6B6B]"
                  strokeWidth={0}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <FileText className="size-5 text-[#FF8C42]/60" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {displayCaption}
              </p>
              {shouldTruncate && !captionExpanded && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setCaptionExpanded(true)
                  }}
                  className="text-muted-foreground mt-1 text-sm outline-none"
                >
                  more
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Row */}
      <div className="flex items-center justify-between px-4 py-2.5">
        <div className="flex items-center gap-4">
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={handleLike}
            className="outline-none"
            aria-label={isLiked ? 'Unlike' : 'Like'}
          >
            <Heart
              className={`size-6 transition-colors ${
                isLiked
                  ? 'text-[#FF6B6B] fill-[#FF6B6B]'
                  : 'text-foreground'
              }`}
              strokeWidth={isLiked ? 0 : 2}
            />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.85 }}
            className="outline-none"
            aria-label="Comments"
            onClick={() => setShowComments(true)}
          >
            <MessageCircle className="size-6 text-foreground" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.85 }}
            className="outline-none"
            aria-label="Share"
            onClick={() => setShowShareMenu(true)}
          >
            <Send className="size-6 text-foreground -rotate-12" />
          </motion.button>
        </div>
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={handleBookmark}
          className="outline-none"
          aria-label={isBookmarked ? 'Unsave' : 'Save'}
        >
          <Bookmark
            className={`size-6 transition-colors ${
              isBookmarked ? 'text-foreground fill-foreground' : 'text-foreground'
            }`}
          />
        </motion.button>
      </div>

      {/* Like Count */}
      <div className="px-4 pb-1">
        <span className="text-sm font-semibold text-foreground">
          {(post.likes ?? 0).toLocaleString()} {(post.likes ?? 0) === 1 ? 'like' : 'likes'}
        </span>
      </div>

      {/* Caption - only show for image posts (text-only posts show caption above) */}
      {!isTextOnly && post.caption && (
        <div className="px-4 pb-1">
          <p className="text-sm text-foreground">
            <button
              onClick={handleAuthorClick}
              className="font-semibold mr-1.5 hover:text-[#FF6B6B] transition-colors"
            >
              {authorUsername}
            </button>
            {displayCaption}
            {shouldTruncate && !captionExpanded && (
              <button
                onClick={() => setCaptionExpanded(true)}
                className="text-muted-foreground ml-1 text-sm outline-none"
              >
                more
              </button>
            )}
          </p>
        </div>
      )}

      {/* View all comments */}
      {(post.comments ?? 0) > 0 && (
        <button
          className="px-4 pb-1 outline-none"
          onClick={() => setShowComments(true)}
        >
          <span className="text-sm text-muted-foreground">
            View all {post.comments ?? 0} {(post.comments ?? 0) === 1 ? 'comment' : 'comments'}
          </span>
        </button>
      )}

      {/* Tags */}
      {post.tags.length > 0 && (
        <div className="px-4 pb-1 flex flex-wrap gap-1">
          {post.tags.map((tag, i) => (
            <span key={i} className="text-xs text-[#FF8C42] font-medium">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Timestamp */}
      <div className="px-4 pb-3 pt-0.5">
        <time className="text-[11px] text-muted-foreground uppercase">
          {formatTimeAgo(post.createdAt)}
        </time>
      </div>

      {/* Comment Sheet */}
      <CommentSheet
        open={showComments}
        onOpenChange={setShowComments}
        post={post}
      />

      {/* Share to Community Sheet */}
      <ShareToCommunitySheet
        open={showShareMenu}
        onOpenChange={setShowShareMenu}
        postId={post.id}
        postCaption={post.caption || undefined}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This action cannot be undone and all likes, comments, and bookmarks will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-[#FF6B6B] hover:bg-[#FF6B6B]/90 text-white"
            >
              {isDeleting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Deleting...
                </span>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Post Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Post</DialogTitle>
            <DialogDescription>
              Update your post details below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label htmlFor="edit-caption" className="text-sm font-medium text-foreground">
                Caption
              </label>
              <Textarea
                id="edit-caption"
                value={editCaption}
                onChange={(e) => setEditCaption(e.target.value)}
                placeholder="Share your travel experience..."
                className="min-h-[100px] resize-none rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="edit-location" className="text-sm font-medium text-foreground">
                Location
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="edit-location"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  placeholder="Add a location..."
                  className="pl-9 rounded-xl"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="edit-tags" className="text-sm font-medium text-foreground">
                Tags
              </label>
              <Input
                id="edit-tags"
                value={editTags}
                onChange={(e) => setEditTags(e.target.value)}
                placeholder="travel, adventure, food (comma separated)"
                className="rounded-xl"
              />
              <p className="text-xs text-muted-foreground">Separate tags with commas</p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              className="rounded-lg"
              disabled={isEditing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditSubmit}
              disabled={isEditing}
              className="bg-gradient-to-r from-[#FF6B6B] to-[#FF8C42] hover:from-[#FF6B6B]/90 hover:to-[#FF8C42]/90 text-white border-0 rounded-lg"
            >
              {isEditing ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Saving...
                </span>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Report Post</DialogTitle>
            <DialogDescription>
              Let us know why you&apos;re reporting this post.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {['Spam', 'Inappropriate content', 'Harassment', 'False information', 'Other'].map((reason) => (
              <button
                key={reason}
                onClick={() => setReportReason(reason)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  reportReason === reason
                    ? 'bg-[#FF6B6B]/10 text-[#FF6B6B] font-medium'
                    : 'hover:bg-muted text-muted-foreground'
                }`}
              >
                {reason}
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowReportDialog(false)}
              className="rounded-lg"
            >
              Cancel
            </Button>
            <Button
              onClick={handleReport}
              disabled={!reportReason.trim() || isReporting}
              className="bg-[#FF6B6B] hover:bg-[#FF6B6B]/90 text-white rounded-lg"
            >
              {isReporting ? 'Submitting...' : 'Submit Report'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Location Dialog */}
      <Dialog open={showMapDialog} onOpenChange={setShowMapDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="size-5 text-[#2EC4B6]" />
              Location
            </DialogTitle>
            <DialogDescription>
              {post.location}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <MapPin className="size-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">
              {post.location}
            </p>
            {post.latitude && post.longitude && (
              <p className="text-xs text-muted-foreground/70 mt-1">
                {post.latitude.toFixed(4)}, {post.longitude.toFixed(4)}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </article>
  )
}
