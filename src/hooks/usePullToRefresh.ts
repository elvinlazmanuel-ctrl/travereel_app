'use client'

import { useCallback, useRef, useState } from 'react'

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>
  threshold?: number
  resistance?: number
}

interface UsePullToRefreshReturn {
  pullDistance: number
  isRefreshing: boolean
  isPulling: boolean
  containerRef: React.RefObject<HTMLDivElement | null>
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void
    onTouchMove: (e: React.TouchEvent) => void
    onTouchEnd: () => void
  }
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  resistance = 2.5,
}: UsePullToRefreshOptions): UsePullToRefreshReturn {
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isPulling, setIsPulling] = useState(false)

  const containerRef = useRef<HTMLDivElement | null>(null)
  const startY = useRef(0)
  const currentPull = useRef(0)

  const isAtTop = useCallback(() => {
    if (!containerRef.current) return true
    // Check the container's own scrollTop and also walk up to find the scrollable parent
    const el = containerRef.current
    if (el.scrollTop > 0) return false

    // Also check if the page/document is scrolled
    if (typeof window !== 'undefined' && window.scrollY > 0) return false

    return true
  }, [])

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (isRefreshing) return
      // Only start tracking if at the top
      if (!isAtTop()) return

      const touch = e.touches[0]
      startY.current = touch.clientY
      currentPull.current = 0
    },
    [isRefreshing, isAtTop]
  )

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (isRefreshing) return
      if (startY.current === 0) return

      const touch = e.touches[0]
      const diffY = touch.clientY - startY.current

      // Only care about downward pulls
      if (diffY <= 0) {
        setPullDistance(0)
        setIsPulling(false)
        currentPull.current = 0
        return
      }

      // Apply resistance so it gets harder to pull the further you go
      const resisted = diffY / resistance
      currentPull.current = resisted

      setPullDistance(resisted)
      setIsPulling(true)
    },
    [isRefreshing, resistance]
  )

  const onTouchEnd = useCallback(async () => {
    if (isRefreshing) return

    startY.current = 0

    if (currentPull.current >= threshold) {
      // Trigger refresh
      setIsRefreshing(true)
      setPullDistance(threshold) // Keep indicator at threshold while refreshing
      setIsPulling(false)

      try {
        await onRefresh()
      } finally {
        setIsRefreshing(false)
        setPullDistance(0)
      }
    } else {
      // Snap back
      setIsPulling(false)
      setPullDistance(0)
      currentPull.current = 0
    }
  }, [isRefreshing, threshold, onRefresh])

  return {
    pullDistance,
    isRefreshing,
    isPulling,
    containerRef,
    handlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
  }
}
