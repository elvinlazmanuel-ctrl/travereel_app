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
  Megaphone,
  Globe,
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
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { useAppStore, type Post } from '@/lib/store'
import { toast } from 'sonner'
import CommentSheet from './CommentSheet'
import ShareToCommunitySheet from './ShareToCommunitySheet'
import { ReactionPicker, type ReactionType } from './ReactionPicker'
import { useRouter } from 'next/navigation'

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
  const { toggleLikeWithAPI, toggleBookmark, currentUser, setViewingUser, setCurrentView, followingIds, deletePost, updatePost, setSelectedCommunity } = useAppStore()
  const router = useRouter()
  const [captionExpanded, setCaptionExpanded] = useState(false)
  const [showHeartAnimation, setShowHeartAnimation] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [userReaction, setUserReaction] = useState<ReactionType | null>(null)
  const [showMapDialog, setShowMapDialog] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [isReporting, setIsReporting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editCaption, setEditCaption] = useState('')
  const [editLocation, setEditLocation] = useState('')

  // Handle community name click
  const handleCommunityClick = (communityId: string, communityName: string, communityImage: string | null) => {
    setSelectedCommunity({
      id: communityId,
      name: communityName,
      image: communityImage,
      members: 0,
      category: null,
      description: null,
    })
    setCurrentView('community-detail')
    router.push('/')
  }
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
    <article className="group glass rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover-lift transition-all duration-300 mb-6 border border-white/20 dark:border-slate-700/50">
      {/* Author Row - Magazine Style */}
      <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-white/50 to-transparent dark:from-slate-800/50 border-b border-border/30">
        <div className="flex items-center gap-3">
          <Avatar className="size-12 cursor-pointer ring-2 ring-[#2F5C9B]/20 hover:ring-[#2F5C9B]/50 transition-all hover:scale-105" onClick={handleAuthorClick}>
            <AvatarImage
              src={authorAvatar}
              alt={authorUsername}
            />
            <AvatarFallback className="bg-gradient-to-br from-[#2F5C9B] to-[#5CA5CD] text-white text-sm font-semibold">
              {authorUsername.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <button
              onClick={handleAuthorClick}
              className="text-sm font-semibold text-foreground text-left hover:text-[#2F5C9B] transition-colors flex items-center gap-2"
            >
              @{authorUsername}
              {post.isSponsored && (
                <Badge variant="secondary" className="text-[9px] bg-gradient-to-r from-amber-50 to-amber-100 text-amber-700 border-amber-200 gap-1 px-2 py-0.5 shadow-sm">
                  <Megaphone className="size-2.5" />
                  Sponsored{post.sponsoredBy ? ` by ${post.sponsoredBy}` : ''}
                </Badge>
              )}
            </button>
            {post.location && (
              <button
                onClick={() => setShowMapDialog(true)}
                className="flex items-center gap-1 text-xs text-[#2F5C9B] hover:text-[#5CA5CD] transition-colors mt-0.5 font-medium"
              >
                <MapPin className="size-3.5" />
                {post.location}
              </button>
            )}
            {post.sharedToCommunity && (
              <button
                onClick={() => handleCommunityClick(
                  post.sharedToCommunity!.id,
                  post.sharedToCommunity!.name,
                  post.sharedToCommunity!.image
                )}
                className="flex items-center gap-1 text-xs text-[#5CA5CD] hover:text-[#5CA5CD]/80 transition-colors font-medium mt-0.5"
              >
                <Globe className="size-3.5" />
                {post.sharedToCommunity.name}
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
                  className="cursor-pointer text-[#2F5C9B] focus:text-[#2F5C9B]"
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

      {/* Image Carousel - Magazine Style with Enhanced Overlays */}
      {post.images.length > 0 && (
        <div
          className="relative w-full aspect-[4/3] bg-muted select-none overflow-hidden group-hover:shadow-inner transition-shadow"
          onClick={handleImageTap}
        >
          {/* Enhanced gradient overlay for magazine feel */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent z-[5] pointer-events-none" />
          
          {/* Location badge overlay - Magazine style */}
          {post.location && (
            <div className="absolute top-4 left-4 z-10 glass px-3 py-1.5 rounded-full shadow-lg">
              <div className="flex items-center gap-1.5 text-white text-xs font-semibold">
                <MapPin className="size-3.5" />
                {post.location}
              </div>
            </div>
          )}
          
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
                      className="w-full h-full object-cover block"
                      draggable={false}
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            {post.images.length > 1 && (
              <>
                <CarouselPrevious className="left-3 top-1/2 -translate-y-1/2 size-9 bg-white/90 hover:bg-white border-0 shadow-lg opacity-0 group-hover:opacity-100 transition-all [&>svg]:size-5" />
                <CarouselNext className="right-3 top-1/2 -translate-y-1/2 size-9 bg-white/90 hover:bg-white border-0 shadow-lg opacity-0 group-hover:opacity-100 transition-all [&>svg]:size-5" />
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

      {/* Text-only post content area - Magazine Style */}
      {isTextOnly && post.caption && (
        <div
          className="relative px-6 py-6 select-none bg-gradient-to-br from-[#2F5C9B]/5 via-[#5CA5CD]/5 to-[#5CA5CD]/5 dark:from-[#2a1f1a] dark:via-[#2a2218] dark:to-[#1a2a28] cursor-pointer border-l-4 border-[#2F5C9B]/30"
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
                  className="size-24 text-[#2F5C9B] drop-shadow-lg fill-[#2F5C9B]"
                  strokeWidth={0}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <FileText className="size-5 text-[#5CA5CD]/60" />
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

      {/* Sponsored Post CTA */}
      {post.isSponsored && post.sponsoredUrl && (
        <div className="px-4 pb-3">
          <Button
            variant="outline"
            size="sm"
            className="w-full border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs"
            onClick={() => window.open(post.sponsoredUrl, '_blank')}
          >
            <Megaphone className="size-3.5 mr-1.5" />
            Learn More
          </Button>
        </div>
      )}

      {/* Action Row - Glass Morphism Style */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-border/30 bg-gradient-to-r from-[#2F5C9B]/5 to-[#5CA5CD]/5 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <ReactionPicker
            currentReaction={userReaction}
            onReact={handleReaction}
            onRemoveReaction={handleRemoveReaction}
          />
          <motion.button
            whileTap={{ scale: 0.85 }}
            className="outline-none group/icon"
            aria-label="Comments"
            onClick={() => setShowComments(true)}
          >
            <MessageCircle className="size-6 text-foreground group-hover/icon:text-[#5CA5CD] transition-colors" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.85 }}
            className="outline-none group/icon"
            aria-label="Share"
            onClick={() => setShowShareMenu(true)}
          >
            <Send className="size-6 text-foreground -rotate-12 group-hover/icon:text-[#E58BEA] transition-colors" />
          </motion.button>
        </div>
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={handleBookmark}
          className="outline-none group/icon"
          aria-label={isBookmarked ? 'Unsave' : 'Save'}
        >
          <Bookmark
            className={`size-6 transition-all ${
              isBookmarked 
                ? 'text-[#E58BEA] fill-[#E58BEA] drop-shadow-sm' 
                : 'text-foreground group-hover/icon:text-[#E58BEA]'
            }`}
          />
        </motion.button>
      </div>

      {/* Like Count */}
      <div className="px-5 pb-3 pt-2">
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
              className="font-semibold mr-1.5 hover:text-[#2F5C9B] transition-colors"
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
            <span key={i} className="text-xs text-[#5CA5CD] font-medium">
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
              className="bg-[#2F5C9B] hover:bg-[#2F5C9B]/90 text-white"
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
              className="bg-gradient-to-r from-[#2F5C9B] to-[#5CA5CD] hover:from-[#2F5C9B]/90 hover:to-[#5CA5CD]/90 text-white border-0 rounded-lg"
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
                    ? 'bg-[#2F5C9B]/10 text-[#2F5C9B] font-medium'
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
              className="bg-[#2F5C9B] hover:bg-[#2F5C9B]/90 text-white rounded-lg"
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
              <MapPin className="size-5 text-[#5CA5CD]" />
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
