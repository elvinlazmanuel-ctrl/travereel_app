/**
 * Smart Budget Prediction Algorithm
 * 
 * Predicts travel costs based on:
 * - Destination cost of living
 * - Historical user spending
 * - Activity costs
 * - Duration and travel style
 * - Seasonal price variations
 */

export interface BudgetPrediction {
  totalBudget: number
  dailyBudget: number
  breakdown: BudgetBreakdown
  confidence: number // 0-1
  currency: string
  factors: string[]
}

export interface BudgetBreakdown {
  accommodation: number
  food: number
  transportation: number
  activities: number
  shopping: number
  miscellaneous: number
}

export interface CostEstimate {
  category: string
  min: number
  max: number
  average: number
  currency: string
}

// Cost of living index by country (relative to US = 100)
const COST_OF_LIVING_INDEX: Record<string, number> = {
  'United States': 100,
  'Canada': 95,
  'United Kingdom': 90,
  'France': 85,
  'Germany': 80,
  'Italy': 75,
  'Spain': 70,
  'Japan': 85,
  'Australia': 90,
  'Thailand': 45,
  'Vietnam': 40,
  'Indonesia': 42,
  'Philippines': 38,
  'India': 35,
  'Brazil': 50,
  'Mexico': 45,
  'Argentina': 48,
  'Egypt': 35,
  'Morocco': 40,
  'Turkey': 42,
  'Portugal': 65,
  'Greece': 68,
  'Netherlands': 88,
  'Switzerland': 120,
  'Norway': 110,
  'Sweden': 95,
  'Denmark': 98,
  'Singapore': 95,
  'South Korea': 80,
  'China': 55,
  'Malaysia': 48,
  'Cambodia': 38,
  'Laos': 35,
  'Nepal': 30,
  'Sri Lanka': 38,
  'Peru': 42,
  'Colombia': 40,
  'Chile': 55,
  'South Africa': 45,
  'Kenya': 40,
  'Tanzania': 38,
}

// Average daily costs by category (in USD for US baseline)
const BASE_DAILY_COSTS = {
  accommodation: {
    budget: 30,
    midRange: 80,
    luxury: 200,
  },
  food: {
    budget: 15,
    midRange: 40,
    luxury: 100,
  },
  transportation: {
    budget: 5,
    midRange: 20,
    luxury: 80,
  },
  activities: {
    budget: 10,
    midRange: 30,
    luxury: 100,
  },
  shopping: {
    budget: 5,
    midRange: 20,
    luxury: 100,
  },
  miscellaneous: {
    budget: 5,
    midRange: 15,
    luxury: 50,
  },
}

// Seasonal price multipliers
const SEASONAL_MULTIPLIERS: Record<string, {
  peak: number[]
  shoulder: number[]
  off: number[]
  peakMultiplier: number
  shoulderMultiplier: number
  offMultiplier: number
}> = {
  'Europe': {
    peak: [6, 7, 8], // June-August
    shoulder: [4, 5, 9, 10], // Apr-May, Sep-Oct
    off: [11, 0, 1, 2, 3], // Nov-Mar
    peakMultiplier: 1.4,
    shoulderMultiplier: 1.1,
    offMultiplier: 0.8,
  },
  'Asia': {
    peak: [11, 0, 1, 2], // Nov-Feb (dry season)
    shoulder: [3, 10],
    off: [4, 5, 6, 7, 8, 9], // Monsoon
    peakMultiplier: 1.3,
    shoulderMultiplier: 1.0,
    offMultiplier: 0.7,
  },
  'Caribbean': {
    peak: [11, 0, 1, 2, 3], // Dec-Apr
    shoulder: [4, 5],
    off: [6, 7, 8, 9, 10], // Hurricane season
    peakMultiplier: 1.5,
    shoulderMultiplier: 1.1,
    offMultiplier: 0.6,
  },
}

/**
 * Get cost multiplier for a country based on cost of living
 */
export function getCountryCostMultiplier(country: string): number {
  const index = COST_OF_LIVING_INDEX[country] || 50 // Default to moderate cost
  return index / 100
}

/**
 * Determine travel region from country
 */
export function getRegion(country: string): string {
  const europe = ['france', 'italy', 'spain', 'germany', 'uk', 'greece', 'portugal', 'netherlands', 'switzerland', 'norway', 'sweden', 'denmark']
  const asia = ['japan', 'thailand', 'vietnam', 'indonesia', 'philippines', 'india', 'china', 'malaysia', 'cambodia', 'laos', 'nepal', 'sri lanka', 'south korea', 'singapore']
  const caribbean = ['jamaica', 'bahamas', 'cuba', 'barbados', 'dominican republic']
  
  const lowerCountry = country.toLowerCase()
  
  if (europe.some(c => lowerCountry.includes(c))) return 'Europe'
  if (asia.some(c => lowerCountry.includes(c))) return 'Asia'
  if (caribbean.some(c => lowerCountry.includes(c))) return 'Caribbean'
  
  return 'Other'
}

/**
 * Get seasonal price multiplier based on month and region
 */
export function getSeasonalMultiplier(country: string, month: number): number {
  const region = getRegion(country)
  const seasonalData = SEASONAL_MULTIPLIERS[region]
  
  if (!seasonalData) return 1.0 // No seasonal data, use baseline
  
  if (seasonalData.peak.includes(month)) {
    return seasonalData.peakMultiplier
  }
  if (seasonalData.shoulder.includes(month)) {
    return seasonalData.shoulderMultiplier
  }
  if (seasonalData.off.includes(month)) {
    return seasonalData.offMultiplier
  }
  
  return 1.0
}

/**
 * Calculate budget based on travel style
 */
function getTravelStyleMultiplier(travelType: string): number {
  const styles: Record<string, number> = {
    'budget': 0.7,
    'solo': 1.0,
    'couple': 1.2,
    'family': 1.5,
    'luxury': 2.0,
    'backpacking': 0.6,
  }
  
  return styles[travelType.toLowerCase()] || 1.0
}

/**
 * Predict budget for a trip
 */
export function predictBudget(
  country: string,
  days: number,
  travelType: string = 'solo',
  activities: string[] = [],
  departureDate?: Date,
  userHistory?: Array<{
    actualBudget: number
    country: string
    days: number
  }>
): BudgetPrediction {
  const costMultiplier = getCountryCostMultiplier(country)
  const travelStyleMultiplier = getTravelStyleMultiplier(travelType)
  
  // Get seasonal multiplier if date provided
  let seasonalMultiplier = 1.0
  if (departureDate) {
    seasonalMultiplier = getSeasonalMultiplier(country, departureDate.getMonth())
  }
  
  // Calculate daily costs
  const dailyBreakdown: BudgetBreakdown = {
    accommodation: Math.round(
      BASE_DAILY_COSTS.accommodation.midRange * costMultiplier * travelStyleMultiplier * seasonalMultiplier
    ),
    food: Math.round(
      BASE_DAILY_COSTS.food.midRange * costMultiplier * travelStyleMultiplier
    ),
    transportation: Math.round(
      BASE_DAILY_COSTS.transportation.midRange * costMultiplier
    ),
    activities: Math.round(
      BASE_DAILY_COSTS.activities.midRange * costMultiplier * travelStyleMultiplier
    ),
    shopping: Math.round(
      BASE_DAILY_COSTS.shopping.midRange * costMultiplier * travelStyleMultiplier
    ),
    miscellaneous: Math.round(
      BASE_DAILY_COSTS.miscellaneous.midRange * costMultiplier
    ),
  }
  
  // Adjust for specific activities
  const expensiveActivities = ['skydiving', 'scuba diving', 'helicopter tour', 'safari', 'private tour']
  const cheapActivities = ['walking tour', 'hiking', 'beach', 'museum', 'street food']
  
  const expensiveCount = activities.filter(a => 
    expensiveActivities.some(exp => a.toLowerCase().includes(exp))
  ).length
  
  const cheapCount = activities.filter(a => 
    cheapActivities.some(cheap => a.toLowerCase().includes(cheap))
  ).length
  
  // Adjust activities budget
  if (expensiveCount > cheapCount) {
    dailyBreakdown.activities = Math.round(dailyBreakdown.activities * 1.5)
  } else if (cheapCount > expensiveCount) {
    dailyBreakdown.activities = Math.round(dailyBreakdown.activities * 0.7)
  }
  
  const dailyTotal = Object.values(dailyBreakdown).reduce((sum, cost) => sum + cost, 0)
  const totalBudget = dailyTotal * days
  
  // Calculate confidence based on data availability
  let confidence = 0.6 // Base confidence
  
  if (userHistory && userHistory.length > 0) {
    // Boost confidence if we have user's historical data
    const relevantHistory = userHistory.filter(h => h.country === country)
    confidence = Math.min(0.95, 0.6 + (relevantHistory.length * 0.1))
  }
  
  // Generate explanation factors
  const factors: string[] = []
  if (costMultiplier > 1.2) factors.push('High cost of living destination')
  if (costMultiplier < 0.6) factors.push('Budget-friendly destination')
  if (seasonalMultiplier > 1.2) factors.push('Peak season pricing')
  if (seasonalMultiplier < 0.8) factors.push('Off-season discounts available')
  if (travelStyleMultiplier > 1.3) factors.push(`${travelType} travel style increases costs`)
  if (travelStyleMultiplier < 0.8) factors.push('Budget-conscious travel style')
  if (expensiveCount > 2) factors.push('Premium activities selected')
  if (cheapCount > 2) factors.push('Budget-friendly activities selected')
  
  return {
    totalBudget: Math.round(totalBudget),
    dailyBudget: Math.round(dailyTotal),
    breakdown: dailyBreakdown,
    confidence,
    currency: 'USD',
    factors,
  }
}

/**
 * Compare predicted vs actual budget
 */
export function analyzeBudgetAccuracy(
  predictions: Array<{ predicted: number, actual: number }>
): {
  averageError: number
  accuracy: number
  trend: 'overestimate' | 'underestimate' | 'accurate'
} {
  if (predictions.length === 0) {
    return { averageError: 0, accuracy: 0, trend: 'accurate' }
  }
  
  const errors = predictions.map(p => Math.abs(p.predicted - p.actual) / p.actual)
  const averageError = errors.reduce((sum, e) => sum + e, 0) / errors.length
  
  const accuracy = Math.max(0, 1 - averageError)
  
  const totalDiff = predictions.reduce((sum, p) => sum + (p.predicted - p.actual), 0)
  const trend = totalDiff > 0 ? 'overestimate' : totalDiff < 0 ? 'underestimate' : 'accurate'
  
  return {
    averageError: Math.round(averageError * 100),
    accuracy: Math.round(accuracy * 100),
    trend,
  }
}

/**
 * Suggest budget optimization tips
 */
export function suggestBudgetOptimization(
  country: string,
  budget: BudgetPrediction,
  userBudget?: number
): string[] {
  const tips: string[] = []
  
  const costMultiplier = getCountryCostMultiplier(country)
  
  if (costMultiplier < 0.6) {
    tips.push('✅ Great choice! This is a budget-friendly destination')
  }
  
  if (budget.breakdown.accommodation > budget.totalBudget * 0.35) {
    tips.push('💡 Consider hostels or Airbnb to reduce accommodation costs')
  }
  
  if (budget.breakdown.food > budget.totalBudget * 0.25) {
    tips.push('🍜 Try local street food for authentic and cheaper meals')
  }
  
  if (budget.breakdown.activities > budget.totalBudget * 0.2) {
    tips.push('🎯 Look for free walking tours and public attractions')
  }
  
  tips.push('📅 Travel during shoulder season for 20-30% savings')
  tips.push('🎫 Book attractions online in advance for discounts')
  tips.push('💳 Use travel credit cards for better exchange rates')
  
  if (userBudget && userBudget < budget.totalBudget) {
    const deficit = budget.totalBudget - userBudget
    tips.push(`⚠️ Your budget is $${deficit} below estimated costs`)
    tips.push('🔧 Consider reducing trip duration or choosing cheaper activities')
  }
  
  return tips
}
