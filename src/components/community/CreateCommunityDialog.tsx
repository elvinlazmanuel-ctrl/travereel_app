'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, ImageIcon, Loader2, Sparkles, Camera, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAppStore, type CommunityType } from '@/lib/store'
import { toast } from '@/hooks/use-toast'

const categories = [
  { value: 'travel-style', label: 'Travel Style' },
  { value: 'budget', label: 'Budget' },
  { value: 'adventure', label: 'Adventure' },
  { value: 'food', label: 'Food' },
  { value: 'photography', label: 'Photography' },
  { value: 'remote-work', label: 'Remote Work' },
]

interface CreateCommunityDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function CreateCommunityDialog({ open, onOpenChange }: CreateCommunityDialogProps) {
  const { currentUser, addCommunity, joinCommunity, setSelectedCommunity, setCurrentView } = useAppStore()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resetForm = () => {
    setName('')
    setDescription('')
    setCategory('')
    if (coverPreview) URL.revokeObjectURL(coverPreview)
    setCoverFile(null)
    setCoverPreview(null)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Only JPEG, PNG, GIF, and WebP images are allowed.',
        variant: 'destructive',
      })
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Maximum file size is 10MB.',
        variant: 'destructive',
      })
      return
    }

    if (coverPreview) URL.revokeObjectURL(coverPreview)
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
    e.target.value = ''
  }

  const handleRemoveCover = () => {
    if (coverPreview) URL.revokeObjectURL(coverPreview)
    setCoverFile(null)
    setCoverPreview(null)
  }

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('userId', currentUser!.id || 'anonymous')

    // Get auth token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null

    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
      body: formData,
    })

    if (res.ok) {
      const data = await res.json()
      return data.url
    }
    throw new Error('Upload failed')
  }

  const handleCreate = async () => {
    if (!name.trim()) return

    setIsCreating(true)
    try {
      // Upload cover image if selected
      let imageUrl: string | null = null
      if (coverFile) {
        setIsUploading(true)
        imageUrl = await uploadImage(coverFile)
        setIsUploading(false)
      }

      const res = await fetch('/api/communities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          category: category || undefined,
          ...(imageUrl && { image: imageUrl }),
          authorId: currentUser?.id || 'anonymous',
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create community')
      }

      const data = await res.json()
      const newCommunity: CommunityType = {
        id: data.community.id,
        name: data.community.name,
        description: data.community.description,
        image: data.community.image,
        members: data.community.members,
        category: data.community.category,
      }

      // Add to store
      addCommunity(newCommunity)
      joinCommunity(newCommunity.id)

      // Show success toast
      toast({
        title: 'Community Created!',
        description: `${newCommunity.name} is now live. Share it with fellow travelers!`,
      })

      // Close dialog and navigate to detail
      onOpenChange(false)
      resetForm()
      setSelectedCommunity(newCommunity)
      setCurrentView('community-detail')
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create community',
        variant: 'destructive',
      })
    } finally {
      setIsCreating(false)
      setIsUploading(false)
    }
  }

  const isValid = name.trim().length >= 2

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden">
        {/* Header gradient */}
        <div className="bg-gradient-to-r from-[#2EC4B6] to-[#2EC4B6]/70 px-6 pt-6 pb-4">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Sparkles className="size-5" />
              Create Community
            </DialogTitle>
            <DialogDescription className="text-white/80">
              Build a space for travelers to connect and share experiences.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Form */}
        <div className="px-6 py-4 space-y-4">
          {/* Cover Image Upload */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-muted-foreground">Cover Image</Label>
            <AnimatePresence>
              {coverPreview ? (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden rounded-xl"
                >
                  <div className="relative h-32 rounded-xl overflow-hidden group">
                    <img
                      src={coverPreview}
                      alt="Community cover preview"
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
                    className="w-full h-24 rounded-xl border-2 border-dashed border-border hover:border-[#2EC4B6] transition-colors flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-muted/30"
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

          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="community-name" className="text-sm font-medium text-muted-foreground">
              Community Name <span className="text-[#FF6B6B]">*</span>
            </Label>
            <Input
              id="community-name"
              placeholder="e.g. Digital Nomads Asia"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 rounded-xl border-border focus:border-[#2EC4B6] focus:ring-[#2EC4B6]/20"
              maxLength={50}
            />
            <p className="text-[11px] text-muted-foreground">{name.length}/50 characters</p>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="community-desc" className="text-sm font-medium text-muted-foreground">
              Description
            </Label>
            <Textarea
              id="community-desc"
              placeholder="What's your community about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px] rounded-xl border-border focus:border-[#2EC4B6] focus:ring-[#2EC4B6]/20 resize-none"
              maxLength={200}
            />
            <p className="text-[11px] text-muted-foreground">{description.length}/200 characters</p>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-muted-foreground">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full h-10 rounded-xl border-border">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 pb-6 pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-10 rounded-xl border-border"
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!isValid || isCreating}
            className="h-10 rounded-xl bg-gradient-to-r from-[#2EC4B6] to-[#2EC4B6]/80 hover:from-[#2EC4B6]/90 hover:to-[#2EC4B6]/70 text-white shadow-sm disabled:opacity-50 min-w-[120px]"
          >
            {isCreating ? (
              <>
                <Loader2 className="size-4 mr-1.5 animate-spin" />
                {isUploading ? 'Uploading...' : 'Creating...'}
              </>
            ) : (
              <>
                <Plus className="size-4 mr-1.5" />
                Create
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
