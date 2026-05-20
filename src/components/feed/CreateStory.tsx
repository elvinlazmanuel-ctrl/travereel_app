'use client'

import { useState, useRef } from 'react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Camera, ImagePlus, Type, Loader2, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from '@/hooks/use-toast'

const gradientStyles = [
  { background: 'linear-gradient(to bottom right, #2F5C9B, #5CA5CD)' },
  { background: 'linear-gradient(to bottom right, #5CA5CD, #E58BEA)' },
  { background: 'linear-gradient(to bottom right, #5CA5CD, #E58BEA)' },
  { background: 'linear-gradient(to bottom right, #2F5C9B, #E879A8)' },
  { background: 'linear-gradient(to bottom right, #5CA5CD, #4ECDC4)' },
  { background: 'linear-gradient(to bottom right, #E58BEA, #2F5C9B)' },
  { background: 'linear-gradient(to bottom right, #667eea, #764ba2)' },
  { background: 'linear-gradient(to bottom right, #f093fb, #f5576c)' },
]

export default function CreateStory() {
  const { currentUser, setCurrentView, addStory } = useAppStore()
  const [caption, setCaption] = useState('')
  const [selectedColor, setSelectedColor] = useState(0)
  const [isSharing, setIsSharing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [mode, setMode] = useState<'photo' | 'text'>('photo')
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleGoBack = () => {
    if (filePreview) URL.revokeObjectURL(filePreview)
    setCurrentView('feed')
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File too large. Maximum size is 10MB.')
      return
    }

    setError(null)
    if (filePreview) URL.revokeObjectURL(filePreview)
    setSelectedFile(file)
    setFilePreview(URL.createObjectURL(file))
    e.target.value = ''
  }

  const handleRemoveFile = () => {
    if (filePreview) URL.revokeObjectURL(filePreview)
    setSelectedFile(null)
    setFilePreview(null)
  }

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

  const handleShare = async () => {
    if (!currentUser) {
      setError('You must be logged in to create a story')
      return
    }

    setIsSharing(true)
    setError(null)

    try {
      let mediaUrl: string
      let mediaType: string

      if (mode === 'photo' && selectedFile) {
        // Upload the actual photo
        setIsUploading(true)
        mediaUrl = await uploadImage(selectedFile)
        setIsUploading(false)
        mediaType = 'image'
      } else {
        // Use gradient background for text stories or photo mode without a file
        // Store the actual gradient CSS in mediaUrl with a prefix to identify it
        const gradientCSS = gradientStyles[selectedColor].background
        mediaUrl = `gradient:${gradientCSS}`
        mediaType = mode === 'text' ? 'text' : 'image'
      }

      const response = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mediaUrl,
          mediaType,
          caption: caption || null,
          authorId: currentUser.id,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create story')
      }

      const data = await response.json()

      // Add the new story to the store
      addStory({
        ...data.story,
        author: {
          id: data.story.author.id,
          email: '',
          username: data.story.author.username,
          name: data.story.author.name,
          avatar: data.story.author.avatar,
          bio: null,
          isPrivate: false,
        },
        viewed: false,
      })

      toast({
        title: 'Story shared!',
        description: 'Your story has been posted and will last 24 hours.',
      })

      if (filePreview) URL.revokeObjectURL(filePreview)
      setCurrentView('feed')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      setError(message)
      toast({
        title: 'Failed to share story',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setIsSharing(false)
      setIsUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleGoBack}
          className="text-white hover:bg-white/10"
          aria-label="Go back"
        >
          <ArrowLeft className="size-5" />
        </Button>
        <h2 className="text-white font-semibold text-base">Create Story</h2>
        <Button
          variant="ghost"
          onClick={handleShare}
          disabled={isSharing}
          className="text-[#5CA5CD] hover:bg-white/10 font-semibold text-sm"
        >
          {isSharing ? (
            isUploading ? (
              <span className="flex items-center gap-1">
                <Loader2 className="size-4 animate-spin" />
                Uploading...
              </span>
            ) : (
              <Loader2 className="size-4 animate-spin" />
            )
          ) : 'Share'}
        </Button>
      </div>

      {/* Story Preview Area */}
      <div className="flex-1 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative w-full max-w-sm aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl"
        >
          {mode === 'photo' ? (
            filePreview ? (
              /* Actual uploaded photo preview */
              <div className="w-full h-full relative">
                <img
                  src={filePreview}
                  alt="Story preview"
                  className="w-full h-full object-cover"
                />
                {/* Remove photo button */}
                <button
                  onClick={handleRemoveFile}
                  className="absolute top-4 right-4 size-8 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors"
                  aria-label="Remove photo"
                >
                  <X className="size-4 text-white" />
                </button>
                {/* Caption overlay at bottom */}
                {caption && (
                  <div className="absolute bottom-16 left-0 right-0 px-6">
                    <p className="text-white text-xl font-bold text-center drop-shadow-lg leading-relaxed">
                      {caption}
                    </p>
                  </div>
                )}
                {/* User info overlay */}
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <div className="size-8 rounded-full bg-white/30 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {currentUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <span className="text-white text-sm font-medium drop-shadow">
                    {currentUser?.username || 'You'}
                  </span>
                </div>
              </div>
            ) : (
              /* Photo placeholder with gradient background */
              <div
                className="w-full h-full flex flex-col items-center justify-center relative"
                style={gradientStyles[selectedColor]}
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center cursor-pointer"
                  >
                    <div className="size-20 rounded-full bg-white/20 flex items-center justify-center mb-4">
                      <Camera className="size-10 text-white/80" />
                    </div>
                    <p className="text-white/80 text-sm font-medium">Tap to add photo</p>
                    <p className="text-white/50 text-xs mt-1">or choose a background color below</p>
                  </button>
                </div>

                {/* Caption overlay at bottom */}
                {caption && (
                  <div className="absolute bottom-16 left-0 right-0 px-6">
                    <p className="text-white text-xl font-bold text-center drop-shadow-lg leading-relaxed">
                      {caption}
                    </p>
                  </div>
                )}

                {/* User info overlay */}
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <div className="size-8 rounded-full bg-white/30 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {currentUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <span className="text-white text-sm font-medium drop-shadow">
                    {currentUser?.username || 'You'}
                  </span>
                </div>
              </div>
            )
          ) : (
            <div
              className="w-full h-full flex flex-col items-center justify-center relative"
              style={gradientStyles[selectedColor]}
            >
              {/* Text story */}
              {caption ? (
                <div className="px-8">
                  <p className="text-white text-2xl font-bold text-center drop-shadow-lg leading-relaxed">
                    {caption}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <Type className="size-12 text-white/60 mb-3" />
                  <p className="text-white/60 text-sm">Type your story below</p>
                </div>
              )}

              {/* User info overlay */}
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <div className="size-8 rounded-full bg-white/30 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {currentUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <span className="text-white text-sm font-medium drop-shadow">
                  {currentUser?.username || 'You'}
                </span>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileSelect}
        className="hidden"
        aria-label="Upload photo for story"
      />

      {/* Error message */}
      {error && (
        <div className="px-4 py-2">
          <p className="text-red-400 text-sm text-center">{error}</p>
        </div>
      )}

      {/* Upload progress indicator */}
      <AnimatePresence>
        {isUploading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-4 py-2"
          >
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="size-4 animate-spin text-[#5CA5CD]" />
              <p className="text-[#5CA5CD] text-sm">Uploading photo...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="px-4 py-4 space-y-4 bg-gradient-to-t from-black via-black/95 to-transparent">
        {/* Mode Toggle */}
        <div className="flex gap-2 justify-center">
          <Button
            variant={mode === 'photo' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setMode('photo')}
            className={`rounded-full px-5 ${
              mode === 'photo'
                ? 'bg-white text-black hover:bg-white/90'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            <ImagePlus className="size-4 mr-1.5" />
            Photo
          </Button>
          <Button
            variant={mode === 'text' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setMode('text')}
            className={`rounded-full px-5 ${
              mode === 'text'
                ? 'bg-white text-black hover:bg-white/90'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            <Type className="size-4 mr-1.5" />
            Text
          </Button>
        </div>

        {/* Color Picker - show only in text mode or photo mode without a file */}
        {(mode === 'text' || (mode === 'photo' && !selectedFile)) && (
          <div className="flex gap-2 justify-center">
            {gradientStyles.map((style, index) => (
              <button
                key={index}
                onClick={() => setSelectedColor(index)}
                className={`size-8 rounded-full transition-all ${
                  selectedColor === index
                    ? 'ring-2 ring-white ring-offset-2 ring-offset-black scale-110'
                    : 'opacity-60 hover:opacity-100'
                }`}
                style={style}
                aria-label={`Select background color ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* Upload button in photo mode without a file */}
        {mode === 'photo' && !selectedFile && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-full border-white/30 text-white hover:bg-white/10 hover:text-white"
            >
              <Camera className="size-4 mr-2" />
              Choose Photo
            </Button>
          </div>
        )}

        {/* Caption Input */}
        <div className="relative">
          <Textarea
            placeholder="Add a caption to your story..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="w-full bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-xl resize-none h-20 focus:border-[#5CA5CD]/50 focus:ring-[#5CA5CD]/20"
            maxLength={200}
          />
          <span className="absolute bottom-2 right-3 text-xs text-white/30">
            {caption.length}/200
          </span>
        </div>

        {/* Share Button */}
        <Button
          onClick={handleShare}
          disabled={isSharing}
          className="w-full h-12 bg-gradient-to-r from-[#2F5C9B] via-[#5CA5CD] to-[#E58BEA] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity border-0"
        >
          {isSharing ? (
            <>
              <Loader2 className="size-4 animate-spin mr-2" />
              {isUploading ? 'Uploading...' : 'Sharing...'}
            </>
          ) : (
            'Share Story'
          )}
        </Button>
      </div>
    </div>
  )
}
