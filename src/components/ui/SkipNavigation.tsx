'use client'

import { useSkipNavigation } from '@/hooks/useAccessibility'

/**
 * Skip to main content link for keyboard users
 * Appears when user presses Tab key at top of page
 */
export function SkipNavigation() {
  const { skipToContent } = useSkipNavigation()

  return (
    <a
      href="#main-content"
      onClick={(e) => {
        e.preventDefault()
        skipToContent()
      }}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-[#2F5C9B] focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5CA5CD] focus:ring-offset-2 transition-all"
    >
      Skip to main content
    </a>
  )
}
