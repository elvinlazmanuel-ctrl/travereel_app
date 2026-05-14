'use client'

import { useState, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Camera,
  MapPin,
  Hash,
  Globe,
  Lock,
  Clock,
  X,
  Image as ImageIcon,
  Check,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { useAppStore } from '@/lib/store'

// Popular cities for autocomplete
const POPULAR_CITIES = [
  'Tokyo, Japan', 'Paris, France', 'New York, USA', 'London, UK',
  'Rome, Italy', 'Barcelona, Spain', 'Sydney, Australia', 'Bangkok, Thailand',
  'Bali, Indonesia', 'Dubai, UAE', 'Singapore', 'Seoul, South Korea',
  'Amsterdam, Netherlands', 'Prague, Czech Republic', 'Istanbul, Turkey',
  'Lisbon, Portugal', 'Berlin, Germany', 'Vienna, Austria',
  'Cancun, Mexico', 'Cusco, Peru', 'Marrakech, Morocco', 'Reykjavik, Iceland',
  'Hanoi, Vietnam', 'Siem Reap, Cambodia', 'Santorini, Greece',
  'Rio de Janeiro, Brazil', 'Cape Town, South Africa', 'Mumbai, India',
  'Manila, Philippines', 'Cebu, Philippines', 'Baguio, Philippines',
  'Palawan, Philippines', 'Boracay, Philippines', 'Siargao, Philippines',
  'Hong Kong', 'Taipei, Taiwan', 'Osaka, Japan', 'Kyoto, Japan',
  'Florence, Italy', 'Venice, Italy', 'Madrid, Spain', 'Munich, Germany',
  'Zurich, Switzerland', 'Vancouver, Canada', 'San Francisco, USA',
  'Los Angeles, USA', 'Miami, USA', 'Honolulu, USA',
  'Kuala Lumpur, Malaysia', 'Jakarta, Indonesia',
]

interface SelectedFile {
  file: File
  preview: string
}

export default function CreatePost() {
  const { currentUser, addPost, setCurrentView, previousView } = useAppStore()
  const [caption, setCaption] = useState('')
  const [location, setLocation] = useState('')
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [isPublic, setIsPublic] = useState(true)
  const [isMemory, setIsMemory] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([])
  const [showCitySuggestions, setShowCitySuggestions] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // City autocomplete
  const citySuggestions = useMemo(() => {
    if (!location.trim()) return []
    const query = location.toLowerCase().trim()
    return POPULAR_CITIES.filter(city =>
      city.toLowerCase().includes(query)
    ).slice(0, 6)
  }, [location])

  const handleAddTag = () => {
    const trimmed = tagInput.trim().replace(/^#/, '')
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      handleAddTag()
    }
  }

  // Photo upload handler
  const handlePhotoClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newFiles: SelectedFile[] = []
    Array.from(files).forEach(file => {
      if (selectedFiles.length + newFiles.length >= 5) return // Max 5 images
      const preview = URL.createObjectURL(file)
      newFiles.push({ file, preview })
    })

    setSelectedFiles(prev => [...prev, ...newFiles].slice(0, 5))

    // Reset file input so same file can be selected again
    e.target.value = ''
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => {
      const removed = prev[index]
      if (removed) URL.revokeObjectURL(removed.preview)
      return prev.filter((_, i) => i !== index)
    })
  }

  // City selection
  const selectCity = (city: string) => {
    setLocation(city)
    setShowCitySuggestions(false)
  }

  // Upload a single image to the server
  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('userId', currentUser!.id)

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    if (res.ok) {
      const data = await res.json()
      return data.url
    }
    throw new Error('Upload failed')
  }

  const handleSubmit = async () => {
    if (!caption.trim() && tags.length === 0 && selectedFiles.length === 0) return
    if (!currentUser) return

    setIsSubmitting(true)
    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Upload all images first
      let imageUrls: string[] = []
      if (selectedFiles.length > 0) {
        const total = selectedFiles.length
        const uploadedUrls: string[] = []
        for (let i = 0; i < selectedFiles.length; i++) {
          const url = await uploadImage(selectedFiles[i].file)
          uploadedUrls.push(url)
          setUploadProgress(Math.round(((i + 1) / total) * 100))
        }
        imageUrls = uploadedUrls
      }

      setIsUploading(false)

      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caption: caption.trim(),
          images: imageUrls, // Can be empty for text-only posts
          isPublic,
          location: location.trim() || null,
          latitude: latitude,
          longitude: longitude,
          tags,
          authorId: currentUser.id,
          isMemory,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        addPost({
          ...data.post,
          isLiked: false,
          likes: 0,
          comments: 0,
          author: {
            id: currentUser.id,
            email: currentUser.email,
            username: currentUser.username,
            name: currentUser.name,
            avatar: currentUser.avatar,
            bio: currentUser.bio,
            isPrivate: currentUser.isPrivate,
          },
        })
        // Clean up object URLs
        selectedFiles.forEach(f => URL.revokeObjectURL(f.preview))
        setCurrentView(previousView || 'feed')
      }
    } catch (error) {
      console.error('Failed to create post:', error)
    } finally {
      setIsSubmitting(false)
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleBack = () => {
    // Clean up object URLs
    selectedFiles.forEach(f => URL.revokeObjectURL(f.preview))
    setCurrentView(previousView || 'feed')
  }

  const canSubmit = caption.trim() || tags.length > 0 || selectedFiles.length > 0

  return (
    <div className="max-w-md mx-auto min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleBack}
          className="p-1 rounded-full hover:bg-muted transition-colors outline-none"
          aria-label="Go back"
        >
          <ArrowLeft className="size-5 text-muted-foreground" />
        </motion.button>
        <h2 className="text-lg font-semibold text-foreground">New Post</h2>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !canSubmit}
          className="bg-gradient-to-r from-[#FF6B6B] to-[#FF8C42] hover:from-[#FF6B6B]/90 hover:to-[#FF8C42]/90 text-white border-0 rounded-lg px-5 shadow-sm disabled:opacity-50"
        >
          {isSubmitting ? (
            isUploading ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="size-4 animate-spin" />
                {uploadProgress}%
              </span>
            ) : 'Sharing...'
          ) : 'Share'}
        </Button>
      </div>

      {/* Upload progress bar */}
      <AnimatePresence>
        {isUploading && (
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: uploadProgress / 100 }}
            exit={{ scaleX: 0 }}
            className="h-1 bg-gradient-to-r from-[#FF6B6B] to-[#FF8C42] origin-left"
            transition={{ duration: 0.3 }}
          />
        )}
      </AnimatePresence>

      <div className="px-4 py-4 space-y-5">
        {/* Image preview / upload area */}
        <div className="relative">
          {selectedFiles.length > 0 ? (
            <div className="space-y-2">
              {/* Main image preview */}
              <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-muted">
                <img
                  src={selectedFiles[0].preview}
                  alt="Selected photo"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => removeFile(0)}
                  className="absolute top-2 right-2 size-7 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors"
                  aria-label="Remove photo"
                >
                  <X className="size-4 text-white" />
                </button>
                {selectedFiles.length > 1 && (
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-black/50 text-white text-xs font-medium">
                    1/{selectedFiles.length}
                  </div>
                )}
              </div>

              {/* Thumbnail row for multiple images */}
              {selectedFiles.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {selectedFiles.map((sf, i) => (
                    <div
                      key={sf.preview}
                      className="relative size-16 rounded-lg overflow-hidden flex-shrink-0 border-2 border-transparent hover:border-[#FF8C42] transition-colors cursor-pointer"
                      onClick={() => {
                        // Move this image to first position
                        setSelectedFiles(prev => {
                          const newArr = [...prev]
                          const [removed] = newArr.splice(i, 1)
                          newArr.unshift(removed)
                          return newArr
                        })
                      }}
                    >
                      <img src={sf.preview} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          removeFile(i)
                        }}
                        className="absolute -top-1 -right-1 size-5 rounded-full bg-[#FF6B6B] flex items-center justify-center"
                        aria-label="Remove photo"
                      >
                        <X className="size-3 text-white" />
                      </button>
                    </div>
                  ))}
                  {selectedFiles.length < 5 && (
                    <button
                      onClick={handlePhotoClick}
                      className="size-16 rounded-lg border-2 border-dashed border-border flex items-center justify-center flex-shrink-0 hover:border-[#FF8C42] transition-colors cursor-pointer"
                    >
                      <ImageIcon className="size-5 text-muted-foreground" />
                    </button>
                  )}
                </div>
              )}

              {/* Add more button */}
              {selectedFiles.length < 5 && selectedFiles.length === 1 && (
                <button
                  onClick={handlePhotoClick}
                  className="w-full h-9 text-xs border-dashed border-border text-muted-foreground hover:text-[#FF8C42] hover:border-[#FF8C42] flex items-center justify-center rounded-md border cursor-pointer transition-colors bg-background"
                >
                  <ImageIcon className="size-3.5 mr-1.5" />
                  Add More Photos ({5 - selectedFiles.length} remaining)
                </button>
              )}
            </div>
          ) : (
            <div className="w-full aspect-square rounded-2xl bg-gradient-to-br from-[#FFF5F0] via-[#FFF0E5] to-[#E8FAF8] flex flex-col items-center justify-center gap-3 border-2 border-dashed border-[#FF8C42]/30 hover:border-[#FF8C42]/50 transition-colors overflow-hidden relative">
              <button
                onClick={handlePhotoClick}
                className="flex flex-col items-center justify-center gap-3 cursor-pointer w-full h-full"
              >
                <div className="flex items-center justify-center size-16 rounded-full bg-gradient-to-br from-[#FF6B6B]/20 to-[#FF8C42]/20">
                  <Camera className="size-8 text-[#FF8C42]" strokeWidth={1.5} />
                </div>
                <p className="text-sm text-muted-foreground font-medium">Tap to add photos</p>
                <p className="text-xs text-muted-foreground/70">Share your travel moments</p>
              </button>
              <div className="flex flex-col items-center gap-2 pb-2">
                <div className="flex items-center gap-2 w-full px-6">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-[11px] text-muted-foreground uppercase">or</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <p className="text-xs text-[#FF8C42] font-medium">Post text only — no photos needed</p>
              </div>
            </div>
          )}
          <input
            id="post-photo-upload"
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            multiple
            onChange={handleFileChange}
            className="hidden"
            aria-label="Upload photos"
          />
        </div>

        {/* Author info */}
        <div className="flex items-center gap-3">
          <Avatar className="size-10">
            <AvatarImage
              src={currentUser?.avatar || undefined}
              alt={currentUser?.name || 'You'}
            />
            <AvatarFallback className="bg-gradient-to-br from-[#FF6B6B]/20 to-[#FF8C42]/20 text-[#FF8C42] text-sm font-semibold">
              {currentUser?.name?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {currentUser?.name || 'Anonymous'}
            </p>
            <p className="text-xs text-muted-foreground">
              @{currentUser?.username || 'user'}
            </p>
          </div>
        </div>

        {/* Caption */}
        <div className="space-y-2">
          <Label htmlFor="caption" className="text-sm font-medium text-muted-foreground">
            Caption
          </Label>
          <Textarea
            id="caption"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Share your travel experience..."
            className="min-h-[100px] resize-none border-border focus:border-[#FF8C42] focus:ring-[#FF8C42]/20 rounded-xl text-sm"
          />
        </div>

        {/* Location with city autocomplete */}
        <div className="space-y-2">
          <Label htmlFor="location" className="text-sm font-medium text-muted-foreground">
            Location
          </Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              id="location"
              value={location}
              onChange={(e) => {
                setLocation(e.target.value)
                setShowCitySuggestions(true)
              }}
              onFocus={() => setShowCitySuggestions(true)}
              onBlur={() => {
                // Delay to allow click on suggestion
                setTimeout(() => setShowCitySuggestions(false), 200)
              }}
              placeholder="Search for a city..."
              className="pl-9 border-border focus:border-[#FF8C42] focus:ring-[#FF8C42]/20 rounded-xl text-sm"
            />
            {/* City suggestions dropdown */}
            <AnimatePresence>
              {showCitySuggestions && citySuggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="absolute z-20 top-full mt-1 w-full bg-card rounded-xl border border-border shadow-lg overflow-hidden"
                >
                  {citySuggestions.map((city) => (
                    <button
                      key={city}
                      onMouseDown={() => selectCity(city)}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-foreground hover:bg-[#FF8C42]/5 transition-colors text-left"
                    >
                      <MapPin className="size-3.5 text-[#FF8C42] flex-shrink-0" />
                      <span>{city}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Coordinates preview */}
          {(latitude !== null && longitude !== null) && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="size-3" />
              <span>Lat: {latitude.toFixed(4)}, Lng: {longitude.toFixed(4)}</span>
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <Label htmlFor="tags" className="text-sm font-medium text-muted-foreground">
            Tags
          </Label>
          <div className="relative">
            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              id="tags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              onBlur={handleAddTag}
              placeholder="Add tags (press Enter)"
              className="pl-9 border-border focus:border-[#FF8C42] focus:ring-[#FF8C42]/20 rounded-xl text-sm"
            />
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="bg-[#FF8C42]/10 text-[#FF8C42] hover:bg-[#FF8C42]/20 cursor-pointer rounded-lg text-xs font-medium border-0"
                  onClick={() => handleRemoveTag(tag)}
                >
                  #{tag}
                  <span className="ml-1 text-[#FF8C42]/60">&times;</span>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Toggles */}
        <div className="space-y-4 pt-2">
          {/* Public/Private toggle */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              {isPublic ? (
                <Globe className="size-5 text-[#2EC4B6]" />
              ) : (
                <Lock className="size-5 text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-medium text-foreground">
                  {isPublic ? 'Public' : 'Private'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isPublic ? 'Anyone can see this post' : 'Only you can see this post'}
                </p>
              </div>
            </div>
            <Switch
              checked={isPublic}
              onCheckedChange={setIsPublic}
              className="data-[state=checked]:bg-[#2EC4B6]"
            />
          </div>

          {/* Memory toggle */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <Clock className="size-5 text-[#FFBA49]" />
              <div>
                <p className="text-sm font-medium text-foreground">Memory</p>
                <p className="text-xs text-muted-foreground">
                  Mark this as a special travel memory
                </p>
              </div>
            </div>
            <Switch
              checked={isMemory}
              onCheckedChange={setIsMemory}
              className="data-[state=checked]:bg-[#FFBA49]"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
