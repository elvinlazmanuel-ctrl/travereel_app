/**
 * Analytics Tracking System
 * 
 * Supports:
 * - Plausible Analytics (privacy-focused)
 * - Google Analytics 4
 * - Custom event tracking
 * - User behavior analytics
 * - Conversion tracking
 * 
 * Usage:
 * 1. Add environment variables
 * 2. Initialize in layout.tsx
 * 3. Track events throughout app
 */

export interface AnalyticsConfig {
  plausible: {
    enabled: boolean
    domain: string
    trackingDomain: string
  }
  googleAnalytics: {
    enabled: boolean
    measurementId: string
  }
  custom: {
    enabled: boolean
    endpoint: string
  }
}

export interface AnalyticsEvent {
  name: string
  category: string
  label?: string
  value?: number
  metadata?: Record<string, unknown>
}

export interface PageViewEvent {
  path: string
  title: string
  referrer?: string
}

// Analytics configuration from environment
export const ANALYTICS_CONFIG: AnalyticsConfig = {
  plausible: {
    enabled: !!process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN,
    domain: process.env.NEXT_PUBLIC_APP_URL || 'travereel.com',
    trackingDomain: process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN || '',
  },
  googleAnalytics: {
    enabled: !!process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
    measurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '',
  },
  custom: {
    enabled: !!process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT,
    endpoint: process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT || '',
  },
}

/**
 * Initialize analytics scripts
 * Call this in your layout.tsx or app initialization
 */
export function initializeAnalytics(): void {
  if (typeof window === 'undefined') return

  // Initialize Plausible
  if (ANALYTICS_CONFIG.plausible.enabled) {
    loadPlausibleScript()
  }

  // Initialize Google Analytics
  if (ANALYTICS_CONFIG.googleAnalytics.enabled) {
    loadGoogleAnalyticsScript()
  }
}

/**
 * Load Plausible analytics script
 */
function loadPlausibleScript(): void {
  const script = document.createElement('script')
  script.setAttribute('defer', 'true')
  script.setAttribute(
    'data-domain',
    ANALYTICS_CONFIG.plausible.domain
  )
  script.src = `${ANALYTICS_CONFIG.plausible.trackingDomain}/js/script.js`
  
  document.head.appendChild(script)
  
  // Load extended features (outbound links, file downloads, etc.)
  const extendedScript = document.createElement('script')
  extendedScript.setAttribute('defer', 'true')
  extendedScript.src = `${ANALYTICS_CONFIG.plausible.trackingDomain}/js/script.outbound-links.js`
  extendedScript.setAttribute('data-domain', ANALYTICS_CONFIG.plausible.domain)
  
  document.head.appendChild(extendedScript)
}

/**
 * Load Google Analytics script
 */
function loadGoogleAnalyticsScript(): void {
  // Google Tag Manager
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${ANALYTICS_CONFIG.googleAnalytics.measurementId}`
  
  document.head.appendChild(script)
  
  // Initialize gtag
  const initScript = document.createElement('script')
  initScript.innerHTML = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${ANALYTICS_CONFIG.googleAnalytics.measurementId}', {
      send_page_view: true
    });
  `
  
  document.head.appendChild(initScript)
}

/**
 * Track page view
 */
export function trackPageView(pageView: PageViewEvent): void {
  if (typeof window === 'undefined') return

  // Plausible
  if (ANALYTICS_CONFIG.plausible.enabled && window.plausible) {
    window.plausible('pageview', {
      u: window.location.href,
      d: window.location.hostname,
      r: document.referrer || pageView.referrer,
      t: pageView.title,
    })
  }

  // Google Analytics
  if (ANALYTICS_CONFIG.googleAnalytics.enabled && window.gtag) {
    window.gtag('config', ANALYTICS_CONFIG.googleAnalytics.measurementId, {
      page_path: pageView.path,
      page_title: pageView.title,
    })
  }

  // Custom analytics
  if (ANALYTICS_CONFIG.custom.enabled) {
    sendCustomEvent('page_view', pageView)
  }
}

/**
 * Track custom event
 */
export function trackEvent(event: AnalyticsEvent): void {
  if (typeof window === 'undefined') return

  // Plausible
  if (ANALYTICS_CONFIG.plausible.enabled && window.plausible) {
    window.plausible(event.name, {
      props: {
        category: event.category,
        label: event.label,
        value: event.value,
        ...event.metadata,
      },
    })
  }

  // Google Analytics
  if (ANALYTICS_CONFIG.googleAnalytics.enabled && window.gtag) {
    window.gtag('event', event.name, {
      event_category: event.category,
      event_label: event.label,
      value: event.value,
      ...event.metadata,
    })
  }

  // Custom analytics
  if (ANALYTICS_CONFIG.custom.enabled) {
    sendCustomEvent(event.name, event)
  }
}

/**
 * Track user sign up
 */
export function trackSignUp(method: string): void {
  trackEvent({
    name: 'sign_up',
    category: 'authentication',
    label: method,
    metadata: { method },
  })
}

/**
 * Track user login
 */
export function trackLogin(method: string): void {
  trackEvent({
    name: 'login',
    category: 'authentication',
    label: method,
    metadata: { method },
  })
}

/**
 * Track itinerary creation
 */
export function trackItineraryCreated(
  destination: string,
  days: number,
  budget: number,
  isAI: boolean = false
): void {
  trackEvent({
    name: 'itinerary_created',
    category: 'itinerary',
    label: destination,
    value: budget,
    metadata: {
      destination,
      days,
      budget,
      isAI,
      currency: 'USD',
    },
  })
}

/**
 * Track AI generation
 */
export function trackAIGeneration(
  type: string,
  duration: number,
  success: boolean
): void {
  trackEvent({
    name: 'ai_generation',
    category: 'ai',
    label: type,
    value: duration,
    metadata: {
      type,
      duration_ms: duration,
      success,
    },
  })
}

/**
 * Track social interaction
 */
export function trackSocialInteraction(
  action: 'like' | 'comment' | 'share' | 'follow' | 'friend_request',
  targetType: string,
  targetId: string
): void {
  trackEvent({
    name: `social_${action}`,
    category: 'social',
    label: targetType,
    metadata: {
      action,
      targetType,
      targetId,
    },
  })
}

/**
 * Track search
 */
export function trackSearch(query: string, resultCount: number): void {
  trackEvent({
    name: 'search',
    category: 'search',
    label: query,
    value: resultCount,
    metadata: {
      query,
      result_count: resultCount,
    },
  })
}

/**
 * Track subscription events
 */
export function trackSubscription(
  action: 'start_trial' | 'upgrade' | 'downgrade' | 'cancel' | 'resubscribe',
  tier: string,
  revenue?: number
): void {
  trackEvent({
    name: `subscription_${action}`,
    category: 'monetization',
    label: tier,
    value: revenue,
    metadata: {
      action,
      tier,
      revenue,
      currency: 'USD',
    },
  })
}

/**
 * Track affiliate click
 */
export function trackAffiliateClick(
  provider: string,
  type: string,
  itineraryId: string
): void {
  trackEvent({
    name: 'affiliate_click',
    category: 'monetization',
    label: provider,
    metadata: {
      provider,
      type,
      itineraryId,
    },
  })
}

/**
 * Track error
 */
export function trackError(
  errorType: string,
  errorMessage: string,
  context?: Record<string, unknown>
): void {
  trackEvent({
    name: 'error',
    category: 'error',
    label: errorType,
    metadata: {
      error_type: errorType,
      error_message: errorMessage,
      ...context,
    },
  })
}

/**
 * Track performance metrics
 */
export function trackPerformance(
  metric: string,
  value: number,
  metadata?: Record<string, unknown>
): void {
  trackEvent({
    name: 'performance',
    category: 'performance',
    label: metric,
    value,
    metadata: {
      metric,
      value,
      ...metadata,
    },
  })
}

/**
 * Send event to custom analytics endpoint
 */
async function sendCustomEvent(eventName: string, data: any): Promise<void> {
  try {
    await fetch(ANALYTICS_CONFIG.custom.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event: eventName,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: window.navigator.userAgent,
        ...data,
      }),
      keepalive: true,
    })
  } catch (error) {
    console.error('Failed to send custom analytics event:', error)
  }
}

/**
 * Track outbound link click
 */
export function trackOutboundLink(url: string, label?: string): void {
  trackEvent({
    name: 'outbound_link',
    category: 'navigation',
    label: label || url,
    metadata: { url },
  })
}

/**
 * Track file download
 */
export function trackFileDownload(fileName: string, fileType: string): void {
  trackEvent({
    name: 'file_download',
    category: 'engagement',
    label: fileName,
    metadata: {
      file_name: fileName,
      file_type: fileType,
    },
  })
}

/**
 * Track video engagement
 */
export function trackVideoEngagement(
  action: 'play' | 'pause' | 'complete' | 'progress',
  videoId: string,
  progress?: number
): void {
  trackEvent({
    name: `video_${action}`,
    category: 'engagement',
    label: videoId,
    value: progress,
    metadata: {
      videoId,
      action,
      progress,
    },
  })
}

/**
 * Track form submission
 */
export function trackFormSubmission(
  formName: string,
  success: boolean,
  errors?: string[]
): void {
  trackEvent({
    name: 'form_submission',
    category: 'engagement',
    label: formName,
    metadata: {
      form_name: formName,
      success,
      errors,
    },
  })
}

// Type declarations for global analytics functions
declare global {
  interface Window {
    plausible?: (...args: any[]) => void
    gtag?: (...args: any[]) => void
    dataLayer?: any[]
  }
}
