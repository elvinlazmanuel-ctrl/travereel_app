/**
 * User Location Detection Utility
 * Uses IP geolocation to detect user's country and set appropriate defaults
 */

// Country to currency mapping
export const countryToCurrency: Record<string, string> = {
  'United States': 'USD',
  'USA': 'USD',
  'Philippines': 'PHP',
  'Japan': 'JPY',
  'United Kingdom': 'GBP',
  'UK': 'GBP',
  'Canada': 'CAD',
  'Australia': 'AUD',
  'Eurozone': 'EUR',
  'Germany': 'EUR',
  'France': 'EUR',
  'Italy': 'EUR',
  'Spain': 'EUR',
  'Netherlands': 'EUR',
  'Portugal': 'EUR',
  'Thailand': 'THB',
  'South Korea': 'KRW',
  'India': 'INR',
  'Indonesia': 'IDR',
  'Vietnam': 'VND',
  'Singapore': 'SGD',
  'Malaysia': 'MYR',
  'New Zealand': 'NZD',
  'Switzerland': 'CHF',
  'Sweden': 'SEK',
  'Norway': 'NOK',
  'Brazil': 'BRL',
  'Mexico': 'MXN',
  'China': 'CNY',
  'UAE': 'AED',
  'Saudi Arabia': 'SAR',
  'Turkey': 'TRY',
  'South Africa': 'ZAR',
  'Egypt': 'EGP',
  'Argentina': 'ARS',
  'Chile': 'CLP',
  'Colombia': 'COP',
  'Peru': 'PEN',
}

// Country to region mapping for travel requirements
export const countryToRegion: Record<string, string> = {
  'United States': 'North America',
  'USA': 'North America',
  'Canada': 'North America',
  'Mexico': 'North America',
  'Philippines': 'Southeast Asia',
  'Thailand': 'Southeast Asia',
  'Vietnam': 'Southeast Asia',
  'Indonesia': 'Southeast Asia',
  'Malaysia': 'Southeast Asia',
  'Singapore': 'Southeast Asia',
  'Myanmar': 'Southeast Asia',
  'Cambodia': 'Southeast Asia',
  'Laos': 'Southeast Asia',
  'Japan': 'East Asia',
  'South Korea': 'East Asia',
  'China': 'East Asia',
  'Taiwan': 'East Asia',
  'Hong Kong': 'East Asia',
  'United Kingdom': 'Europe',
  'UK': 'Europe',
  'Germany': 'Europe',
  'France': 'Europe',
  'Italy': 'Europe',
  'Spain': 'Europe',
  'Portugal': 'Europe',
  'Netherlands': 'Europe',
  'Switzerland': 'Europe',
  'Austria': 'Europe',
  'Greece': 'Europe',
  'Australia': 'Oceania',
  'New Zealand': 'Oceania',
  'Fiji': 'Oceania',
  'India': 'South Asia',
  'Sri Lanka': 'South Asia',
  'Nepal': 'South Asia',
  'Brazil': 'South America',
  'Argentina': 'South America',
  'Chile': 'South America',
  'Peru': 'South America',
  'Colombia': 'South America',
  'UAE': 'Middle East',
  'Saudi Arabia': 'Middle East',
  'Turkey': 'Middle East',
  'Egypt': 'Africa',
  'South Africa': 'Africa',
  'Morocco': 'Africa',
  'Kenya': 'Africa',
}

// Common travel requirements by region
export const travelRequirementsByRegion: Record<string, string[]> = {
  'Southeast Asia': [
    'Valid passport (6+ months validity)',
    'Return/onward ticket',
    'Proof of accommodation',
    'Visa may be required (check specific country)',
    'Travel insurance recommended',
    'Vaccination records (if applicable)',
  ],
  'East Asia': [
    'Valid passport (6+ months validity)',
    'Visa required for most countries',
    'Return/onward ticket',
    'Proof of accommodation',
    'Sufficient funds proof',
    'Travel itinerary',
  ],
  'Europe': [
    'Valid passport (3+ months beyond stay)',
    'Schengen visa (if applicable)',
    'Travel insurance (minimum €30,000 coverage)',
    'Return/onward ticket',
    'Proof of accommodation',
    'Proof of sufficient funds',
  ],
  'North America': [
    'Valid passport',
    'Visa or ESTA (for eligible countries)',
    'Return/onward ticket',
    'Proof of accommodation',
    'Customs declaration form',
  ],
  'South Asia': [
    'Valid passport (6+ months validity)',
    'Visa required (e-visa available for some)',
    'Return/onward ticket',
    'Proof of accommodation',
    'Yellow fever vaccination (if coming from endemic area)',
  ],
  'Oceania': [
    'Valid passport',
    'Visa or ETA (Electronic Travel Authority)',
    'Return/onward ticket',
    'Proof of sufficient funds',
    'Health declaration form',
  ],
  'Middle East': [
    'Valid passport (6+ months validity)',
    'Visa required (some offer visa on arrival)',
    'Return/onward ticket',
    'Proof of accommodation',
    'Respect local customs and dress code',
  ],
  'Africa': [
    'Valid passport (6+ months validity)',
    'Visa required for most countries',
    'Yellow fever vaccination certificate',
    'Return/onward ticket',
    'Proof of accommodation',
    'Travel insurance strongly recommended',
  ],
  'South America': [
    'Valid passport (6+ months validity)',
    'Visa requirements vary by country',
    'Return/onward ticket',
    'Proof of accommodation',
    'Yellow fever vaccination (for some countries)',
  ],
}

export interface UserLocation {
  country: string
  countryCode: string
  city: string
  region: string
  currency: string
  travelRequirements: string[]
}

/**
 * Detect user location using IP geolocation
 * Returns location data with currency and travel requirements
 */
export async function detectUserLocation(): Promise<UserLocation | null> {
  try {
    // Try multiple free IP geolocation services for reliability
    const services = [
      'https://ipapi.co/json/',
      'https://ip-api.com/json/',
    ]

    let data: any = null

    for (const service of services) {
      try {
        const response = await fetch(service, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        })

        if (response.ok) {
          data = await response.json()
          break
        }
      } catch (error) {
        console.warn(`Location service ${service} failed:`, error)
        continue
      }
    }

    if (!data) {
      console.warn('All location services failed')
      return null
    }

    // Normalize data from different services
    const country = data.country_name || data.country || 'Unknown'
    const countryCode = data.country_code || data.countryCode || ''
    const city = data.city || 'Unknown'
    
    // Get currency based on detected country
    const currency = countryToCurrency[country] || 'USD'
    
    // Get region and travel requirements
    const region = countryToRegion[country] || 'International'
    const travelRequirements = travelRequirementsByRegion[region] || travelRequirementsByRegion['International'] || []

    return {
      country,
      countryCode,
      city,
      region,
      currency,
      travelRequirements,
    }
  } catch (error) {
    console.error('Location detection failed:', error)
    return null
  }
}

/**
 * Get currency for a specific country
 */
export function getCurrencyForCountry(country: string): string {
  return countryToCurrency[country] || 'USD'
}

/**
 * Get travel requirements for a specific country
 */
export function getTravelRequirementsForCountry(country: string): string[] {
  const region = countryToRegion[country]
  return travelRequirementsByRegion[region] || []
}

/**
 * Store detected location in localStorage for persistence
 */
export function storeDetectedLocation(location: UserLocation) {
  try {
    localStorage.setItem('detected_location', JSON.stringify(location))
    localStorage.setItem('location_detected_at', new Date().toISOString())
  } catch (error) {
    console.warn('Failed to store location:', error)
  }
}

/**
 * Retrieve stored location from localStorage
 */
export function getStoredLocation(): UserLocation | null {
  try {
    const stored = localStorage.getItem('detected_location')
    if (!stored) return null

    // Check if location was detected more than 30 days ago (stale)
    const detectedAt = localStorage.getItem('location_detected_at')
    if (detectedAt) {
      const daysSinceDetection = (Date.now() - new Date(detectedAt).getTime()) / (1000 * 60 * 60 * 24)
      if (daysSinceDetection > 30) {
        localStorage.removeItem('detected_location')
        localStorage.removeItem('location_detected_at')
        return null
      }
    }

    return JSON.parse(stored)
  } catch (error) {
    console.warn('Failed to retrieve stored location:', error)
    return null
  }
}

/**
 * Check if location has already been detected
 */
export function hasDetectedLocation(): boolean {
  return !!localStorage.getItem('detected_location')
}
