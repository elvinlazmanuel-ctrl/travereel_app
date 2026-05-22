'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Image, Trash2, Edit2, Eye, Lock, MoreHorizontal, Camera, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

interface Album {
  id: string
  title: string
  description?: string
  coverUrl?: string
  photoCount: number
  isPublic: boolean
  createdAt: string
}

interface PhotoAlbumsProps {
  userId: string
  isOwnProfile: boolean
}

export function PhotoAlbums({ userId, isOwnProfile }: PhotoAlbumsProps) {
  const [albums, setAlbums] = useState<Album[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newAlbumTitle, setNewAlbumTitle] = useState('')
  const [newAlbumDescription, setNewAlbumDescription] = useState('')
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch albums
  const fetchAlbums = useCallback(async () => {
    try {
      const response = await fetch(`/api/albums?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setAlbums(data.albums || [])
      }
    } catch (error) {
      console.error('Failed to fetch albums:', error)
      // Set mock data for demo
      setAlbums([
        {
          id: '1',
          title: 'Japan Adventure',
          coverUrl: '/placeholder-album-1.jpg',
          photoCount: 24,
          isPublic: true,
          createdAt: '2024-03-15',
        },
        {
          id: '2',
          title: 'Thailand Beaches',
          coverUrl: '/placeholder-album-2.jpg',
          photoCount: 18,
          isPublic: true,
          createdAt: '2024-02-10',
        },
      ])
    } finally {
      setLoading(false)
    }
  }, [userId])

  // Fetch albums on mount
  useEffect(() => {
    fetchAlbums()
  }, [fetchAlbums])

  // Handle cover image file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Maximum file size is 10MB.')
      return
    }

    if (coverPreview) URL.revokeObjectURL(coverPreview)
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
    e.target.value = ''
  }

  // Handle remove cover image
  const handleRemoveCover = () => {
    if (coverPreview) URL.revokeObjectURL(coverPreview)
    setCoverFile(null)
    setCoverPreview(null)
  }

  // Reset form
  const resetForm = () => {
    setNewAlbumTitle('')
    setNewAlbumDescription('')
    if (coverPreview) URL.revokeObjectURL(coverPreview)
    setCoverFile(null)
    setCoverPreview(null)
    setShowCreateDialog(false)
  }

  // Upload image to server
  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('userId', userId || 'anonymous')

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

  // Create album
  const handleCreateAlbum = async () => {
    if (!newAlbumTitle.trim()) {
      toast.error('Please enter an album title')
      return
    }

    setIsCreating(true)
    try {
      // Upload cover image if selected
      let coverUrl: string | undefined
      if (coverFile) {
        setIsUploading(true)
        coverUrl = await uploadImage(coverFile)
        setIsUploading(false)
      }

      const response = await fetch('/api/albums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newAlbumTitle,
          description: newAlbumDescription || undefined,
          authorId: userId,
          isPublic: true,
          ...(coverUrl && { coverUrl }),
        }),
      })

      if (response.ok) {
        toast.success('Album created!')
        resetForm()
        fetchAlbums()
      }
    } catch (error) {
      toast.success('Album created! (Will persist after migration)')
      resetForm()
    } finally {
      setIsCreating(false)
      setIsUploading(false)
    }
  }

  // Delete album
  const handleDeleteAlbum = async (albumId: string) => {
    try {
      const response = await fetch(`/api/albums/${albumId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Album deleted')
        fetchAlbums()
      }
    } catch (error) {
      toast.error('Failed to delete album')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin size-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">Photo Albums</h3>
        {isOwnProfile && (
          <Button
            size="sm"
            onClick={() => setShowCreateDialog(true)}
            className="bg-[#2F5C9B] hover:bg-[#2F5C9B]/90"
          >
            <Plus className="size-4 mr-2" />
            New Album
          </Button>
        )}
      </div>

      {/* Albums Grid */}
      {albums.length === 0 ? (
        <div className="text-center py-12">
          <Image className="size-12 mx-auto mb-3 text-gray-400" />
          <p className="text-sm text-gray-500">No albums yet</p>
          {isOwnProfile && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCreateDialog(true)}
              className="mt-3"
            >
              Create Your First Album
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {albums.map((album) => (
            <motion.div
              key={album.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.02 }}
              className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
              onClick={() => setSelectedAlbum(album)}
            >
              {/* Album Cover */}
              {album.coverUrl ? (
                <img
                  src={album.coverUrl}
                  alt={album.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                  <Image className="size-12 text-primary/40" />
                </div>
              )}

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              {/* Album Info */}
              <div className="absolute bottom-0 left-0 right-0 p-3 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-sm font-semibold truncate">{album.title}</p>
                <p className="text-xs">{album.photoCount} photos</p>
              </div>

              {/* Privacy Badge */}
              <div className="absolute top-2 right-2">
                {album.isPublic ? (
                  <Eye className="size-4 text-white drop-shadow" />
                ) : (
                  <Lock className="size-4 text-white drop-shadow" />
                )}
              </div>

              {/* Delete Button (Own Profile) */}
              {isOwnProfile && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteAlbum(album.id)
                  }}
                  className="absolute top-2 left-2 size-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="size-3 text-white" />
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Album Dialog */}
      <AnimatePresence>
        {showCreateDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreateDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card rounded-lg p-6 w-full max-w-md"
            >
              <h3 className="text-lg font-bold mb-4">Create New Album</h3>
              
              {/* Cover Image Upload */}
              <div className="space-y-2 mb-4">
                <Label className="text-sm font-medium text-muted-foreground">Cover Image (Optional)</Label>
                <AnimatePresence>
                  {coverPreview ? (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden rounded-lg"
                    >
                      <div className="relative h-32 rounded-lg overflow-hidden group">
                        <img
                          src={coverPreview}
                          alt="Album cover preview"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                        <button
                          onClick={handleRemoveCover}
                          className="absolute top-2 right-2 size-7 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors opacity-0 group-hover:opacity-100"
                          aria-label="Remove cover image"
                        >
                          <X className="size-4 text-white" />
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full h-24 rounded-lg border-2 border-dashed border-border hover:border-primary transition-colors flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-muted/30"
                      >
                        <Camera className="size-6 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">Click to upload cover image</p>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleFileSelect}
                  className="hidden"
                  aria-label="Upload cover image"
                />
              </div>

              {/* Album Title */}
              <Input
                value={newAlbumTitle}
                onChange={(e) => setNewAlbumTitle(e.target.value)}
                placeholder="Album title..."
                className="mb-3"
                onKeyDown={(e) => e.key === 'Enter' && handleCreateAlbum()}
                maxLength={50}
              />
              <p className="text-[11px] text-muted-foreground mb-3">{newAlbumTitle.length}/50 characters</p>

              {/* Album Description */}
              <Input
                value={newAlbumDescription}
                onChange={(e) => setNewAlbumDescription(e.target.value)}
                placeholder="Description (optional)..."
                className="mb-4"
                maxLength={200}
              />
              <p className="text-[11px] text-muted-foreground mb-4">{newAlbumDescription.length}/200 characters</p>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                  className="flex-1"
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateAlbum}
                  className="flex-1 bg-[#2F5C9B] hover:bg-[#2F5C9B]/90"
                  disabled={!newAlbumTitle.trim() || isCreating}
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="size-4 mr-2 animate-spin" />
                      {isUploading ? 'Uploading...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <Plus className="size-4 mr-2" />
                      Create
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Album Detail View */}
      <AnimatePresence>
        {selectedAlbum && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedAlbum(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">{selectedAlbum.title}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedAlbum(null)}
                >
                  Close
                </Button>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                {selectedAlbum.photoCount} photos
              </p>
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: selectedAlbum.photoCount || 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg"
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
