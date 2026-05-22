/**
 * Travel Recommendation Engine
 * 
 * Provides personalized recommendations based on:
 * - Popular destinations
 * - User preferences
 * - Similar users' itineraries
 * - Seasonal trends
 */

export interface Recommendation {
  id: string
  type: 'destination' | 'itinerary' | 'activity'
  title: string
  description: string
  imageUrl?: string | null
  location?: string
  country?: string
  score: number
  reason: string
  metadata?: Record<string, unknown>
}

interface ItineraryStats {
  id: string
  title: string
  location: string
  country: string
  savesCount: number
  viewsCount: number
  createdAt: Date
  tags: string[]
  travelType: string
  activities: string[]
}

/**
 * Get popular destinations based on itinerary saves and views
 */
export function getPopularDestinations(
  itineraries: ItineraryStats[],
  limit: number = 10
): Recommendation[] {
  // Group by location + country
  const destinationMap = new Map<string, {
    location: string
    country: string
    totalSaves: number
    totalViews: number
    itineraryCount: number
    topItinerary: ItineraryStats
  }>()

  itineraries.forEach(itinerary => {
    const key = `${itinerary.location}-${itinerary.country}`
    
    if (!destinationMap.has(key)) {
      destinationMap.set(key, {
        location: itinerary.location,
        country: itinerary.country,
        totalSaves: 0,
        totalViews: 0,
        itineraryCount: 0,
        topItinerary: itinerary,
      })
    }

    const dest = destinationMap.get(key)!
    dest.totalSaves += itinerary.savesCount
    dest.totalViews += itinerary.viewsCount
    dest.itineraryCount += 1

    // Keep the most popular itinerary as representative
    if (itinerary.savesCount > dest.topItinerary.savesCount) {
      dest.topItinerary = itinerary
    }
  })

  // Score destinations based on engagement
  const destinations = Array.from(destinationMap.values())
    .map(dest => {
      // Weighted score: saves (60%), views (30%), itinerary count (10%)
      const score = (
        (dest.totalSaves * 0.6) +
        (dest.totalViews * 0.001 * 0.3) + // Normalize views
        (dest.itineraryCount * 0.1)
      )

      return {
        id: `dest-${dest.location}-${dest.country}`,
        type: 'destination' as const,
        title: `${dest.location}, ${dest.country}`,
        description: `${dest.itineraryCount} itineraries · ${dest.totalSaves} saves`,
        imageUrl: dest.topItinerary.id, // Could fetch actual image
        location: dest.location,
        country: dest.country,
        score,
        reason: `Popular destination with ${dest.totalSaves} saves`,
        metadata: {
          totalSaves: dest.totalSaves,
          totalViews: dest.totalViews,
          itineraryCount: dest.itineraryCount,
        },
      }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)

  return destinations
}

/**
 * Recommend itineraries based on user's saved/created itineraries
 */
export function recommendItineraries(
  userId: string,
  userItineraries: ItineraryStats[],
  allItineraries: ItineraryStats[],
  limit: number = 10
): Recommendation[] {
  // Extract user preferences
  const userCountries = new Set(userItineraries.map(i => i.country))
  const userActivities = new Set(userItineraries.flatMap(i => i.activities))
  const userTravelTypes = new Set(userItineraries.map(i => i.travelType))

  // Score all itineraries
  const scored = allItineraries
    .filter(i => !userItineraries.some(ui => ui.id === i.id)) // Exclude user's own
    .map(itinerary => {
      let score = 0
      const reasons: string[] = []

      // Country match (0-0.4)
      if (userCountries.has(itinerary.country)) {
        score += 0.4
        reasons.push(`Similar to your ${itinerary.country} trips`)
      }

      // Activity overlap (0-0.3)
      const activityOverlap = itinerary.activities.filter(a => userActivities.has(a))
      if (activityOverlap.length > 0) {
        score += Math.min(0.3, activityOverlap.length * 0.1)
        reasons.push(`Features activities you enjoy`)
      }

      // Travel type match (0-0.1)
      if (userTravelTypes.has(itinerary.travelType)) {
        score += 0.1
        reasons.push(`Matches your travel style`)
      }

      // Popularity bonus (0-0.2)
      const popularityScore = Math.min(0.2, itinerary.savesCount * 0.01)
      score += popularityScore

      return {
        id: itinerary.id,
        type: 'itinerary' as const,
        title: itinerary.title,
        description: `${itinerary.location}, ${itinerary.country}`,
        location: itinerary.location,
        country: itinerary.country,
        score,
        reason: reasons.join('. ') || 'Trending destination',
        metadata: {
          savesCount: itinerary.savesCount,
          viewsCount: itinerary.viewsCount,
        },
      }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)

  return scored
}

/**
 * Get seasonal recommendations based on current month
 */
export function getSeasonalRecommendations(
  currentMonth: number,
  itineraries: ItineraryStats[],
  limit: number = 5
): Recommendation[] {
  // Define best months for different regions (simplified)
  const seasonalRegions: Record<string, number[]> = {
    'Europe': [5, 6, 7, 8, 9], // May-September
    'Asia': [10, 11, 0, 1, 2, 3], // Oct-March
    'Caribbean': [11, 0, 1, 2, 3], // Dec-March
    'Australia': [11, 0, 1, 2], // Dec-Feb
    'South America': [9, 10, 11, 0, 1, 2], // Sep-Feb
    'Africa': [5, 6, 7, 8, 9], // May-September
  }

  const seasonal = itineraries.filter(itinerary => {
    // Simple region detection from country (could be more sophisticated)
    for (const [region, months] of Object.entries(seasonalRegions)) {
      if (itinerary.country.toLowerCase().includes(region.toLowerCase()) ||
          isCountryInRegion(itinerary.country, region)) {
        return months.includes(currentMonth)
      }
    }
    return false
  })

  return getPopularDestinations(seasonal, limit)
}

/**
 * Helper to check if country is in region (simplified)
 */
function isCountryInRegion(country: string, region: string): boolean {
  const regionCountries: Record<string, string[]> = {
    'Europe': ['france', 'italy', 'spain', 'germany', 'uk', 'greece'],
    'Asia': ['japan', 'thailand', 'china', 'india', 'vietnam'],
    'Caribbean': ['jamaica', 'bahamas', 'cuba', 'barbados'],
    'Australia': ['australia', 'new zealand'],
    'South America': ['brazil', 'argentina', 'chile', 'peru'],
    'Africa': ['morocco', 'egypt', 'kenya', 'south africa'],
  }

  const countries = regionCountries[region] || []
  return countries.some(c => country.toLowerCase().includes(c))
}

/**
 * Combine multiple recommendation sources
 */
export function getPersonalizedRecommendations(
  userId: string,
  userItineraries: ItineraryStats[],
  allItineraries: ItineraryStats[],
  currentMonth: number,
  options: {
    popularLimit?: number
    personalizedLimit?: number
    seasonalLimit?: number
  } = {}
): Recommendation[] {
  const {
    popularLimit = 5,
    personalizedLimit = 10,
    seasonalLimit = 3,
  } = options

  const popular = getPopularDestinations(allItineraries, popularLimit)
  const personalized = recommendItineraries(
    userId,
    userItineraries,
    allItineraries,
    personalizedLimit
  )
  const seasonal = getSeasonalRecommendations(currentMonth, allItineraries, seasonalLimit)

  // Combine and deduplicate
  const combined = [...personalized, ...seasonal, ...popular]
  const seen = new Set<string>()
  const unique = combined.filter(rec => {
    if (seen.has(rec.id)) return false
    seen.add(rec.id)
    return true
  })

  // Sort by score and limit
  return unique
    .sort((a, b) => b.score - a.score)
    .slice(0, personalizedLimit + seasonalLimit)
}
