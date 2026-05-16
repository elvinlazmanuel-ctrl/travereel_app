'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Bell,
  BellOff,
  Share2,
  Users,
  Heart,
  MessageCircle,
  Globe,
  Mountain,
  Utensils,
  Camera,
  Laptop,
  PiggyBank,
  Calendar,
  Shield,
  MoreHorizontal,
  LogOut,
  Loader2,
  Send,
  ImagePlus,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useAppStore, type CommunityType, type User } from '@/lib/store'
import { toast } from 'sonner'

const categoryLabels: Record<string, string> = {
  'travel-style': 'Travel Style',
  budget: 'Budget',
  adventure: 'Adventure',
  food: 'Food',
  photography: 'Photography',
  'remote-work': 'Remote Work',
}

const categoryIcons: Record<string, typeof Globe> = {
  'travel-style': Globe,
  budget: PiggyBank,
  adventure: Mountain,
  food: Utensils,
  photography: Camera,
  'remote-work': Laptop,
}

function formatMembers(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`
  return String(count)
}

interface SharedPostData {
  id: string
  caption: string | null
  createdAt: string
  user: {
    id: string
    username: string
    name: string
    avatar: string | null
  }
  post: {
    id: string
    caption: string | null
    images: string[]
    tags: string[]
    location: string | null
    _count: {
      likes: number
      comments: number
    }
  } | null
}

interface CommunityMemberData {
  id: string
  role: string
  joinedAt: string
  user: User
}

const communityRules = [
  'Be respectful and kind to all members',
  'No spam or self-promotion without permission',
  'Share authentic travel experiences',
  'Help fellow travelers with genuine advice',
  'No discriminatory or offensive content',
  'Credit original content creators',
]

export default function CommunityDetailPage() {
  const {
    selectedCommunity,
    setCurrentView,
    previousView,
    joinedCommunityIds,
    joinCommunity,
    leaveCommunity,
    setSelectedCommunity,
    currentUser,
  } = useAppStore()

  const [notificationsOn, setNotificationsOn] = useState(false)
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
  const [community, setCommunity] = useState<CommunityType | null>(null)
  const [members, setMembers] = useState<CommunityMemberData[]>([])
  const [sharedPosts, setSharedPosts] = useState<SharedPostData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [quickPostText, setQuickPostText] = useState('')
  const [isPosting, setIsPosting] = useState(false)
  const [quickPostImage, setQuickPostImage] = useState<File | null>(null)
  const [quickPostImagePreview, setQuickPostImagePreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchCommunityData = useCallback(async () => {
    if (!selectedCommunity) return
    setIsLoading(true)
    try {
      // Pass userId to get membership info
      const communityUrl = `/api/communities?id=${selectedCommunity.id}${currentUser ? `&userId=${currentUser.id}` : ''}`
      const [communityRes, postsRes] = await Promise.all([
        fetch(communityUrl),
        fetch(`/api/share?communityId=${selectedCommunity.id}`),
      ])

      if (communityRes.ok) {
        const data = await communityRes.json()
        setCommunity(data.community)
        setMembers(data.community?.communityMembers || [])
      }

      if (postsRes.ok) {
        const data = await postsRes.json()
        setSharedPosts(data.sharedPosts || [])
      }
    } catch (err) {
      console.error('Failed to fetch community data:', err)
    } finally {
      setIsLoading(false)
    }
  }, [selectedCommunity, currentUser])

  useEffect(() => {
    fetchCommunityData()
  }, [fetchCommunityData])

  if (!selectedCommunity) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center">
        <p className="text-muted-foreground">Community not found</p>
        <Button variant="ghost" onClick={() => setCurrentView('community')} className="mt-4">
          Go back
        </Button>
      </div>
    )
  }

  const displayCommunity = community || selectedCommunity
  const isJoined = currentUser
    ? joinedCommunityIds.includes(displayCommunity.id) || (community?.isMember)
    : false
  const CategoryIcon = (displayCommunity.category && categoryIcons[displayCommunity.category]) || Globe

  const handleBack = () => {
    setSelectedCommunity(null)
    setCurrentView(previousView || 'community')
  }

  const handleJoinLeave = async () => {
    if (!currentUser) return
    if (isJoined) {
      setShowLeaveConfirm(true)
    } else {
      await joinCommunity(displayCommunity.id)
      toast.success('Joined community!')
      // Refresh community data
      fetchCommunityData()
    }
  }

  const handleLeaveConfirm = async () => {
    if (!currentUser) return
    try {
      const res = await fetch('/api/communities', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: displayCommunity.id, leaveCommunity: true, userId: currentUser.id }),
      })
      if (res.ok) {
        leaveCommunity(displayCommunity.id)
        toast.success('Left community')
        fetchCommunityData()
      }
    } catch {
      toast.error('Failed to leave community')
    }
    setShowLeaveConfirm(false)
  }

  const handleShare = async () => {
    const shareData = {
      title: displayCommunity.name,
      text: displayCommunity.description || `Join ${displayCommunity.name} on Travereel!`,
    }
    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch {
        // User cancelled sharing
      }
    } else {
      // Fallback: copy link
      try {
        await navigator.clipboard.writeText(window.location.href)
        toast.success('Link copied to clipboard!')
      } catch {
        toast.error('Failed to copy link')
      }
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB')
      return
    }

    setQuickPostImage(file)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setQuickPostImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const removeImage = () => {
    setQuickPostImage(null)
    setQuickPostImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleQuickPost = async () => {
    if (!quickPostText.trim() && !quickPostImage || !currentUser) return
    setIsPosting(true)
    try {
      let images: string[] = []

      // Upload image if provided
      if (quickPostImage) {
        setIsUploading(true)
        const formData = new FormData()
        formData.append('file', quickPostImage)
        formData.append('userId', currentUser.id)

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json()
          images = [uploadData.url]
        }
        setIsUploading(false)
      }

      // Create post (with or without images)
      const postRes = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caption: quickPostText,
          images: images,  // Empty array for text-only, or uploaded image URL
          isPublic: true,
          authorId: currentUser.id,
        }),
      })
      
      if (postRes.ok) {
        const postData = await postRes.json()
        const shareRes = await fetch('/api/share', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            postId: postData.post.id,
            userId: currentUser.id,
            communityId: displayCommunity.id,
            caption: quickPostText,
          }),
        })
        if (shareRes.ok) {
          setQuickPostText('')
          setQuickPostImage(null)
          setQuickPostImagePreview(null)
          toast.success('Post shared to community!')
          fetchCommunityData()
        }
      }
    } catch {
      toast.error('Failed to post')
    } finally {
      setIsPosting(false)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-30 bg-background/90 backdrop-blur-md border-b border-border"
      >
        <div className="flex items-center justify-between px-4 h-12">
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="size-5" />
          </button>
          <h1 className="text-sm font-semibold text-foreground truncate max-w-[200px]">
            {displayCommunity.name}
          </h1>
          <button className="text-muted-foreground hover:text-foreground transition-colors" aria-label="More options">
            <MoreHorizontal className="size-5" />
          </button>
        </div>
      </motion.div>

      {/* Banner Image */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="relative h-48 overflow-hidden"
      >
        <img
          src={displayCommunity.image || `https://picsum.photos/seed/${displayCommunity.id}/800/400`}
          alt={displayCommunity.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-end gap-3">
            <div className="size-16 rounded-2xl overflow-hidden border-2 border-white shadow-lg flex-shrink-0">
              <img
                src={displayCommunity.image || `https://picsum.photos/seed/${displayCommunity.id}/200/200`}
                alt={displayCommunity.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-white font-bold text-lg leading-tight drop-shadow-sm truncate">
                {displayCommunity.name}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <Users className="size-3.5 text-white/80" />
                <span className="text-white/80 text-xs">
                  {formatMembers(displayCommunity.members)} members
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Community Info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="px-4 pt-4 pb-2"
      >
        {displayCommunity.description && (
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
            {displayCommunity.description}
          </p>
        )}

        {displayCommunity.category && (
          <div className="flex items-center gap-2 mb-3">
            <Badge
              className="bg-[#2EC4B6]/10 text-[#2EC4B6] border-[#2EC4B6]/20 text-xs px-2.5 py-0.5 gap-1.5"
            >
              <CategoryIcon className="size-3" />
              {categoryLabels[displayCommunity.category] || displayCommunity.category}
            </Badge>
          </div>
        )}

        {/* Action Bar */}
        <div className="flex items-center gap-2 mb-2">
          <Button
            className={`flex-1 h-9 text-sm rounded-xl font-medium transition-all duration-200 ${
              isJoined
                ? 'bg-muted text-muted-foreground hover:bg-[#FF6B6B]/10 hover:text-[#FF6B6B] border border-border'
                : 'bg-gradient-to-r from-[#2EC4B6] to-[#2EC4B6]/80 text-white hover:from-[#2EC4B6]/90 hover:to-[#2EC4B6]/70 shadow-sm'
            }`}
            onClick={handleJoinLeave}
          >
            {isJoined ? (
              <>
                <LogOut className="size-3.5 mr-1.5" />
                Leave
              </>
            ) : (
              <>
                <Users className="size-3.5 mr-1.5" />
                Join Community
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-9 px-3 rounded-xl border-border"
            onClick={handleShare}
            aria-label="Share community"
          >
            <Share2 className="size-4 text-muted-foreground" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-9 px-3 rounded-xl border-border"
            onClick={() => setNotificationsOn(!notificationsOn)}
            aria-label={notificationsOn ? 'Turn off notifications' : 'Turn on notifications'}
          >
            {notificationsOn ? (
              <Bell className="size-4 text-[#FF8C42]" />
            ) : (
              <BellOff className="size-4 text-muted-foreground" />
            )}
          </Button>
        </div>
      </motion.div>

      {/* Leave Confirmation */}
      <AnimatePresence>
        {showLeaveConfirm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mx-4 mb-2 overflow-hidden"
          >
            <div className="bg-[#FF6B6B]/5 border border-[#FF6B6B]/20 rounded-xl p-3">
              <p className="text-sm text-foreground mb-2">Leave <strong>{displayCommunity.name}</strong>?</p>
              <p className="text-xs text-muted-foreground mb-3">
                You won&apos;t receive updates from this community anymore.
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 h-8 bg-[#FF6B6B] hover:bg-[#FF6B6B]/90 text-white text-xs rounded-lg"
                  onClick={handleLeaveConfirm}
                >
                  Leave
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-8 text-xs rounded-lg border-border"
                  onClick={() => setShowLeaveConfirm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="px-4"
      >
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="w-full bg-muted/80 rounded-xl h-10 p-1">
            <TabsTrigger
              value="posts"
              className="rounded-lg text-xs font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-[#2EC4B6]"
            >
              Posts
            </TabsTrigger>
            <TabsTrigger
              value="members"
              className="rounded-lg text-xs font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-[#2EC4B6]"
            >
              Members
            </TabsTrigger>
            <TabsTrigger
              value="about"
              className="rounded-lg text-xs font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-[#2EC4B6]"
            >
              About
            </TabsTrigger>
          </TabsList>

          {/* Posts Tab */}
          <TabsContent value="posts" className="mt-4">
            <div className="space-y-4 pb-4">
              {/* Quick Post Input (only if joined) */}
              {isJoined && currentUser && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-card rounded-2xl border border-border shadow-sm"
                >
                  <div className="flex items-start gap-2">
                    <Avatar className="size-8 flex-shrink-0 mt-1">
                      <AvatarImage src={currentUser?.avatar || undefined} alt={currentUser?.name || 'You'} />
                      <AvatarFallback className="bg-gradient-to-br from-[#FF6B6B]/20 to-[#FF8C42]/20 text-[#FF8C42] text-xs font-semibold">
                        {currentUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <input
                        value={quickPostText}
                        onChange={(e) => setQuickPostText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            handleQuickPost()
                          }
                        }}
                        placeholder={`Share something with ${displayCommunity.name}...`}
                        className="w-full text-sm text-foreground placeholder:text-muted-foreground bg-transparent outline-none resize-none"
                      />
                      
                      {/* Image Preview */}
                      {quickPostImagePreview && (
                        <div className="mt-2 relative inline-block">
                          <img
                            src={quickPostImagePreview}
                            alt="Preview"
                            className="max-h-32 rounded-lg object-cover"
                          />
                          <button
                            onClick={removeImage}
                            className="absolute -top-2 -right-2 size-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                          >
                            <X className="size-3" />
                          </button>
                        </div>
                      )}
                      
                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="hidden"
                        />
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-[#2EC4B6] transition-colors"
                        >
                          <ImagePlus className="size-3.5" />
                          {quickPostImage ? 'Change Image' : 'Add Image'}
                        </button>
                        <Button
                          size="sm"
                          className="ml-auto h-7 px-2.5 text-xs rounded-lg bg-[#2EC4B6] hover:bg-[#2EC4B6]/90 text-white"
                          onClick={handleQuickPost}
                          disabled={isPosting || isUploading || (!quickPostText.trim() && !quickPostImage)}
                        >
                          {isPosting || isUploading ? (
                            <Loader2 className="size-3 animate-spin" />
                          ) : (
                            <Send className="size-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Join prompt if not a member */}
              {!isJoined && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-gradient-to-br from-[#2EC4B6]/5 to-[#2EC4B6]/10 rounded-2xl border border-[#2EC4B6]/20 text-center"
                >
                  <Users className="size-8 text-[#2EC4B6] mx-auto mb-2" />
                  <p className="text-sm font-medium text-foreground mb-1">Join to participate</p>
                  <p className="text-xs text-muted-foreground mb-3">Join this community to share posts and connect with members.</p>
                  <Button
                    size="sm"
                    className="h-8 px-4 text-xs rounded-lg bg-gradient-to-r from-[#2EC4B6] to-[#2EC4B6]/80 text-white shadow-sm"
                    onClick={handleJoinLeave}
                  >
                    <Users className="size-3.5 mr-1.5" />
                    Join Community
                  </Button>
                </motion.div>
              )}

              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="size-6 text-muted-foreground animate-spin" />
                </div>
              ) : sharedPosts.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="size-8 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No posts yet. Be the first to share!</p>
                </div>
              ) : (
                sharedPosts.map((sharedPost, index) => (
                  <motion.div
                    key={sharedPost.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08 }}
                    className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm"
                  >
                    {/* Post Header */}
                    <div className="flex items-center gap-2.5 p-3 pb-2">
                      <Avatar className="size-9">
                        <AvatarImage src={sharedPost.user?.avatar || undefined} alt={sharedPost.user?.name || 'User'} />
                        <AvatarFallback>{sharedPost.user?.name?.[0] || '?'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{sharedPost.user?.name || 'Unknown'}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {new Date(sharedPost.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Post Content */}
                    {(sharedPost.caption || sharedPost.post?.caption) && (
                      <div className="px-3 pb-2">
                        <p className="text-sm text-foreground leading-relaxed">
                          {sharedPost.caption || sharedPost.post?.caption}
                        </p>
                      </div>
                    )}

                    {/* Post Image */}
                    {sharedPost.post?.images?.[0] && (
                      <div className="mx-3 mb-2 rounded-xl overflow-hidden">
                        <img
                          src={sharedPost.post.images[0]}
                          alt="Post image"
                          className="w-full h-48 object-cover"
                          loading="lazy"
                        />
                      </div>
                    )}

                    {/* Post Actions */}
                    <div className="flex items-center gap-4 px-3 pb-3 pt-1">
                      <button className="flex items-center gap-1.5 text-muted-foreground hover:text-[#FF6B6B] transition-colors">
                        <Heart className="size-4" />
                        <span className="text-xs">{sharedPost.post?._count?.likes || 0}</span>
                      </button>
                      <button className="flex items-center gap-1.5 text-muted-foreground hover:text-[#2EC4B6] transition-colors">
                        <MessageCircle className="size-4" />
                        <span className="text-xs">{sharedPost.post?._count?.comments || 0}</span>
                      </button>
                      <button className="flex items-center gap-1.5 text-muted-foreground hover:text-[#FF8C42] transition-colors ml-auto">
                        <Share2 className="size-4" />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members" className="mt-4">
            <div className="pb-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="size-6 text-muted-foreground animate-spin" />
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="size-4 text-[#2EC4B6]" />
                    <span className="text-sm font-medium text-muted-foreground">
                      {formatMembers(displayCommunity.members)} members
                    </span>
                  </div>

                  {members.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="size-8 text-muted-foreground/50 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No members yet</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {members.map((member, index) => {
                        const memberUser = member.user
                        if (!memberUser) return null
                        return (
                          <motion.div
                            key={member.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.04 }}
                            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted transition-colors"
                          >
                            <Avatar className="size-10">
                              <AvatarImage src={memberUser.avatar || undefined} alt={memberUser.name || 'User'} />
                              <AvatarFallback>{memberUser.name?.[0] || '?'}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{memberUser.name || 'Unknown'}</p>
                              <p className="text-xs text-muted-foreground">@{memberUser.username || 'unknown'}</p>
                            </div>
                            {member.role === 'admin' && (
                              <Badge className="bg-[#FFBA49]/10 text-[#FFBA49] border-[#FFBA49]/20 text-[10px] px-1.5 py-0 h-5">
                                Admin
                              </Badge>
                            )}
                            {member.role === 'moderator' && (
                              <Badge className="bg-[#2EC4B6]/10 text-[#2EC4B6] border-[#2EC4B6]/20 text-[10px] px-1.5 py-0 h-5">
                                Mod
                              </Badge>
                            )}
                          </motion.div>
                        )
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </TabsContent>

          {/* About Tab */}
          <TabsContent value="about" className="mt-4">
            <div className="space-y-4 pb-4">
              <div className="bg-card rounded-2xl border border-border p-4">
                <h3 className="text-sm font-semibold text-foreground mb-2">About</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {displayCommunity.description || 'A community of passionate travelers sharing experiences and tips.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-card rounded-2xl border border-border p-3 text-center">
                  <Users className="size-5 text-[#2EC4B6] mx-auto mb-1" />
                  <p className="text-lg font-bold text-foreground">{formatMembers(displayCommunity.members)}</p>
                  <p className="text-[11px] text-muted-foreground">Members</p>
                </div>
                <div className="bg-card rounded-2xl border border-border p-3 text-center">
                  <Calendar className="size-5 text-[#FF8C42] mx-auto mb-1" />
                  <p className="text-sm font-bold text-foreground">
                    {community?.communityMembers?.[0]?.joinedAt
                      ? new Date(community.communityMembers[0].joinedAt).toLocaleDateString()
                      : 'New'}
                  </p>
                  <p className="text-[11px] text-muted-foreground">Created</p>
                </div>
              </div>

              {displayCommunity.category && (
                <div className="bg-card rounded-2xl border border-border p-4">
                  <h3 className="text-sm font-semibold text-foreground mb-2">Category</h3>
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-lg bg-[#2EC4B6]/10 flex items-center justify-center">
                      <CategoryIcon className="size-4 text-[#2EC4B6]" />
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {categoryLabels[displayCommunity.category] || displayCommunity.category}
                    </span>
                  </div>
                </div>
              )}

              <div className="bg-card rounded-2xl border border-border p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="size-4 text-[#FF6B6B]" />
                  <h3 className="text-sm font-semibold text-foreground">Community Rules</h3>
                </div>
                <div className="space-y-2.5">
                  {communityRules.map((rule, index) => (
                    <div key={index} className="flex items-start gap-2.5">
                      <span className="size-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium text-muted-foreground flex-shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      <p className="text-sm text-muted-foreground leading-relaxed">{rule}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}
