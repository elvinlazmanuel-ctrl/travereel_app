'use client'

import { useEffect, useState, useRef } from 'react'

/**
 * Accessibility hook for managing focus, keyboard navigation, and ARIA attributes
 */
export function useAccessibility() {
  const [focusMode, setFocusMode] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [highContrast, setHighContrast] = useState(false)

  useEffect(() => {
    // Detect reduced motion preference
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(motionQuery.matches)

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches)
    }

    motionQuery.addEventListener('change', handleMotionChange)

    // Detect high contrast preference
    const contrastQuery = window.matchMedia('(prefers-contrast: more)')
    setHighContrast(contrastQuery.matches)

    const handleContrastChange = (e: MediaQueryListEvent) => {
      setHighContrast(e.matches)
    }

    contrastQuery.addEventListener('change', handleContrastChange)

    return () => {
      motionQuery.removeEventListener('change', handleMotionChange)
      contrastQuery.removeEventListener('change', handleContrastChange)
    }
  }, [])

  // Enable focus mode when Tab key is pressed
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setFocusMode(true)
        document.body.classList.add('focus-visible')
      }
    }

    const handleMouseDown = () => {
      setFocusMode(false)
      document.body.classList.remove('focus-visible')
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleMouseDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleMouseDown)
    }
  }, [])

  return {
    focusMode,
    reducedMotion,
    highContrast,
  }
}

/**
 * Hook for managing focus trap in modals/dialogs
 */
export function useFocusTrap(ref: React.RefObject<HTMLElement | null>, isActive: boolean) {
  useEffect(() => {
    if (!isActive || !ref.current) return

    const element = ref.current
    const focusableElements = element.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    // Focus first element when trap activates
    firstElement?.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      // If Shift+Tab on first element, go to last
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault()
        lastElement?.focus()
      }
      // If Tab on last element, go to first
      else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault()
        firstElement?.focus()
      }
    }

    element.addEventListener('keydown', handleKeyDown)

    return () => {
      element.removeEventListener('keydown', handleKeyDown)
    }
  }, [isActive, ref])
}

/**
 * Hook for live region announcements (screen reader friendly)
 */
export function useLiveRegion() {
  const [message, setMessage] = useState('')

  const announce = (newMessage: string, priority: 'polite' | 'assertive' = 'polite') => {
    setMessage('')
    // Small delay to ensure screen reader picks up the change
    setTimeout(() => {
      setMessage(newMessage)
    }, 100)
  }

  return { announce, message }
}

/**
 * Hook for skip navigation link
 */
export function useSkipNavigation() {
  const skipToContent = () => {
    const mainContent = document.getElementById('main-content')
    if (mainContent) {
      mainContent.focus()
      mainContent.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return { skipToContent }
}
