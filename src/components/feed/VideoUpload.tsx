'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Video, Upload, X, Play, Loader2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'

interface VideoUploadProps {
  onUpload: (videoUrl: string, thumbnailUrl: string) => void
  onCancel: () => void
  maxDuration?: number // in seconds
  maxSize?: number // in MB
}

export function VideoUpload({ onUpload, onCancel, maxDuration = 300, maxSize = 100 }: VideoUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast.error('Please select a valid video file')
      return
    }

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`Video must be less than ${maxSize}MB`)
      return
    }

    setSelectedFile(file)
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)

    // Check video duration
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.onloadedmetadata = () => {
      if (video.duration > maxDuration) {
        toast.error(`Video must be less than ${Math.floor(maxDuration / 60)} minutes`)
        setSelectedFile(null)
        setPreviewUrl(null)
        URL.revokeObjectURL(url)
      }
    }
    video.src = url
  }, [maxDuration, maxSize])

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('video', selectedFile)

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      // TODO: Replace with actual upload to cloud storage
      // Example with Supabase Storage:
      // const { data, error } = await supabase.storage
      //   .from('videos')
      //   .upload(`${Date.now()}-${selectedFile.name}`, selectedFile, {
      //     cacheControl: '3600',
      //     upsert: false
      //   })
      // 
      // if (error) throw error
      // 
      // const videoUrl = supabase.storage.from('videos').getPublicUrl(data.path).publicURL
      
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 2000))

      clearInterval(progressInterval)
      setUploadProgress(100)
      setIsComplete(true)

      // Placeholder URL - replace with actual uploaded URL
      const videoUrl = URL.createObjectURL(selectedFile)
      const thumbnailUrl = '' // TODO: Generate thumbnail

      setTimeout(() => {
        onUpload(videoUrl, thumbnailUrl)
      }, 500)

    } catch (error) {
      console.error('Error uploading video:', error)
      toast.error('Failed to upload video')
      setIsUploading(false)
      setUploadProgress(0)
    }
  }, [selectedFile, onUpload])

  const handleCancel = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setSelectedFile(null)
    setPreviewUrl(null)
    setIsUploading(false)
    setUploadProgress(0)
    setIsComplete(false)
    onCancel()
  }, [previewUrl, onCancel])

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(0)} KB`
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="flex flex-col gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload State */}
      <AnimatePresence mode="wait">
        {!selectedFile ? (
          <motion.div
            key="select"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-3 py-8"
          >
            <div className="size-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Video className="size-8 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold mb-1">Upload Video</p>
              <p className="text-xs text-gray-500">
                Max {Math.floor(maxDuration / 60)} min, {maxSize}MB
              </p>
            </div>
            <Button onClick={() => fileInputRef.current?.click()}>
              <Upload className="size-4 mr-2" />
              Select Video
            </Button>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              Cancel
            </Button>
          </motion.div>
        ) : isComplete ? (
          <motion.div
            key="complete"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-3 py-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="size-16 bg-green-500 rounded-full flex items-center justify-center"
            >
              <Check className="size-8 text-white" />
            </motion.div>
            <p className="text-sm font-semibold text-green-600">Upload Complete!</p>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-3"
          >
            {/* Video Preview */}
            {previewUrl && (
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  src={previewUrl}
                  controls
                  className="w-full h-full"
                />
              </div>
            )}

            {/* File Info */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
              </div>
              {!isUploading && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCancel}
                  className="size-8"
                >
                  <X className="size-4" />
                </Button>
              )}
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-2">
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-xs text-center text-gray-500">
                  Uploading... {uploadProgress}%
                </p>
              </div>
            )}

            {/* Action Buttons */}
            {!isUploading && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpload}
                  className="flex-1 bg-[#2F5C9B] hover:bg-[#2F5C9B]/90"
                >
                  <Upload className="size-4 mr-2" />
                  Upload
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
