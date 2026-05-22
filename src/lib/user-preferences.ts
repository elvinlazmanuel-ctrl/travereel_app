/**
 * User Preference Tracking System
 * 
 * Tracks and analyzes user behavior to build preference profiles:
 * - Destination preferences
 * - Activity preferences  
 * - Travel style preferences
 * - Budget preferences
 * - Social interaction patterns
 */

export interface UserPreferences {
  userId: string
  destinationPreferences: DestinationPreference[]
  activityPreferences: ActivityPreference[]
  travelStylePreferences: Record<string, number>
  budgetRange: {
    min: number
    max: number
    average: number
    currency: string
  }
  socialPatterns: {
    postsPerWeek: number
    avgEngagementRate: number
    preferredPostTypes: Record<string, number>
  }
  lastUpdated: Date
  confidence: number // 0-1, how confident we are in these preferences
}

export interface DestinationPreference {
  country: string
  location?: string
  visitCount: number
  saveCount: number
  viewCount: number
  score: number // 0-1
  lastVisit?: Date
}

export interface ActivityPreference {
  activity: string
  count: number
  score: number // 0-1
  categories: string[]
}

interface UserInteraction {
  type: 'view' | 'save' | 'like' | 'comment' | 'share' | 'create'
  itemId: string
  itemType: 'itinerary' | 'post' | 'destination'
  timestamp: Date
  metadata?: Record<string, unknown>
}

/**
 * Calculate preference score based on interaction weights
 */
export function calculatePreferenceScore(
  interactions: UserInteraction[]
): number {
  const weights = {
    view: 0.1,
    save: 0.5,
    like: 0.3,
    comment: 0.4,
    share: 0.6,
    create: 1.0,
  }

  const totalScore = interactions.reduce((sum, interaction) => {
    return sum + (weights[interaction.type] || 0.1)
  }, 0)

  // Normalize to 0-1 range (cap at 10 interactions worth)
  return Math.min(1, totalScore / 5)
}

/**
 * Extract destination preferences from user interactions
 */
export function extractDestinationPreferences(
  itineraries: Array<{
    country: string
    location?: string
    createdAt: Date
    savesCount: number
    viewsCount: number
  }>,
  interactions: UserInteraction[]
): DestinationPreference[] {
  const destinationMap = new Map<string, DestinationPreference>()

  // Process itineraries
  itineraries.forEach(itinerary => {
    const key = `${itinerary.country}-${itinerary.location || ''}`
    
    if (!destinationMap.has(key)) {
      destinationMap.set(key, {
        country: itinerary.country,
        location: itinerary.location,
        visitCount: 0,
        saveCount: 0,
        viewCount: 0,
        score: 0,
        lastVisit: itinerary.createdAt,
      })
    }

    const dest = destinationMap.get(key)!
    dest.visitCount += 1
    dest.saveCount += itinerary.savesCount
    dest.viewCount += itinerary.viewsCount
    
    if (itinerary.createdAt > (dest.lastVisit || new Date(0))) {
      dest.lastVisit = itinerary.createdAt
    }
  })

  // Calculate scores
  destinationMap.forEach(dest => {
    dest.score = calculatePreferenceScore([
      ...Array(dest.viewCount).fill({ type: 'view' as const }),
      ...Array(dest.saveCount).fill({ type: 'save' as const }),
      ...Array(dest.visitCount).fill({ type: 'create' as const }),
    ])
  })

  return Array.from(destinationMap.values())
    .sort((a, b) => b.score - a.score)
}

/**
 * Extract activity preferences from user's itineraries
 */
export function extractActivityPreferences(
  itineraries: Array<{
    activities: string[]
    travelType: string
  }>
): ActivityPreference[] {
  const activityMap = new Map<string, number>()

  itineraries.forEach(itinerary => {
    itinerary.activities.forEach(activity => {
      const normalizedActivity = activity.toLowerCase().trim()
      activityMap.set(
        normalizedActivity,
        (activityMap.get(normalizedActivity) || 0) + 1
      )
    })
  })

  // Categorize activities
  const activityCategories: Record<string, string[]> = {
    'outdoor': ['hiking', 'trekking', 'camping', 'surfing', 'skiing', 'diving'],
    'cultural': ['museum', 'temple', 'historical', 'heritage', 'art'],
    'food': ['restaurant', 'street food', 'cooking', 'wine', 'cafe'],
    'adventure': ['bungee jumping', 'paragliding', 'zip line', 'rock climbing'],
    'relaxation': ['spa', 'beach', 'yoga', 'meditation', 'resort'],
    'nightlife': ['bar', 'club', 'pub', 'live music'],
    'shopping': ['market', 'mall', 'souvenir', 'boutique'],
  }

  return Array.from(activityMap.entries())
    .map(([activity, count]) => {
      const categories = Object.entries(activityCategories)
        .filter(([_, activities]) => 
          activities.some(a => activity.includes(a))
        )
        .map(([category]) => category)

      return {
        activity,
        count,
        score: Math.min(1, count / 10), // Normalize
        categories,
      }
    })
    .sort((a, b) => b.count - a.count)
}

/**
 * Extract travel style preferences
 */
export function extractTravelStylePreferences(
  itineraries: Array<{
    travelType: string
    budget: number
    days: number
  }>
): Record<string, number> {
  const styleCounts: Record<string, number> = {}
  
  itineraries.forEach(itinerary => {
    const type = itinerary.travelType.toLowerCase()
    styleCounts[type] = (styleCounts[type] || 0) + 1
  })

  // Convert to preferences (0-1 scale)
  const total = itineraries.length
  const preferences: Record<string, number> = {}
  
  Object.entries(styleCounts).forEach(([type, count]) => {
    preferences[type] = count / total
  })

  return preferences
}

/**
 * Calculate user's budget range
 */
export function calculateBudgetRange(
  itineraries: Array<{
    budget: number
    currency: string
    days: number
  }>,
  defaultCurrency: string = 'USD'
): {
  min: number
  max: number
  average: number
  currency: string
} {
  if (itineraries.length === 0) {
    return { min: 0, max: 0, average: 0, currency: defaultCurrency }
  }

  const budgets = itineraries.map(i => i.budget / i.days) // Per-day budget
  const min = Math.min(...budgets)
  const max = Math.max(...budgets)
  const average = budgets.reduce((sum, b) => sum + b, 0) / budgets.length

  return {
    min: Math.round(min),
    max: Math.round(max),
    average: Math.round(average),
    currency: itineraries[0]?.currency || defaultCurrency,
  }
}

/**
 * Calculate social interaction patterns
 */
export function calculateSocialPatterns(
  posts: Array<{
    createdAt: Date
    images: string
    caption: string
    likes: number
    comments: number
  }>,
  timeframeWeeks: number = 12
): {
  postsPerWeek: number
  avgEngagementRate: number
  preferredPostTypes: Record<string, number>
} {
  const now = new Date()
  const cutoffDate = new Date(now.getTime() - timeframeWeeks * 7 * 24 * 60 * 60 * 1000)
  
  const recentPosts = posts.filter(p => new Date(p.createdAt) >= cutoffDate)
  
  // Posts per week
  const postsPerWeek = recentPosts.length / timeframeWeeks
  
  // Average engagement rate
  const engagementRates = recentPosts.map(post => {
    const images = JSON.parse(post.images || '[]')
    const hasImage = images.length > 0
    const baseEngagement = post.likes + post.comments * 2 // Comments weighted higher
    
    // Image posts typically get more engagement
    const imageBonus = hasImage ? 1.2 : 1.0
    
    return baseEngagement * imageBonus
  })
  
  const avgEngagementRate = engagementRates.length > 0
    ? engagementRates.reduce((sum, e) => sum + e, 0) / engagementRates.length
    : 0
  
  // Preferred post types
  const typeCounts: Record<string, number> = {
    photo: 0,
    text: 0,
    story: 0,
  }
  
  recentPosts.forEach(post => {
    const images = JSON.parse(post.images || '[]')
    if (images.length > 3) typeCounts.photo += 1
    else if (images.length > 0) typeCounts.photo += 1
    else if (post.caption && post.caption.length > 200) typeCounts.text += 1
    else typeCounts.text += 1
  })
  
  const total = recentPosts.length || 1
  const preferredPostTypes: Record<string, number> = {}
  Object.entries(typeCounts).forEach(([type, count]) => {
    preferredPostTypes[type] = count / total
  })
  
  return {
    postsPerWeek: Math.round(postsPerWeek * 100) / 100,
    avgEngagementRate: Math.round(avgEngagementRate * 100) / 100,
    preferredPostTypes,
  }
}

/**
 * Build complete user preference profile
 */
export function buildUserPreferences(
  userId: string,
  itineraries: Array<{
    country: string
    location?: string
    activities: string[]
    travelType: string
    budget: number
    currency: string
    days: number
    createdAt: Date
    savesCount: number
    viewsCount: number
  }>,
  posts: Array<{
    createdAt: Date
    images: string
    caption: string
    likes: number
    comments: number
  }>,
  interactions: UserInteraction[] = []
): UserPreferences {
  const destinationPreferences = extractDestinationPreferences(itineraries, interactions)
  const activityPreferences = extractActivityPreferences(itineraries)
  const travelStylePreferences = extractTravelStylePreferences(itineraries)
  const budgetRange = calculateBudgetRange(itineraries)
  const socialPatterns = calculateSocialPatterns(posts)
  
  // Calculate confidence based on data quantity
  const dataPoints = itineraries.length + posts.length + interactions.length
  const confidence = Math.min(1, dataPoints / 50) // Full confidence at 50+ data points
  
  return {
    userId,
    destinationPreferences,
    activityPreferences,
    travelStylePreferences,
    budgetRange,
    socialPatterns,
    lastUpdated: new Date(),
    confidence,
  }
}

/**
 * Get personalized recommendations based on preferences
 */
export function getPreferenceBasedRecommendations(
  preferences: UserPreferences,
  candidates: Array<{
    country: string
    location?: string
    activities: string[]
    tags?: string[]
  }>,
  limit: number = 10
): Array<{
  item: typeof candidates[0]
  matchScore: number
  reasons: string[]
}> {
  const scored = candidates.map(candidate => {
    let score = 0
    const reasons: string[] = []
    
    // Destination match
    const destMatch = preferences.destinationPreferences.find(
      p => p.country === candidate.country
    )
    if (destMatch) {
      score += destMatch.score * 0.4
      reasons.push(`You've visited ${candidate.country} before`)
    }
    
    // Activity match
    const matchingActivities = candidate.activities.filter(activity =>
      preferences.activityPreferences.some(p => 
        activity.toLowerCase().includes(p.activity)
      )
    )
    if (matchingActivities.length > 0) {
      score += Math.min(0.4, matchingActivities.length * 0.1)
      reasons.push(`Matches your activity preferences`)
    }
    
    // Budget match
    // (Would need candidate price to implement fully)
    
    // Normalize score
    score = Math.min(1, score)
    
    return {
      item: candidate,
      matchScore: score,
      reasons,
    }
  })
  
  return scored
    .filter(s => s.matchScore > 0.1)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit)
}
