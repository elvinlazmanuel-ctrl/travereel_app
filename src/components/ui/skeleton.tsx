'use client'

import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  variant?: 'rect' | 'circle' | 'text'
  animation?: 'pulse' | 'wave' | 'none'
}

/**
 * Reusable skeleton loading component
 * Provides visual placeholder during data loading
 */
export function Skeleton({ className, variant = 'rect', animation = 'pulse' }: SkeletonProps) {
  const baseClasses = 'bg-gray-200 dark:bg-gray-700'
  
  const variantClasses = {
    rect: 'rounded-lg',
    circle: 'rounded-full',
    text: 'rounded h-4',
  }

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:animate-[wave_1.5s_ease-in-out_infinite]',
    none: '',
  }

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
      aria-hidden="true"
      role="status"
      aria-label="Loading"
    />
  )
}

// Post Card Skeleton
export function PostCardSkeleton() {
  return (
    <div className="bg-card border-b border-border pb-4">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <Skeleton className="size-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>

      {/* Image */}
      <Skeleton className="w-full aspect-square" />

      {/* Actions */}
      <div className="flex items-center gap-4 px-4 py-2.5">
        <Skeleton className="size-6" />
        <Skeleton className="size-6" />
        <Skeleton className="size-6" />
        <div className="flex-1" />
        <Skeleton className="size-6" />
      </div>

      {/* Caption */}
      <div className="px-4 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  )
}

// Profile Card Skeleton
export function ProfileCardSkeleton() {
  return (
    <div className="p-4 space-y-4">
      {/* Avatar and Name */}
      <div className="flex flex-col items-center space-y-3">
        <Skeleton className="size-24 rounded-full" />
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-48" />
      </div>

      {/* Stats */}
      <div className="flex justify-center gap-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="text-center space-y-1">
            <Skeleton className="h-6 w-12 mx-auto" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-1">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="aspect-square" />
        ))}
      </div>
    </div>
  )
}

// Itinerary Card Skeleton
export function ItineraryCardSkeleton() {
  return (
    <div className="p-4 rounded-xl border space-y-3">
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="size-8 rounded-lg" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        ))}
      </div>

      <Skeleton className="h-10 w-full" />
    </div>
  )
}

// Feed Skeleton (multiple posts)
export function FeedSkeleton() {
  return (
    <div className="space-y-0">
      {[1, 2, 3].map((i) => (
        <PostCardSkeleton key={i} />
      ))}
    </div>
  )
}

// Stories Skeleton
export function StoryBarSkeleton() {
  return (
    <div className="flex gap-3 px-4 py-3 overflow-hidden">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex flex-col items-center gap-1">
          <Skeleton className="size-16 rounded-full" />
          <Skeleton className="h-3 w-12" />
        </div>
      ))}
    </div>
  )
}
