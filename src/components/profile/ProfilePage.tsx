'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings, Grid3X3, Map, Tag, ImagePlus, MessageCircle, Pencil, Users, FileText } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useAppStore, type Post, type Itinerary, type ChatRoomType } from '@/lib/store'
import { toast } from 'sonner'
import ItineraryCard from './ItineraryCard'
import FollowSheet from './FollowSheet'
import { TravelInsightsSection } from './TravelInsightsSection'
import { PhotoAlbums } from './PhotoAlbums'
import { Badge } from '@/components/ui/badge'

export default function ProfilePage() {
  const { currentUser, viewingUser, currentView, setCurrentView, followingIds, toggleFollow, setSelectedChatRoom, setMessages, pendingFriendRequestCount, blockedIds } = useAppStore()
  const [userPosts, setUserPosts] = useState<Post[]>([])
  const [userItineraries, setUserItineraries] = useState<Itinerary[]>([])
  const [isLoadingPosts, setIsLoadingPosts] = useState(true)
  const [isLoadingItineraries, setIsLoadingItineraries] = useState(true)
  const [activeTab, setActiveTab] = useState('posts')
  const [showFollowSheet, setShowFollowSheet] = useState(false)
  const [followSheetTab, setFollowSheetTab] = useState<'followers' | 'following'>('followers')
  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [editName, setEditName] = useState('')
  const [editBio, setEditBio] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isFollowLoading, setIsFollowLoading] = useState(false)
  const [friends, setFriends] = useState<Array<{ id: string; username: string; name: string; avatar: string | null }>>([])
  const [friendsCount, setFriendsCount] = useState(0)
  const [isLoadingFriends, setIsLoadingFriends] = useState(true)

  // Determine which profile we're viewing
  const isOwnProfile = currentView === 'profile' || (viewingUser?.id === currentUser?.id && currentView === 'user-profile')
  const profileUser = isOwnProfile ? currentUser : viewingUser
  const profileUserId = profileUser?.id

  const postsCount = userPosts.length
  const hasFetched = useRef(false)
  const lastFetchedId = useRef<string | null>(null)

  useEffect(() => {
    if (!profileUserId) return
    if (lastFetchedId.current === profileUserId) return
    lastFetchedId.current = profileUserId
    hasFetched.current = false
  }, [profileUserId])

  useEffect(() => {
    if (!profileUserId || hasFetched.current) return
    hasFetched.current = true

    const fetchData = async () => {
      setIsLoadingPosts(true)
      setIsLoadingItineraries(true)
      setIsLoadingFriends(true)
      try {
        const [postsRes, itinerariesRes, followsRes, friendsRes] = await Promise.all([
          fetch(`/api/posts?authorId=${profileUserId}&userId=${currentUser?.id || ''}`),
          fetch(`/api/itineraries?authorId=${profileUserId}&userId=${currentUser?.id || ''}`),
          fetch(`/api/follows?userId=${profileUserId}`),
          fetch(`/api/friend-requests?userId=${profileUserId}&type=friends`),
        ])

        if (postsRes.ok) {
          const data = await postsRes.json()
          const mapped: Post[] = data.posts.map((p: Record<string, unknown>) => ({
            id: p.id,
            caption: p.caption || null,
            images: Array.isArray(p.images) ? p.images : [],
            isPublic: p.isPublic as boolean,
            isMemory: false,
            location: p.location || null,
            tags: Array.isArray(p.tags) ? p.tags : [],
            authorId: p.authorId as string,
            author: {
              id: ((p.author as Record<string, unknown>)?.id as string) || (p.authorId as string) || '',
              email: ((p.author as Record<string, unknown>)?.email as string) || '',
              username: ((p.author as Record<string, unknown>)?.username as string) || 'unknown',
              name: ((p.author as Record<string, unknown>)?.name as string) || 'Unknown',
              avatar: ((p.author as Record<string, unknown>)?.avatar as string) || null,
              bio: null,
              isPrivate: false,
            },
            createdAt: p.createdAt as string,
            likes: (p._count as Record<string, number>)?.likes || 0,
            comments: (p._count as Record<string, number>)?.comments || 0,
            isLiked: false,
          }))
          setUserPosts(mapped)
        }

        if (itinerariesRes.ok) {
          const data = await itinerariesRes.json()
          const mapped: Itinerary[] = data.itineraries.map((it: Record<string, unknown>) => ({
            id: it.id as string,
            title: it.title as string,
            country: it.country as string,
            location: it.location as string,
            budget: it.budget as number,
            currency: it.currency as string,
            days: it.days as number,
            travelType: it.travelType as string,
            activities: Array.isArray(it.activities) ? it.activities : [],
            status: it.status as Itinerary['status'],
            isPublic: it.isPublic as boolean,
            requirements: Array.isArray(it.requirements) ? it.requirements : [],
            authorId: it.authorId as string,
            createdAt: it.createdAt as string,
            daysPlan: Array.isArray(it.days_plan) ? it.days_plan : [],
            budgetItems: Array.isArray(it.budget_items) ? it.budget_items : [],
            companions: Array.isArray(it.companions) ? it.companions : [],
          }))
          setUserItineraries(mapped)
        }

        if (followsRes.ok) {
          const data = await followsRes.json()
          setFollowersCount(data.followersCount || 0)
          setFollowingCount(data.followingCount || 0)
        }

        if (friendsRes.ok) {
          const data = await friendsRes.json()
          const friendList = (data.friends || []).map((f: { friend: { id: string; username: string; name: string; avatar: string | null } }) => ({
            id: f.friend.id,
            username: f.friend.username,
            name: f.friend.name,
            avatar: f.friend.avatar,
          }))
          setFriends(friendList)
          setFriendsCount(friendList.length)
        }
      } catch (err) {
        console.error('Failed to fetch profile data:', err)
      } finally {
        setIsLoadingPosts(false)
        setIsLoadingItineraries(false)
        setIsLoadingFriends(false)
      }
    }

    fetchData()
  }, [profileUserId])

  const avatarUrl = profileUser?.avatar || `https://picsum.photos/seed/${profileUserId || 'default'}/200/200`
  const name = profileUser?.name || 'Traveler'
  const username = profileUser?.username || 'traveler'
  const bio = profileUser?.bio || '✈️ Exploring the world one destination at a time'

  const handleFollowersClick = () => {
    setFollowSheetTab('followers')
    setShowFollowSheet(true)
  }

  const handleFollowingClick = () => {
    setFollowSheetTab('following')
    setShowFollowSheet(true)
  }

  const handleEditProfile = () => {
    setEditName(profileUser?.name || '')
    setEditBio(profileUser?.bio || '')
    setShowEditProfile(true)
  }

  const handleSaveProfile = async () => {
    if (!currentUser) return
    setIsSaving(true)
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          action: 'updateProfile',
          name: editName.trim() || undefined,
          bio: editBio.trim() || undefined,
        }),
      })
      if (res.ok) {
        // Update local store
        const store = useAppStore.getState()
        store.login({
          ...currentUser,
          name: editName.trim() || currentUser.name,
          bio: editBio.trim() || currentUser.bio,
        })
        setShowEditProfile(false)
        toast.success('Profile updated!')
      } else {
        toast.error('Failed to update profile')
      }
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handleFollowToggle = async () => {
    if (!profileUser || !currentUser || isFollowLoading) return
    setIsFollowLoading(true)
    const isFollowing = followingIds.includes(profileUser.id)

    try {
      if (isFollowing) {
        const res = await fetch(`/api/follows?followerId=${currentUser.id}&followingId=${profileUser.id}`, {
          method: 'DELETE',
        })
        if (res.ok) {
          toggleFollow(profileUser.id)
          setFollowersCount((c) => Math.max(0, c - 1))
          toast.success(`Unfollowed @${profileUser.username || 'unknown'}`)
        }
      } else {
        const res = await fetch('/api/follows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ followerId: currentUser.id, followingId: profileUser.id }),
        })
        if (res.ok) {
          toggleFollow(profileUser.id)
          setFollowersCount((c) => c + 1)
          toast.success(`Following @${profileUser.username || 'unknown'}`)
        }
      }
    } catch {
      toast.error('Failed to update follow status')
    } finally {
      setIsFollowLoading(false)
    }
  }

  const handleMessage = async () => {
    if (!profileUser || !currentUser) return
    try {
      const res = await fetch(`/api/chat-rooms?userId1=${currentUser.id}&userId2=${profileUser.id}`)
      if (res.ok) {
        const data = await res.json()
        const chatRoom = data.chatRoom
        const room: ChatRoomType = {
          id: chatRoom.id,
          name: chatRoom.name,
          isGroup: chatRoom.isGroup,
          members: chatRoom.members.map((m: Record<string, unknown>) => ({
            id: (m as { userId?: string; user?: { id: string }; id?: string }).userId || (m as { user?: { id: string } }).user?.id || (m as { id: string }).id,
            email: '',
            username: ((m as { user?: { username: string } }).user?.username) || '',
            name: ((m as { user?: { name: string } }).user?.name) || '',
            avatar: ((m as { user?: { avatar: string | null } }).user?.avatar) || null,
            bio: null,
            isPrivate: false,
          })),
        }
        setSelectedChatRoom(room)
        setMessages([])
        setCurrentView('chat-room')
      }
    } catch {
      toast.error('Failed to open chat')
    }
  }

  const handlePostGridClick = (post: Post) => {
    // Store the selected post in sessionStorage for the feed view to use
    sessionStorage.setItem('selectedPostId', post.id)
    setCurrentView('feed')
    // The NewsFeed component will handle opening the modal when it detects the selectedPostId
  }

  const handleFriendClick = (friend: { id: string; username: string; name: string; avatar: string | null }) => {
    const store = useAppStore.getState()
    store.setViewingUser({
      id: friend.id,
      username: friend.username,
      name: friend.name,
      avatar: friend.avatar,
      email: '',
      bio: null,
      isPrivate: false,
    })
    store.setCurrentView('user-profile')
  }

  const isFollowing = profileUser ? followingIds.includes(profileUser.id) : false

  const displayFriends = friends.slice(0, 8)

  return (
    <div className="max-w-4xl mx-auto">
      {/* Instagram-Style Profile Header */}
      <div className="px-4 py-6 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-start gap-6 md:gap-10">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <Avatar className="size-20 md: size-36 border-2 border-gray-200 dark:border-gray-700">
              <AvatarImage src={avatarUrl} alt={name} />
              <AvatarFallback className="bg-gradient-to-br from-[#2F5C9B] to-[#5CA5CD] text-3xl font-bold text-white">
                {name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Profile Info */}
          <div className="flex-1 min-w-0">
            {/* Username & Actions */}
            <div className="flex items-center gap-4 mb-4 flex-wrap">
              <h1 className="text-xl font-light text-foreground">@{username}</h1>
              {isOwnProfile ? (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-sm rounded-lg"
                    onClick={handleEditProfile}
                  >
                    Edit profile
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-sm rounded-lg relative"
                    onClick={() => setCurrentView('friends')}
                  >
                    View friends
                    {pendingFriendRequestCount > 0 && (
                      <span className="ml-1 min-w-[18px] h-5 rounded-full bg-[#2F5C9B] text-white text-[10px] font-bold flex items-center justify-center px-1">
                        {pendingFriendRequestCount > 9 ? '9+' : pendingFriendRequestCount}
                      </span>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8 rounded-lg"
                    onClick={() => setCurrentView('settings')}
                  >
                    <Settings className="size-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button
                    onClick={handleFollowToggle}
                    disabled={isFollowLoading}
                    size="sm"
                    className={`h-8 px-4 text-sm rounded-lg font-semibold ${
                      isFollowing
                        ? 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-foreground'
                        : 'bg-[#2F5C9B] hover:bg-[#2F5C9B]/90 text-white'
                    }`}
                  >
                    {isFollowLoading ? '...' : isFollowing ? 'Following' : 'Follow'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-sm rounded-lg"
                    onClick={handleMessage}
                  >
                    Message
                  </Button>
                </div>
              )}
            </div>

            {/* Stats - Desktop */}
            <div className="hidden md:flex gap-10 mb-4">
              <span className="text-base text-foreground">
                <strong>{postsCount}</strong> posts
              </span>
              <button
                className="text-base text-foreground hover:opacity-70 transition-opacity outline-none"
                onClick={handleFollowersClick}
              >
                <strong>{followersCount}</strong> followers
              </button>
              <button
                className="text-base text-foreground hover:opacity-70 transition-opacity outline-none"
                onClick={handleFollowingClick}
              >
                <strong>{followingCount}</strong> following
              </button>
            </div>

            {/* Bio */}
            <div className="space-y-1">
              <p className="text-base font-semibold text-foreground">{name}</p>
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{bio}</p>
            </div>
          </div>
        </div>

        {/* Stats - Mobile */}
        <div className="md:hidden flex justify-around mt-4 py-3 border-t border-b border-gray-200 dark:border-gray-800">
          <div className="text-center">
            <p className="text-base font-semibold text-foreground">{postsCount}</p>
            <p className="text-xs text-muted-foreground">posts</p>
          </div>
          <button
            className="text-center outline-none"
            onClick={handleFollowersClick}
          >
            <p className="text-base font-semibold text-foreground">{followersCount}</p>
            <p className="text-xs text-muted-foreground">followers</p>
          </button>
          <button
            className="text-center outline-none"
            onClick={handleFollowingClick}
          >
            <p className="text-base font-semibold text-foreground">{followingCount}</p>
            <p className="text-xs text-muted-foreground">following</p>
          </button>
        </div>
      </div>

      {/* Phase 3: Travel Insights (Only on own profile) */}
      {isOwnProfile && profileUserId && (
        <TravelInsightsSection userId={profileUserId} />
      )}

      {/* Tab Bar - Instagram Style */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="sticky top-14 z-10 bg-background border-b border-gray-200 dark:border-gray-800">
          <TabsList className="w-full max-w-md mx-auto h-12 bg-transparent rounded-none p-0 justify-around gap-0">
            <TabsTrigger
              value="posts"
              className="flex-1 h-12 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-foreground data-[state=active]:bg-transparent px-0 gap-2 transition-all border-b-2 border-transparent"
            >
              <Grid3X3 className="size-4" />
              <span className="text-xs font-medium">Posts</span>
            </TabsTrigger>
            <TabsTrigger
              value="itineraries"
              className="flex-1 h-12 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-foreground data-[state=active]:bg-transparent px-0 gap-2 transition-all border-b-2 border-transparent"
            >
              <Map className="size-4" />
              <span className="text-xs font-medium">Trips</span>
            </TabsTrigger>
            {isOwnProfile && (
              <TabsTrigger
                value="albums"
                className="flex-1 h-12 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-foreground data-[state=active]:bg-transparent px-0 gap-2 transition-all border-b-2 border-transparent"
              >
                <span className="text-base">📸</span>
                <span className="text-xs font-medium">Albums</span>
              </TabsTrigger>
            )}
            <TabsTrigger
              value="tagged"
              className="flex-1 h-12 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-foreground data-[state=active]:bg-transparent px-0 gap-2 transition-all border-b-2 border-transparent"
            >
              <Tag className="size-4" />
              <span className="text-xs font-medium">Tagged</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Posts Tab */}
        <TabsContent value="posts" className="mt-0">
          {isLoadingPosts ? (
            <PostsSkeleton />
          ) : userPosts.length === 0 ? (
            <EmptyPostsState />
          ) : (
            <div className="grid grid-cols-3 gap-0.5">
              {userPosts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                  className="relative aspect-square overflow-hidden cursor-pointer group"
                  onClick={() => handlePostGridClick(post)}
                >
                  {post.images && post.images.length > 0 ? (
                    <img
                      src={post.images[0]}
                      alt={post.caption || 'Post'}
                      className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#F0F4FF] via-[#F0F8FF] to-[#E8F4F8] dark:from-[#1a1f2a] dark:via-[#1a2228] dark:to-[#1a2828] flex flex-col items-center justify-center gap-1 p-2">
                      <FileText className="size-6 text-[#2F5C9B]/60" />
                      {post.caption && (
                        <p className="text-[10px] text-muted-foreground text-center leading-tight line-clamp-3">
                          {post.caption.slice(0, 60)}{post.caption.length > 60 ? '...' : ''}
                        </p>
                      )}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">❤ {post.likes}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Itineraries Tab */}
        <TabsContent value="itineraries" className="mt-0 px-4 py-4">
          {isLoadingItineraries ? (
            <ItinerariesSkeleton />
          ) : userItineraries.length === 0 ? (
            <EmptyItinerariesState />
          ) : (
            <div className="flex flex-col gap-3">
              {userItineraries.map((itinerary, index) => (
                <ItineraryCard
                  key={itinerary.id}
                  itinerary={itinerary}
                  index={index}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Phase 3: Travel Stats Tab - Now in TravelInsightsSection */}
        {/* Achievements Tab - Now in TravelInsightsSection */}

        {/* Phase 4: Photo Albums Tab */}
        {isOwnProfile && profileUserId && (
          <TabsContent value="albums" className="mt-0 px-4 py-4">
            <PhotoAlbums userId={profileUserId} isOwnProfile={isOwnProfile} />
          </TabsContent>
        )}

        {/* Tagged Tab */}
        <TabsContent value="tagged" className="mt-0">
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Tag className="size-7 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">No tagged posts yet</h3>
            <p className="text-sm text-muted-foreground max-w-[240px]">
              When people tag you in posts, they&apos;ll appear here.
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Follow Sheet */}
      {profileUserId && (
        <FollowSheet
          open={showFollowSheet}
          onOpenChange={setShowFollowSheet}
          userId={profileUserId}
          initialTab={followSheetTab}
        />
      )}

      {/* Edit Profile Dialog */}
      <Dialog open={showEditProfile} onOpenChange={setShowEditProfile}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your profile information.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-center">
              <Avatar className="size-20 border-2 border-[#2F5C9B]/20">
                <AvatarImage src={currentUser?.avatar || undefined} alt={name} />
                <AvatarFallback className="bg-gradient-to-br from-[#2F5C9B]/20 to-[#5CA5CD]/20 text-lg font-bold text-[#2F5C9B]">
                  {name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Name</label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Your name"
                className="h-9 text-sm rounded-lg"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Bio</label>
              <Input
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder="Tell us about yourself..."
                className="h-9 text-sm rounded-lg"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditProfile(false)}
              className="rounded-lg"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="bg-gradient-to-r from-[#2F5C9B] to-[#5CA5CD] text-white hover:opacity-90 rounded-lg"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function PostsSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-0.5">
      {Array.from({ length: 9 }).map((_, i) => (
        <Skeleton key={i} className="aspect-square rounded-none" />
      ))}
    </div>
  )
}

function ItinerariesSkeleton() {
  return (
    <div className="flex flex-col gap-3 py-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-20 rounded-xl" />
      ))}
    </div>
  )
}

function EmptyPostsState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-6">
      <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <ImagePlus className="size-7 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">No Posts Yet</h3>
      <p className="text-sm text-muted-foreground max-w-[240px]">
        Share your travel adventures and they&apos;ll appear on your profile.
      </p>
    </div>
  )
}

function EmptyItinerariesState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-6">
      <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Map className="size-7 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">No Itineraries Yet</h3>
      <p className="text-sm text-muted-foreground max-w-[240px]">
        Plan your next trip and your itineraries will show up here.
      </p>
    </div>
  )
}
