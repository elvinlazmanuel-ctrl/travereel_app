/**
 * Premium Subscription Tier System
 * 
 * Tiers:
 * - Free: Basic features
 * - Explorer ($4.99/mo): Enhanced features
 * - Traveler ($9.99/mo): Premium features
 * - Nomad ($19.99/mo): All features + priority support
 * 
 * Features by tier:
 * - Unlimited itineraries
 * - Advanced analytics
 * - Priority AI generation
 * - Custom themes
 * - Export capabilities
 * - Ad-free experience
 */

export type SubscriptionTier = 'free' | 'explorer' | 'traveler' | 'nomad'

export interface SubscriptionPlan {
  tier: SubscriptionTier
  name: string
  price: number // Monthly price in USD
  yearlyPrice: number // Yearly price (with discount)
  features: string[]
  limits: {
    maxItineraries: number
    maxPostsPerDay: number
    maxStorageGB: number
    aiGenerationsPerDay: number
    maxCollaborators: number
    analyticsHistory: number // Days
  }
  perks: {
    priorityAIGeneration: boolean
    customThemes: boolean
    exportCapabilities: boolean
    adFree: boolean
    advancedAnalytics: boolean
    prioritySupport: boolean
    earlyAccess: boolean
    badgeDisplay: boolean
  }
  stripePriceId: string
  stripePriceIdYearly: string
}

export interface UserSubscription {
  userId: string
  tier: SubscriptionTier
  status: 'active' | 'canceled' | 'past_due' | 'trialing'
  stripeCustomerId: string
  stripeSubscriptionId: string
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
  trialEnd?: Date
  paymentMethod?: {
    brand: string
    last4: string
  }
}

// Subscription plans configuration
export const SUBSCRIPTION_PLANS: Record<SubscriptionTier, SubscriptionPlan> = {
  free: {
    tier: 'free',
    name: 'Free',
    price: 0,
    yearlyPrice: 0,
    features: [
      'Up to 5 active itineraries',
      'Basic AI generation (5/day)',
      'Standard feed ranking',
      'Community access',
      'Basic analytics',
    ],
    limits: {
      maxItineraries: 5,
      maxPostsPerDay: 10,
      maxStorageGB: 1,
      aiGenerationsPerDay: 5,
      maxCollaborators: 0,
      analyticsHistory: 7, // 7 days
    },
    perks: {
      priorityAIGeneration: false,
      customThemes: false,
      exportCapabilities: false,
      adFree: false,
      advancedAnalytics: false,
      prioritySupport: false,
      earlyAccess: false,
      badgeDisplay: false,
    },
    stripePriceId: '',
    stripePriceIdYearly: '',
  },
  explorer: {
    tier: 'explorer',
    name: 'Explorer',
    price: 4.99,
    yearlyPrice: 49.99, // ~17% discount
    features: [
      'Up to 20 active itineraries',
      'Enhanced AI generation (20/day)',
      'Smart feed ranking',
      'Advanced search',
      'Friend suggestions',
      '14-day analytics history',
      'Export to PDF',
      'No ads',
    ],
    limits: {
      maxItineraries: 20,
      maxPostsPerDay: 30,
      maxStorageGB: 5,
      aiGenerationsPerDay: 20,
      maxCollaborators: 2,
      analyticsHistory: 14,
    },
    perks: {
      priorityAIGeneration: false,
      customThemes: true,
      exportCapabilities: true,
      adFree: true,
      advancedAnalytics: false,
      prioritySupport: false,
      earlyAccess: false,
      badgeDisplay: true,
    },
    stripePriceId: process.env.STRIPE_EXPLORER_MONTHLY_ID || '',
    stripePriceIdYearly: process.env.STRIPE_EXPLORER_YEARLY_ID || '',
  },
  traveler: {
    tier: 'traveler',
    name: 'Traveler',
    price: 9.99,
    yearlyPrice: 99.99, // ~17% discount
    features: [
      'Unlimited itineraries',
      'Priority AI generation (50/day)',
      'All smart algorithms',
      'Advanced analytics dashboard',
      'Budget prediction',
      'Collaborative itineraries (5)',
      '30-day analytics history',
      'Export to PDF & CSV',
      'Custom themes',
      'Priority email support',
      'Early access to new features',
    ],
    limits: {
      maxItineraries: -1, // Unlimited
      maxPostsPerDay: 100,
      maxStorageGB: 20,
      aiGenerationsPerDay: 50,
      maxCollaborators: 5,
      analyticsHistory: 30,
    },
    perks: {
      priorityAIGeneration: true,
      customThemes: true,
      exportCapabilities: true,
      adFree: true,
      advancedAnalytics: true,
      prioritySupport: true,
      earlyAccess: true,
      badgeDisplay: true,
    },
    stripePriceId: process.env.STRIPE_TRAVELER_MONTHLY_ID || '',
    stripePriceIdYearly: process.env.STRIPE_TRAVELER_YEARLY_ID || '',
  },
  nomad: {
    tier: 'nomad',
    name: 'Digital Nomad',
    price: 19.99,
    yearlyPrice: 199.99, // ~17% discount
    features: [
      'Everything in Traveler',
      'Unlimited AI generation',
      'Unlimited collaborators',
      'Unlimited storage',
      '90-day analytics history',
      'API access',
      'White-label exports',
      'Dedicated support',
      'Beta testing program',
      'Exclusive nomad badge',
      'Revenue sharing (affiliate)',
    ],
    limits: {
      maxItineraries: -1,
      maxPostsPerDay: -1,
      maxStorageGB: -1, // Unlimited
      aiGenerationsPerDay: -1,
      maxCollaborators: -1,
      analyticsHistory: 90,
    },
    perks: {
      priorityAIGeneration: true,
      customThemes: true,
      exportCapabilities: true,
      adFree: true,
      advancedAnalytics: true,
      prioritySupport: true,
      earlyAccess: true,
      badgeDisplay: true,
    },
    stripePriceId: process.env.STRIPE_NOMAD_MONTHLY_ID || '',
    stripePriceIdYearly: process.env.STRIPE_NOMAD_YEARLY_ID || '',
  },
}

/**
 * Check if user has access to a feature based on their tier
 */
export function hasFeatureAccess(
  userTier: SubscriptionTier,
  feature: keyof SubscriptionPlan['perks']
): boolean {
  return SUBSCRIPTION_PLANS[userTier].perks[feature] || false
}

/**
 * Check if user has exceeded a limit
 */
export function hasExceededLimit(
  userTier: SubscriptionTier,
  limitType: keyof SubscriptionPlan['limits'],
  currentValue: number
): boolean {
  const limit = SUBSCRIPTION_PLANS[userTier].limits[limitType]
  
  // -1 means unlimited
  if (limit === -1) return false
  
  return currentValue >= limit
}

/**
 * Get remaining usage for a limit
 */
export function getRemainingUsage(
  userTier: SubscriptionTier,
  limitType: keyof SubscriptionPlan['limits'],
  currentValue: number
): number | 'unlimited' {
  const limit = SUBSCRIPTION_PLANS[userTier].limits[limitType]
  
  if (limit === -1) return 'unlimited'
  
  return Math.max(0, limit - currentValue)
}

/**
 * Calculate upgrade value proposition
 */
export function calculateUpgradeValue(
  currentTier: SubscriptionTier,
  targetTier: SubscriptionTier
): {
  priceDifference: number
  yearlySavings: number
  newFeatures: string[]
  removedLimits: string[]
} {
  const current = SUBSCRIPTION_PLANS[currentTier]
  const target = SUBSCRIPTION_PLANS[targetTier]
  
  const priceDifference = target.price - current.price
  const yearlySavings = (current.price * 12) - target.yearlyPrice
  
  // Get new features
  const newFeatures = target.features.filter(
    feature => !current.features.includes(feature)
  )
  
  // Get removed limits
  const removedLimits: string[] = []
  Object.entries(target.limits).forEach(([key, value]) => {
    if (value === -1 && current.limits[key as keyof typeof current.limits] !== -1) {
      removedLimits.push(key.replace(/([A-Z])/g, ' $1').trim())
    }
  })
  
  return {
    priceDifference,
    yearlySavings: yearlySavings > 0 ? yearlySavings : 0,
    newFeatures,
    removedLimits,
  }
}

/**
 * Generate Stripe checkout session parameters
 */
export function generateCheckoutParams(
  tier: SubscriptionTier,
  userId: string,
  isYearly: boolean = false
): {
  priceId: string
  mode: 'subscription'
  successUrl: string
  cancelUrl: string
  metadata: Record<string, string>
} {
  const plan = SUBSCRIPTION_PLANS[tier]
  
  return {
    priceId: isYearly ? plan.stripePriceIdYearly : plan.stripePriceId,
    mode: 'subscription',
    successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/cancel`,
    metadata: {
      userId,
      tier,
      billingCycle: isYearly ? 'yearly' : 'monthly',
    },
  }
}

/**
 * Calculate prorated refund for downgrade
 */
export function calculateProratedRefund(
  subscription: UserSubscription,
  newTier: SubscriptionTier
): number {
  const now = new Date()
  const periodEnd = subscription.currentPeriodEnd
  const daysRemaining = (periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  const totalDays = (periodEnd.getTime() - subscription.currentPeriodStart.getTime()) / (1000 * 60 * 60 * 24)
  
  const currentPlan = SUBSCRIPTION_PLANS[subscription.tier]
  const newPlan = SUBSCRIPTION_PLANS[newTier]
  
  const priceDifference = currentPlan.price - newPlan.price
  const dailyRate = priceDifference / totalDays
  
  return Math.max(0, dailyRate * daysRemaining)
}

/**
 * Get subscription status badge color
 */
export function getTierBadgeColor(tier: SubscriptionTier): string {
  const colors = {
    free: 'bg-gray-500',
    explorer: 'bg-green-500',
    traveler: 'bg-blue-500',
    nomad: 'bg-purple-500',
  }
  
  return colors[tier]
}

/**
 * Get tier display name with emoji
 */
export function getTierDisplayName(tier: SubscriptionTier): string {
  const names = {
    free: '🌍 Free',
    explorer: '🧭 Explorer',
    traveler: '✈️ Traveler',
    nomad: '🌴 Digital Nomad',
  }
  
  return names[tier]
}

/**
 * Check if user is eligible for trial
 */
export function isEligibleForTrial(subscription?: UserSubscription): boolean {
  if (!subscription) return true // New user
  
  // Check if they've already used a trial
  if (subscription.trialEnd) return false
  
  // Check if they're currently on free tier
  return subscription.tier === 'free'
}

/**
 * Calculate trial end date (7 days from now)
 */
export function getTrialEndDate(): Date {
  const now = new Date()
  return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
}

/**
 * Get recommended tier based on usage patterns
 */
export function recommendTier(
  usage: {
    itineraries: number
    aiGenerationsPerDay: number
    storageGB: number
    needsCollaboration: boolean
  }
): SubscriptionTier {
  // Nomad: Heavy users
  if (
    usage.itineraries > 50 ||
    usage.aiGenerationsPerDay > 30 ||
    usage.storageGB > 15 ||
    usage.needsCollaboration
  ) {
    return 'nomad'
  }
  
  // Traveler: Regular users
  if (
    usage.itineraries > 10 ||
    usage.aiGenerationsPerDay > 10 ||
    usage.storageGB > 3
  ) {
    return 'traveler'
  }
  
  // Explorer: Casual users hitting limits
  if (
    usage.itineraries > 3 ||
    usage.aiGenerationsPerDay > 3
  ) {
    return 'explorer'
  }
  
  return 'free'
}
