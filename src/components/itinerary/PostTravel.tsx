'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  Star,
  CheckCircle2,
  Globe,
  Lock,
  Share2,
  Bookmark,
  Camera,
  MapPin,
  Calendar,
  Users,
  Wallet,
  Clock,
  ChevronRight,
  ImagePlus,
  X,
  Download,
  Check,
  Plane,
  Heart,
  Trash2,
  Award,
  Sparkles,
  MessageCircle,
  Lightbulb,
  Target,
  TrendingUp,
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useAppStore } from '@/lib/store'

// Category colors - warm theme
const CATEGORY_COLORS: Record<string, string> = {
  Accommodation: '#2F5C9B',
  Food: '#5CA5CD',
  Transport: '#E58BEA',
  Activities: '#5CA5CD',
  Shopping: '#E879A8',
  Other: '#A78BFA',
}

const CATEGORY_ICONS: Record<string, string> = {
  Accommodation: '🏨',
  Food: '🍽️',
  Transport: '🚗',
  Activities: '🎯',
  Shopping: '🛍️',
  Other: '📦',
}

// Country flag emoji mapping
const countryFlags: Record<string, string> = {
  Japan: '🇯🇵',
  Indonesia: '🇮🇩',
  France: '🇫🇷',
  Italy: '🇮🇹',
  Thailand: '🇹🇭',
  Spain: '🇪🇸',
  Australia: '🇦🇺',
  Greece: '🇬🇷',
  Mexico: '🇲🇽',
  Portugal: '🇵🇹',
  'South Korea': '🇰🇷',
  Vietnam: '🇻🇳',
  Cambodia: '🇰🇭',
  USA: '🇺🇸',
  Brazil: '🇧🇷',
  Germany: '🇩🇪',
  UK: '🇬🇧',
  India: '🇮🇳',
  China: '🇨🇳',
  Peru: '🇵🇪',
  Morocco: '🇲🇦',
  Turkey: '🇹🇷',
  Iceland: '🇮🇸',
  NewZealand: '🇳🇿',
}

function getCountryFlag(country: string): string {
  return countryFlags[country] || '🌍'
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// Star Rating Component
function StarRating({ rating, onRate }: { rating: number; onRate: (r: number) => void }) {
  const [hover, setHover] = useState(0)

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onRate(star)}
          className="outline-none"
        >
          <Star
            className={`size-4 transition-colors ${
              star <= (hover || rating)
                ? 'text-[#E58BEA] fill-[#E58BEA]'
                : 'text-gray-300'
            }`}
          />
        </button>
      ))}
    </div>
  )
}

interface PhotoItem {
  id: number
  url: string
  isUploaded?: boolean
}

export default function PostTravel() {
  const { selectedItinerary, currentUser, setCurrentView, addPost, resetWizard } = useAppStore()
  const [isPublic, setIsPublic] = useState(true)
  const [isShareSheetOpen, setIsShareSheetOpen] = useState(false)
  const [activityRatings, setActivityRatings] = useState<Record<string, number>>({})
  const [photoCaptions, setPhotoCaptions] = useState<Record<number, string>>({})
  const [editingCaption, setEditingCaption] = useState<number | null>(null)
  const [isSavingMemory, setIsSavingMemory] = useState(false)
  const [isSharingPost, setIsSharingPost] = useState(false)
  const [savedMemory, setSavedMemory] = useState(false)
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<number>>(new Set())
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Trip reflections state
  const [reflectionAnswers, setReflectionAnswers] = useState<Record<string, string>>({})
  const [showReflections, setShowReflections] = useState(false)

  // Achievements state
  const [earnedAchievements, setEarnedAchievements] = useState<string[]>([])

  // User-uploaded photos only (no seeded/placeholder photos)
  const [uploadedPhotos, setUploadedPhotos] = useState<PhotoItem[]>([])

  const photos: PhotoItem[] = useMemo(() => {
    return uploadedPhotos
  }, [uploadedPhotos])

  // Auto-select first 4 photos when they're uploaded
  useEffect(() => {
    if (selectedPhotoIds.size === 0 && photos.length > 0) {
      setSelectedPhotoIds(new Set(photos.slice(0, Math.min(4, photos.length)).map((p) => p.id)))
    }
  }, [photos.length])

  // Completed activities
  const completedActivities = useMemo(() => {
    if (!selectedItinerary) return []
    return selectedItinerary.daysPlan
      .flatMap((day) => day.activities)
      .filter((a) => a.status === 'completed')
  }, [selectedItinerary])

  // Budget data
  const totalBudget = selectedItinerary?.budget || 0
  // Use itinerary currency, fallback to user's default currency, then USD
  const currency = selectedItinerary?.currency || currentUser?.currency || 'USD'
  console.log('[PostTravel] Currency:', currency, '| Itinerary:', selectedItinerary?.currency, '| User:', currentUser?.currency)
  const budgetItems = selectedItinerary?.budgetItems || []
  const totalSpent = budgetItems.reduce((sum, item) => sum + item.amount, 0)

  // Category breakdown
  const categoryData = useMemo(() => {
    const map: Record<string, number> = {}
    budgetItems.forEach((item) => {
      map[item.category] = (map[item.category] || 0) + item.amount
    })
    return Object.entries(map).map(([name, value]) => ({
      name,
      value: Math.round(value * 100) / 100,
      color: CATEGORY_COLORS[name] || CATEGORY_COLORS.Other,
    }))
  }, [budgetItems])

  // Per-person settlement summary
  const travelers = useMemo(() => {
    const people: { id: string; name: string }[] = []
    if (currentUser) people.push({ id: currentUser.id, name: 'You' })
    if (selectedItinerary?.companions) {
      selectedItinerary.companions.forEach((c) => people.push({ id: c.id, name: c.name }))
    }
    return people
  }, [currentUser, selectedItinerary])

  const settlementSummary = useMemo(() => {
    const map: Record<string, { paid: number; share: number }> = {}
    travelers.forEach((t) => {
      map[t.id] = { paid: 0, share: 0 }
    })
    budgetItems.forEach((item) => {
      if (map[item.paidBy]) map[item.paidBy].paid += item.amount
      const splitPeople = item.splitAmong.length > 0 ? item.splitAmong : travelers.map((t) => t.id)
      const perPerson = item.amount / splitPeople.length
      splitPeople.forEach((pid) => {
        if (map[pid]) map[pid].share += perPerson
      })
    })
    return travelers.map((t) => ({
      ...t,
      paid: Math.round((map[t.id]?.paid || 0) * 100) / 100,
      share: Math.round((map[t.id]?.share || 0) * 100) / 100,
      balance: Math.round(((map[t.id]?.paid || 0) - (map[t.id]?.share || 0)) * 100) / 100,
    }))
  }, [budgetItems, travelers])

  // Handle rate activity
  const handleRate = (activityId: string, rating: number) => {
    setActivityRatings((prev) => ({ ...prev, [activityId]: rating }))
  }

  // Toggle photo selection for sharing
  const togglePhotoSelection = (photoId: number) => {
    setSelectedPhotoIds((prev) => {
      const next = new Set(prev)
      if (next.has(photoId)) {
        next.delete(photoId)
      } else {
        if (next.size < 5) next.add(photoId)
      }
      return next
    })
  }

  // Handle file upload for photos
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    Array.from(files).forEach((file) => {
      if (photos.length >= 15) return
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        if (result) {
          const newId = Date.now() + Math.random()
          setUploadedPhotos((prev) => [...prev, { id: newId, url: result, isUploaded: true }])
          setSelectedPhotoIds((prev) => {
            if (prev.size < 5) {
              const next = new Set(prev)
              next.add(newId)
              return next
            }
            return prev
          })
        }
      }
      reader.readAsDataURL(file)
    })

    e.target.value = ''
  }

  // Remove an uploaded photo
  const handleRemovePhoto = (photoId: number) => {
    setUploadedPhotos((prev) => prev.filter((p) => p.id !== photoId))
    setSelectedPhotoIds((prev) => {
      const next = new Set(prev)
      next.delete(photoId)
      return next
    })
  }

  // Share as post
  const handleShareAsPost = async () => {
    if (!selectedItinerary || !currentUser) return
    setIsSharingPost(true)
    try {
      const topRated = Object.entries(activityRatings)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([id]) => completedActivities.find((a) => a.id === id))
        .filter(Boolean)

      const selectedPhotos = photos.filter((p) => selectedPhotoIds.has(p.id))

      const caption = `✈️ ${selectedItinerary.title}\n📍 ${selectedItinerary.location}, ${selectedItinerary.country}\n🗓️ ${selectedItinerary.days} days · ${completedActivities.length} activities\n💰 Budget: ${formatCurrency(totalSpent, currency)} / ${formatCurrency(totalBudget, currency)}${
        topRated.length > 0
          ? '\n⭐ Top rated: ' + topRated.map((a) => a?.title).join(', ')
          : ''
      }`

      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caption,
          images: selectedPhotos.map((p) => p.url),
          isPublic,
          location: selectedItinerary.location,
          tags: ['travel', 'travereel', selectedItinerary.country.toLowerCase()],
          authorId: currentUser.id,
          itineraryId: selectedItinerary.id,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        const p = data.post
        addPost({
          ...p,
          isLiked: false,
          isBookmarked: false,
          likes: p._count?.likes ?? p.likes ?? 0,
          comments: p._count?.comments ?? p.comments ?? 0,
          author: {
            id: p.author.id,
            email: p.author.email || '',
            username: p.author.username,
            name: p.author.name,
            avatar: p.author.avatar,
            bio: null,
            isPrivate: false,
          },
        })
        setIsShareSheetOpen(false)
      }
    } catch (err) {
      console.error('Failed to share post:', err)
    } finally {
      setIsSharingPost(false)
    }
  }

  // Save as memory
  const handleSaveMemory = async () => {
    if (!selectedItinerary || !currentUser) return
    setIsSavingMemory(true)
    try {
      const caption = `📌 Memory: ${selectedItinerary.title} - ${selectedItinerary.location}\n${completedActivities.length} activities completed in ${selectedItinerary.days} days.`

      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caption,
          images: photos.slice(0, 3).map((p) => p.url),
          isPublic: false,
          isMemory: true,
          location: selectedItinerary.location,
          tags: ['memory', selectedItinerary.country.toLowerCase()],
          authorId: currentUser.id,
          itineraryId: selectedItinerary.id,
        }),
      })

      if (res.ok) {
        setSavedMemory(true)
      }
    } catch (err) {
      console.error('Failed to save memory:', err)
    } finally {
      setIsSavingMemory(false)
    }
  }

  // Download budget as CSV
  const handleDownloadCSV = () => {
    if (!selectedItinerary) return

    const rows: string[][] = [
      ['Trip Budget Report'],
      [],
      ['Trip', selectedItinerary.title],
      ['Location', `${selectedItinerary.location}, ${selectedItinerary.country}`],
      ['Duration', `${selectedItinerary.days} days`],
      ['Total Budget', formatCurrency(totalBudget, currency)],
      ['Total Spent', formatCurrency(totalSpent, currency)],
      ['Remaining', formatCurrency(totalBudget - totalSpent, currency)],
      [],
      ['Category Breakdown'],
      ['Category', 'Amount', 'Percentage'],
    ]

    categoryData.forEach((cat) => {
      const pct = totalSpent > 0 ? ((cat.value / totalSpent) * 100).toFixed(1) : '0'
      rows.push([cat.name, formatCurrency(cat.value, currency), `${pct}%`])
    })

    rows.push([])
    rows.push(['Budget Items'])
    rows.push(['Name', 'Amount', 'Category', 'Paid By'])

    budgetItems.forEach((item) => {
      const payer = travelers.find((t) => t.id === item.paidBy)
      rows.push([item.name, formatCurrency(item.amount, currency), item.category, payer?.name || 'Unknown'])
    })

    if (travelers.length > 1) {
      rows.push([])
      rows.push(['Settlement Summary'])
      rows.push(['Person', 'Paid', 'Share', 'Balance'])
      settlementSummary.forEach((person) => {
        rows.push([
          person.name,
          formatCurrency(person.paid, currency),
          formatCurrency(person.share, currency),
          formatCurrency(person.balance, currency),
        ])
      })
    }

    const csvContent = rows.map((r) => r.map((cell) => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `budget-report-${selectedItinerary.title.replace(/\s+/g, '-').toLowerCase()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Plan another trip
  const handlePlanAnotherTrip = () => {
    resetWizard()
    setCurrentView('itinerary')
  }

  // Reflection prompts
  const reflectionPrompts = [
    { id: 'favorite', question: 'What was your favorite moment?', icon: Heart },
    { id: 'surprise', question: 'What surprised you the most?', icon: Sparkles },
    { id: 'recommend', question: 'Would you visit again?', icon: MessageCircle },
    { id: 'learn', question: 'What did you learn?', icon: Lightbulb },
    { id: 'food', question: 'Best food you tried?', icon: Target },
  ]

  // Calculate achievements
  useEffect(() => {
    if (!selectedItinerary) return
    const achievements: string[] = []

    // Trip completion
    achievements.push('trip-completed')

    // Budget master (stayed within budget)
    if (totalSpent <= totalBudget) {
      achievements.push('budget-master')
    }

    // Activity explorer (completed 80%+ activities)
    const totalActivities = selectedItinerary.daysPlan.flatMap(d => d.activities).length
    if (totalActivities > 0 && completedActivities.length / totalActivities >= 0.8) {
      achievements.push('activity-explorer')
    }

    // Photo enthusiast (uploaded 5+ photos)
    if (uploadedPhotos.length >= 5) {
      achievements.push('photo-enthusiast')
    }

    // Multi-city traveler (visited 3+ cities)
    const uniqueCities = new Set(selectedItinerary.daysPlan.map(d => d.title))
    if (uniqueCities.size >= 3) {
      achievements.push('multi-city')
    }

    setEarnedAchievements(achievements)
  }, [selectedItinerary, totalSpent, totalBudget, completedActivities.length, uploadedPhotos.length])

  if (!selectedItinerary) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center">
        <Bookmark className="size-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-foreground">No Trip Selected</h3>
        <p className="text-sm text-muted-foreground mt-1">Select a completed trip to view the summary.</p>
      </div>
    )
  }

  const flag = getCountryFlag(selectedItinerary.country)
  const spentPercentage = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0
  const budgetRemaining = totalBudget - totalSpent
  const isOverBudget = budgetRemaining < 0

  return (
    <div className="max-w-md mx-auto px-4 py-4 space-y-5 pb-6">
      {/* Trip Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-gradient-to-br from-[#2F5C9B] via-[#5CA5CD] to-[#E58BEA] p-5 text-white shadow-lg"
      >
        <div className="flex items-start gap-3 mb-4">
          <span className="text-3xl">{flag}</span>
          <div className="flex-1">
            <h2 className="text-xl font-bold">{selectedItinerary.title}</h2>
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin className="size-3 text-white/80" />
              <span className="text-sm text-white/90">{selectedItinerary.location}, {selectedItinerary.country}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/15 rounded-lg px-3 py-2 text-center">
            <Calendar className="size-4 text-white/70 mx-auto mb-1" />
            <p className="text-lg font-bold">{selectedItinerary.days}</p>
            <p className="text-[10px] text-white/70 uppercase tracking-wide">Days</p>
          </div>
          <div className="bg-white/15 rounded-lg px-3 py-2 text-center">
            <Wallet className="size-4 text-white/70 mx-auto mb-1" />
            <p className="text-lg font-bold">{formatCurrency(totalSpent, currency).replace(/[A-Z]{3}/, '').trim()}</p>
            <p className="text-[10px] text-white/70 uppercase tracking-wide">Spent</p>
          </div>
          <div className="bg-white/15 rounded-lg px-3 py-2 text-center">
            <CheckCircle2 className="size-4 text-white/70 mx-auto mb-1" />
            <p className="text-lg font-bold">{completedActivities.length}</p>
            <p className="text-[10px] text-white/70 uppercase tracking-wide">Activities</p>
          </div>
        </div>

        {/* Companions */}
        {travelers.length > 1 && (
          <div className="mt-3 flex items-center gap-2">
            <Users className="size-3.5 text-white/70" />
            <span className="text-xs text-white/80">With {travelers.slice(1).map((t) => t.name).join(', ')}</span>
          </div>
        )}
      </motion.div>

      {/* Share Your Trip - Prominent CTA Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.03 }}
      >
        <Card className="border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-[#2F5C9B]/5 via-[#5CA5CD]/5 to-[#E58BEA]/5 px-4 pt-4 pb-3">
            <CardHeader className="p-0 pb-0">
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <Share2 className="size-5 text-[#2F5C9B]" />
                Share Your Trip
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Your trip is complete! Share your experience with others or save it for yourself.
              </p>
            </CardHeader>
          </div>
          <CardContent className="p-4 pt-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {isPublic ? (
                  <Globe className="size-4 text-[#5CA5CD]" />
                ) : (
                  <Lock className="size-4 text-muted-foreground" />
                )}
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {isPublic ? 'Public' : 'Private'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isPublic ? 'Anyone can see this trip' : 'Only you can see this trip'}
                  </p>
                </div>
              </div>
              <Switch
                checked={isPublic}
                onCheckedChange={setIsPublic}
                className="data-[state=checked]:bg-[#5CA5CD]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* Share as Post - Primary CTA */}
              <Sheet open={isShareSheetOpen} onOpenChange={setIsShareSheetOpen}>
                <SheetTrigger asChild>
                  <Button className="h-14 bg-gradient-to-r from-[#2F5C9B] via-[#5CA5CD] to-[#E58BEA] hover:opacity-90 text-white font-semibold flex flex-col gap-0.5 rounded-xl">
                    <Share2 className="size-5" />
                    <span className="text-[11px] font-medium">Share as Post</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="rounded-t-2xl max-h-[80vh]">
                  <SheetHeader className="pb-3">
                    <SheetTitle className="text-left">Share Trip as Post</SheetTitle>
                  </SheetHeader>
                  <div className="space-y-4 px-1 pb-6 overflow-y-auto max-h-[65vh]">
                    {/* Preview */}
                    <div className="rounded-lg border border-gray-200 p-3 bg-muted/50">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{flag}</span>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{selectedItinerary.title}</p>
                          <p className="text-xs text-muted-foreground">{selectedItinerary.location}, {selectedItinerary.country}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{selectedItinerary.days} days</span>
                        <span>{completedActivities.length} activities</span>
                        <span>{formatCurrency(totalSpent, currency)} spent</span>
                      </div>
                    </div>

                    {/* Photo Selection */}
                    <div>
                      <p className="text-sm font-medium text-foreground mb-2">
                        Select Photos ({selectedPhotoIds.size}/5)
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {photos.map((photo, index) => {
                          const isSelected = selectedPhotoIds.has(photo.id)
                          const canSelect = isSelected || selectedPhotoIds.size < 5
                          return (
                            <button
                              key={photo.id}
                              onClick={() => canSelect && togglePhotoSelection(photo.id)}
                              className={`relative aspect-square rounded-lg overflow-hidden transition-all ${
                                isSelected
                                  ? 'ring-2 ring-[#5CA5CD] ring-offset-1'
                                  : canSelect
                                    ? 'opacity-70 hover:opacity-100'
                                    : 'opacity-40 cursor-not-allowed'
                              }`}
                            >
                              <img
                                src={photo.url}
                                alt={`Trip photo ${index + 1}`}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                              {isSelected && (
                                <div className="absolute top-1 right-1 size-5 rounded-full bg-[#5CA5CD] flex items-center justify-center">
                                  <Check className="size-3 text-white" />
                                </div>
                              )}
                            </button>
                          )
                        })}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1.5">
                        Tap to select up to 5 photos for your post
                      </p>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {isPublic ? <Globe className="size-4 text-[#5CA5CD]" /> : <Lock className="size-4" />}
                        {isPublic ? 'Public post' : 'Private post'}
                      </div>
                      <Switch
                        checked={isPublic}
                        onCheckedChange={setIsPublic}
                        className="data-[state=checked]:bg-[#5CA5CD]"
                      />
                    </div>

                    <Button
                      className="w-full h-11 bg-gradient-to-r from-[#2F5C9B] via-[#5CA5CD] to-[#E58BEA] hover:opacity-90 text-white font-semibold"
                      onClick={handleShareAsPost}
                      disabled={isSharingPost || selectedPhotoIds.size === 0}
                    >
                      {isSharingPost ? 'Sharing...' : `Share Post with ${selectedPhotoIds.size} Photo${selectedPhotoIds.size !== 1 ? 's' : ''}`}
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>

              {/* Save as Memory - Secondary CTA */}
              <Button
                variant="outline"
                className={`h-14 flex flex-col gap-0.5 rounded-xl font-semibold ${
                  savedMemory
                    ? 'border-emerald-300 text-emerald-600 bg-emerald-50'
                    : 'border-[#5CA5CD] text-[#5CA5CD] hover:bg-[#5CA5CD]/10'
                }`}
                onClick={handleSaveMemory}
                disabled={isSavingMemory || savedMemory}
              >
                {savedMemory ? (
                  <>
                    <CheckCircle2 className="size-5" />
                    <span className="text-[11px] font-medium">Saved!</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="size-5" />
                    <span className="text-[11px] font-medium">{isSavingMemory ? 'Saving...' : 'Save as Memory'}</span>
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Photo/Memories Gallery - Enhanced */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <Card className="border-gray-100 shadow-sm">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Camera className="size-4 text-[#2F5C9B]" />
              Photo Memories
              <Badge variant="secondary" className="ml-auto text-xs bg-[#2F5C9B]/10 text-[#2F5C9B]">
                {photos.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {/* Gallery Grid - First image larger (featured), rest in 3-column grid */}
            <div className="space-y-1.5">
              {/* Featured first photo */}
              {photos.length > 0 && (
                <div className="relative aspect-[4/3] rounded-xl overflow-hidden group">
                  <img
                    src={photos[0].url}
                    alt="Featured trip photo"
                    className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    {editingCaption === photos[0].id ? (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2">
                        <div className="flex items-center gap-1">
                          <Input
                            placeholder="Add caption..."
                            value={photoCaptions[photos[0].id] || ''}
                            onChange={(e) =>
                              setPhotoCaptions((prev) => ({ ...prev, [photos[0].id]: e.target.value }))
                            }
                            className="h-7 text-xs bg-white/20 border-white/30 text-white placeholder:text-white/50"
                            autoFocus
                            onBlur={() => setEditingCaption(null)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') setEditingCaption(null)
                            }}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-white hover:bg-white/20"
                            onClick={() => setEditingCaption(null)}
                          >
                            <X className="size-3" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditingCaption(photos[0].id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs bg-black/40 rounded-full px-3 py-1"
                      >
                        {photoCaptions[photos[0].id] ? 'Edit Caption' : 'Add Caption'}
                      </button>
                    )}
                  </div>
                  {photoCaptions[photos[0].id] && editingCaption !== photos[0].id && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                      <p className="text-xs text-white truncate">{photoCaptions[photos[0].id]}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Rest of photos in grid */}
              {photos.length > 1 && (
                <div className="grid grid-cols-3 gap-1.5">
                  {photos.slice(1).map((photo, index) => (
                    <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden group">
                      <img
                        src={photo.url}
                        alt={`Trip photo ${index + 2}`}
                        className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        {editingCaption === photo.id ? (
                          <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1.5">
                            <div className="flex items-center gap-1">
                              <Input
                                placeholder="Add caption..."
                                value={photoCaptions[photo.id] || ''}
                                onChange={(e) =>
                                  setPhotoCaptions((prev) => ({ ...prev, [photo.id]: e.target.value }))
                                }
                                className="h-6 text-[10px] bg-white/20 border-white/30 text-white placeholder:text-white/50"
                                autoFocus
                                onBlur={() => setEditingCaption(null)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') setEditingCaption(null)
                                }}
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-6 text-white hover:bg-white/20"
                                onClick={() => setEditingCaption(null)}
                              >
                                <X className="size-3" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setEditingCaption(photo.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-[10px] bg-black/40 rounded-full px-2 py-0.5"
                          >
                            {photoCaptions[photo.id] ? 'Edit' : 'Caption'}
                          </button>
                        )}
                      </div>
                      {photoCaptions[photo.id] && editingCaption !== photo.id && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1.5">
                          <p className="text-[9px] text-white truncate">{photoCaptions[photo.id]}</p>
                        </div>
                      )}
                      {/* Delete button for uploaded photos */}
                      {photo.isUploaded && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRemovePhoto(photo.id)
                          }}
                          className="absolute top-1 right-1 size-5 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#2F5C9B]"
                        >
                          <Trash2 className="size-3 text-white" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upload button */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
              aria-label="Upload photos"
            />
            <Button
              variant="outline"
              className="w-full mt-3 h-10 text-xs border-dashed border-gray-300 text-muted-foreground hover:text-[#5CA5CD] hover:border-[#5CA5CD]"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus className="size-4 mr-1.5" />
              Upload Photos
              {photos.length >= 15 ? ' (Full)' : ` (${photos.length}/15)`}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Trip Budget Report - Enhanced */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-gray-100 shadow-sm">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Wallet className="size-4 text-[#E58BEA]" />
              Trip Budget Report
              <div className="ml-auto flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[#5CA5CD] text-xs h-6 px-2 hover:bg-[#5CA5CD]/10"
                  onClick={handleDownloadCSV}
                >
                  <Download className="size-3 mr-0.5" />
                  CSV
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[#5CA5CD] text-xs h-6 px-2 hover:bg-[#5CA5CD]/10"
                  onClick={() => setCurrentView('budget-tracker')}
                >
                  Details
                  <ChevronRight className="size-3 ml-0.5" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {/* Budget vs Actual - Prominent Display */}
            <div className="rounded-xl bg-gradient-to-r from-[#5CA5CD]/5 to-[#E58BEA]/5 p-3 mb-3">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total Budget</p>
                  <p className="text-lg font-bold text-foreground">{formatCurrency(totalBudget, currency)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Actual Spending</p>
                  <p className={`text-lg font-bold ${isOverBudget ? 'text-[#2F5C9B]' : 'text-foreground'}`}>
                    {formatCurrency(totalSpent, currency)}
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-3 bg-white/60 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${spentPercentage}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className={`h-full rounded-full ${
                    spentPercentage >= 100 ? 'bg-[#2F5C9B]' : spentPercentage >= 90 ? 'bg-[#5CA5CD]' : spentPercentage >= 70 ? 'bg-[#E58BEA]' : 'bg-[#5CA5CD]'
                  }`}
                />
              </div>

              {/* Remaining or Over budget */}
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-[10px] text-muted-foreground">{spentPercentage.toFixed(0)}% used</span>
                <span className={`text-xs font-medium ${isOverBudget ? 'text-[#2F5C9B]' : budgetRemaining === 0 ? 'text-[#E58BEA]' : 'text-[#5CA5CD]'}`}>
                  {isOverBudget
                    ? `Over budget by ${formatCurrency(Math.abs(budgetRemaining), currency)}`
                    : budgetRemaining === 0
                      ? 'Budget fully used'
                      : `${formatCurrency(budgetRemaining, currency)} remaining`
                  }
                </span>
              </div>
            </div>

            {/* Mini Chart + Legend */}
            {categoryData.length > 0 ? (
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={22}
                        outerRadius={40}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="none"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-1.5">
                  {categoryData.map((cat) => (
                    <div key={cat.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div
                          className="size-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="text-[11px] text-muted-foreground">
                          {CATEGORY_ICONS[cat.name]} {cat.name}
                        </span>
                      </div>
                      <span className="text-[11px] font-medium text-foreground">
                        {formatCurrency(cat.value, currency)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-2">No budget data recorded</p>
            )}

            {/* Per-person settlement */}
            {travelers.length > 1 && settlementSummary.some((s) => Math.abs(s.balance) > 0.01) && (
              <>
                <Separator className="my-3" />
                <p className="text-xs font-medium text-foreground mb-2">Settlement Summary</p>
                <div className="space-y-1.5">
                  {settlementSummary.map((person) => (
                    <div key={person.id} className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{person.name}</span>
                      <span
                        className={`text-xs font-medium ${
                          person.balance > 0
                            ? 'text-emerald-600'
                            : person.balance < 0
                              ? 'text-[#2F5C9B]'
                              : 'text-muted-foreground'
                        }`}
                      >
                        {person.balance > 0 ? '+' : ''}{formatCurrency(person.balance, currency)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Download Budget Report Button */}
            <Button
              variant="outline"
              className="w-full mt-3 h-10 text-xs border-[#5CA5CD]/30 text-[#5CA5CD] hover:bg-[#5CA5CD]/10 hover:border-[#5CA5CD]/50 font-medium"
              onClick={handleDownloadCSV}
            >
              <Download className="size-4 mr-1.5" />
              Download Budget Report
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Activity Highlights */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Card className="border-gray-100 shadow-sm">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-500" />
              Activity Highlights
              <Badge variant="secondary" className="ml-auto text-xs bg-emerald-100 text-emerald-700">
                {completedActivities.length} completed
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {completedActivities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No completed activities</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                {completedActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2.5 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <CheckCircle2 className="size-4 text-emerald-500 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm text-foreground truncate">{activity.title}</p>
                        {activity.location && (
                          <p className="text-xs text-muted-foreground truncate">{activity.location}</p>
                        )}
                      </div>
                    </div>
                    <StarRating
                      rating={activityRatings[activity.id] || 0}
                      onRate={(r) => handleRate(activity.id, r)}
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Trip Summary Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }}
      >
        <Card className="border-gray-100 shadow-sm">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="size-4 text-[#5CA5CD]" />
              Trip Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-gradient-to-br from-[#2F5C9B]/10 to-[#5CA5CD]/10 p-3">
                <Calendar className="size-4 text-[#2F5C9B] mb-1" />
                <p className="text-2xl font-bold text-foreground">{selectedItinerary.days}</p>
                <p className="text-[10px] text-muted-foreground">Days Traveled</p>
              </div>
              <div className="rounded-lg bg-gradient-to-br from-[#5CA5CD]/10 to-[#E58BEA]/10 p-3">
                <CheckCircle2 className="size-4 text-[#5CA5CD] mb-1" />
                <p className="text-2xl font-bold text-foreground">{completedActivities.length}</p>
                <p className="text-[10px] text-muted-foreground">Activities Done</p>
              </div>
              <div className="rounded-lg bg-gradient-to-br from-[#E58BEA]/10 to-[#2F5C9B]/10 p-3">
                <MapPin className="size-4 text-[#E58BEA] mb-1" />
                <p className="text-2xl font-bold text-foreground">{new Set(selectedItinerary.daysPlan.map(d => d.title)).size}</p>
                <p className="text-[10px] text-muted-foreground">Places Visited</p>
              </div>
              <div className="rounded-lg bg-gradient-to-br from-[#E879A8]/10 to-[#5CA5CD]/10 p-3">
                <Camera className="size-4 text-[#E879A8] mb-1" />
                <p className="text-2xl font-bold text-foreground">{uploadedPhotos.length}</p>
                <p className="text-[10px] text-muted-foreground">Photos Uploaded</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Trip Achievements */}
      {earnedAchievements.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-gray-100 shadow-sm">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Award className="size-4 text-[#E58BEA]" />
                Trip Achievements
                <Badge variant="secondary" className="ml-auto text-xs bg-[#E58BEA]/10 text-[#E58BEA]">
                  {earnedAchievements.length} earned
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="grid grid-cols-2 gap-2">
                {earnedAchievements.map((achievement) => {
                  const achievementData: Record<string, { name: string; icon: string; color: string }> = {
                    'trip-completed': { name: 'Trip Completed', icon: '🎉', color: 'from-[#2F5C9B]/10 to-[#5CA5CD]/10' },
                    'budget-master': { name: 'Budget Master', icon: '💰', color: 'from-[#5CA5CD]/10 to-[#E58BEA]/10' },
                    'activity-explorer': { name: 'Activity Explorer', icon: '🗺️', color: 'from-[#5CA5CD]/10 to-[#E58BEA]/10' },
                    'photo-enthusiast': { name: 'Photo Enthusiast', icon: '📸', color: 'from-[#E879A8]/10 to-[#2F5C9B]/10' },
                    'multi-city': { name: 'Multi-City Traveler', icon: '🏙️', color: 'from-[#E58BEA]/10 to-[#5CA5CD]/10' },
                  }
                  const data = achievementData[achievement] || { name: 'Achievement', icon: '⭐', color: 'from-gray-100 to-gray-50' }
                  return (
                    <div
                      key={achievement}
                      className={`rounded-lg bg-gradient-to-br ${data.color} p-3 border border-gray-100`}
                    >
                      <div className="text-2xl mb-1">{data.icon}</div>
                      <p className="text-xs font-semibold text-foreground">{data.name}</p>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Trip Reflections */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22 }}
      >
        <Card className="border-gray-100 shadow-sm">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <MessageCircle className="size-4 text-[#E879A8]" />
              Trip Reflections
              <Badge variant="secondary" className="ml-auto text-xs bg-[#E879A8]/10 text-[#E879A8]">
                Optional
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-xs text-muted-foreground mb-3">
              Reflect on your journey and capture your favorite memories
            </p>
            <div className="space-y-3">
              {reflectionPrompts.map((prompt) => {
                const Icon = prompt.icon
                return (
                  <div key={prompt.id} className="rounded-lg border border-gray-100 p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="size-6 rounded-full bg-[#E879A8]/10 flex items-center justify-center">
                        <Icon className="size-3 text-[#E879A8]" />
                      </div>
                      <span className="text-xs font-medium text-foreground">{prompt.question}</span>
                    </div>
                    <Textarea
                      placeholder="Share your thoughts..."
                      value={reflectionAnswers[prompt.id] || ''}
                      onChange={(e) =>
                        setReflectionAnswers((prev) => ({ ...prev, [prompt.id]: e.target.value }))
                      }
                      className="text-xs h-16 resize-none"
                    />
                  </div>
                )
              })}
            </div>
            <Button
              variant="outline"
              className="w-full mt-3 h-9 text-xs border-[#E879A8]/30 text-[#E879A8] hover:bg-[#E879A8]/10 hover:border-[#E879A8]/50 font-medium"
              onClick={() => setShowReflections(!showReflections)}
            >
              {showReflections ? 'Hide Reflections' : 'View All Reflections'}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Plan Another Trip CTA */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-[#5CA5CD]/10 via-[#E58BEA]/10 to-[#2F5C9B]/10 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="size-12 rounded-full bg-gradient-to-br from-[#5CA5CD] to-[#E58BEA] flex items-center justify-center flex-shrink-0">
                <Plane className="size-6 text-white" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">Ready for Your Next Adventure?</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Start planning your next trip with our AI-powered itinerary wizard.</p>
              </div>
            </div>
            <Button
              className="w-full h-11 bg-gradient-to-r from-[#5CA5CD] to-[#E58BEA] hover:opacity-90 text-white font-semibold rounded-xl"
              onClick={handlePlanAnotherTrip}
            >
              <Plane className="size-4 mr-1.5" />
              Plan Another Trip
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}
