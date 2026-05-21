'use client'

import Image from 'next/image'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface OptimizedImageProps {
  src: string
  alt: string
  className?: string
  width?: number
  height?: number
  fill?: boolean
  priority?: boolean
  sizes?: string
  rounded?: boolean
  objectFit?: 'cover' | 'contain' | 'fill' | 'none'
  onError?: () => void
}

/**
 * Optimized image component with lazy loading, blur effect, and error handling
 * Replaces standard <img> tags for better performance
 */
export function OptimizedImage({
  src,
  alt,
  className,
  width,
  height,
  fill = false,
  priority = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  rounded = false,
  objectFit = 'cover',
  onError,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  // Handle Cloudinary images
  const isCloudinary = src.includes('cloudinary.com')
  const isExternal = src.startsWith('http')

  // For external images, we need to use unoptimized or add domains to next.config
  if (isExternal && !isCloudinary) {
    return (
      <img
        src={src}
        alt={alt}
        className={cn(
          className,
          rounded && 'rounded-lg',
          'transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100'
        )}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setHasError(true)
          onError?.()
        }}
      />
    )
  }

  if (hasError) {
    return (
      <div
        className={cn(
          'bg-gray-200 dark:bg-gray-700 flex items-center justify-center',
          rounded && 'rounded-lg',
          className
        )}
      >
        <span className="text-gray-400 text-sm">Failed to load image</span>
      </div>
    )
  }

  return (
    <div className={cn('relative overflow-hidden', rounded && 'rounded-lg', className)}>
      {/* Placeholder while loading */}
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 animate-pulse" />
      )}
      
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        fill={fill}
        priority={priority}
        sizes={sizes}
        className={cn(
          'transition-opacity duration-300',
          objectFit === 'cover' && 'object-cover',
          objectFit === 'contain' && 'object-contain',
          isLoading ? 'opacity-0' : 'opacity-100'
        )}
        style={{ objectFit }}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setHasError(true)
          onError?.()
        }}
      />
    </div>
  )
}

/**
 * Avatar image component with optimization
 */
export function OptimizedAvatar({
  src,
  alt,
  size = 40,
  className,
}: {
  src: string
  alt: string
  size?: number
  className?: string
}) {
  if (!src) {
    return (
      <div
        className={cn(
          'bg-gradient-to-br from-[#2F5C9B] to-[#5CA5CD] flex items-center justify-center text-white font-semibold',
          className
        )}
        style={{ width: size, height: size, borderRadius: '50%' }}
      >
        {alt.charAt(0).toUpperCase()}
      </div>
    )
  }

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      rounded
      className={className}
      objectFit="cover"
    />
  )
}
