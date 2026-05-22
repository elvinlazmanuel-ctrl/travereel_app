/**
 * Geographic Utilities for Itinerary Validation
 * 
 * Includes:
 * - Haversine distance calculation
 * - Activity feasibility validation
 * - Route optimization helpers
 */

export interface Coordinates {
  latitude: number
  longitude: number
}

export interface ActivityWithLocation {
  id: string
  title: string
  location: string
  latitude?: number | null
  longitude?: number | null
  startTime: string
  endTime: string
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 * 
 * Formula accounts for Earth's curvature
 * Earth radius: 6,371 km
 */
export function calculateDistance(
  coord1: Coordinates,
  coord2: Coordinates
): number {
  const R = 6371 // Earth's radius in kilometers
  
  const lat1 = toRadians(coord1.latitude)
  const lat2 = toRadians(coord2.latitude)
  const deltaLat = toRadians(coord2.latitude - coord1.latitude)
  const deltaLon = toRadians(coord2.longitude - coord1.longitude)
  
  const a = 
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) *
    Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  
  return R * c
}

/**
 * Calculate walking/driving time between two points
 * Assumes average speeds:
 * - Walking: 5 km/h
 * - Driving: 40 km/h (city average)
 * 
 * Returns time in minutes
 */
export function estimateTravelTime(
  coord1: Coordinates,
  coord2: Coordinates,
  mode: 'walking' | 'driving' = 'driving'
): number {
  const distance = calculateDistance(coord1, coord2)
  
  const speed = mode === 'walking' ? 5 : 40 // km/h
  const timeHours = distance / speed
  
  // Convert to minutes and add 5 min buffer for parking/finding location
  return Math.ceil(timeHours * 60) + 5
}

/**
 * Validate if activities in a day are geographically feasible
 * 
 * Checks:
 * - Travel time between consecutive activities
 * - Total travel time doesn't exceed 20% of day
 * - No impossible transitions (e.g., 100km in 30 minutes)
 */
export function validateDayFeasibility(
  activities: ActivityWithLocation[]
): {
  feasible: boolean
  issues: string[]
  totalTravelTime: number
  totalDistance: number
} {
  const issues: string[] = []
  let totalTravelTime = 0
  let totalDistance = 0
  
  // Filter activities with coordinates
  const activitiesWithCoords = activities.filter(
    a => a.latitude && a.longitude
  )
  
  if (activitiesWithCoords.length < 2) {
    return { feasible: true, issues: [], totalTravelTime: 0, totalDistance: 0 }
  }
  
  // Check consecutive activities
  for (let i = 0; i < activitiesWithCoords.length - 1; i++) {
    const current = activitiesWithCoords[i]
    const next = activitiesWithCoords[i + 1]
    
    const coord1: Coordinates = {
      latitude: current.latitude!,
      longitude: current.longitude!
    }
    const coord2: Coordinates = {
      latitude: next.latitude!,
      longitude: next.longitude!
    }
    
    const distance = calculateDistance(coord1, coord2)
    const travelTime = estimateTravelTime(coord1, coord2)
    
    totalTravelTime += travelTime
    totalDistance += distance
    
    // Check if travel time is feasible
    const timeGap = calculateTimeGap(current.endTime, next.startTime)
    
    if (travelTime > timeGap) {
      issues.push(
        `Not enough time to travel from "${current.title}" to "${next.title}". ` +
        `Need ${travelTime} min, but only ${timeGap} min available.`
      )
    }
    
    // Flag very long distances
    if (distance > 100) {
      issues.push(
        `Long distance (${distance.toFixed(0)} km) between "${current.title}" and "${next.title}"`
      )
    }
  }
  
  // Check if total travel time is reasonable (should be < 20% of waking day ~16 hours = 192 min)
  const maxReasonableTravelTime = 192 // minutes
  if (totalTravelTime > maxReasonableTravelTime) {
    issues.push(
      `Total travel time (${totalTravelTime} min) is excessive for one day`
    )
  }
  
  return {
    feasible: issues.length === 0,
    issues,
    totalTravelTime,
    totalDistance,
  }
}

/**
 * Calculate time gap between two HH:MM times
 * Returns gap in minutes
 */
function calculateTimeGap(endTime: string, startTime: string): number {
  const [endHour, endMin] = endTime.split(':').map(Number)
  const [startHour, startMin] = startTime.split(':').map(Number)
  
  const endMinutes = endHour * 60 + endMin
  const startMinutes = startHour * 60 + startMin
  
  return Math.max(0, startMinutes - endMinutes)
}

/**
 * Optimize activity order to minimize travel distance
 * Uses nearest-neighbor heuristic (simplified TSP)
 */
export function optimizeActivityOrder(
  activities: ActivityWithLocation[]
): ActivityWithLocation[] {
  const activitiesWithCoords = activities.filter(a => a.latitude && a.longitude)
  const activitiesWithoutCoords = activities.filter(a => !a.latitude || !a.longitude)
  
  if (activitiesWithCoords.length <= 2) {
    return activities // No optimization needed
  }
  
  // Start with first activity
  const optimized = [activitiesWithCoords[0]]
  const remaining = new Set(activitiesWithCoords.slice(1))
  
  let current = activitiesWithCoords[0]
  
  while (remaining.size > 0) {
    let nearest: ActivityWithLocation | null = null
    let nearestDistance = Infinity
    
    // Find nearest unvisited activity
    remaining.forEach(activity => {
      const coord1: Coordinates = {
        latitude: current.latitude!,
        longitude: current.longitude!
      }
      const coord2: Coordinates = {
        latitude: activity.latitude!,
        longitude: activity.longitude!
      }
      
      const distance = calculateDistance(coord1, coord2)
      
      if (distance < nearestDistance) {
        nearestDistance = distance
        nearest = activity
      }
    })
    
    if (nearest) {
      optimized.push(nearest)
      remaining.delete(nearest)
      current = nearest
    }
  }
  
  // Add activities without coordinates at the end
  return [...optimized, ...activitiesWithoutCoords]
}

/**
 * Suggest meeting point between two coordinates
 * Returns midpoint coordinates
 */
export function findMidpoint(
  coord1: Coordinates,
  coord2: Coordinates
): Coordinates {
  const lat1 = toRadians(coord1.latitude)
  const lon1 = toRadians(coord1.longitude)
  const lat2 = toRadians(coord2.latitude)
  const lon2 = toRadians(coord2.longitude)
  
  const dLon = lon2 - lon1
  
  const Bx = Math.cos(lat2) * Math.cos(dLon)
  const By = Math.cos(lat2) * Math.sin(dLon)
  
  const lat3 = Math.atan2(
    Math.sin(lat1) + Math.sin(lat2),
    Math.sqrt(
      (Math.cos(lat1) + Bx) * (Math.cos(lat1) + Bx) + By * By
    )
  )
  const lon3 = lon1 + Math.atan2(By, Math.cos(lat1) + Bx)
  
  return {
    latitude: lat3 * (180 / Math.PI),
    longitude: lon3 * (180 / Math.PI),
  }
}

/**
 * Check if a coordinate is within radius of another coordinate
 * Returns true if within radius (in km)
 */
export function isWithinRadius(
  center: Coordinates,
  point: Coordinates,
  radiusKm: number
): boolean {
  const distance = calculateDistance(center, point)
  return distance <= radiusKm
}
